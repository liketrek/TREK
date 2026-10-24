"""Pure contract/concurrency tests, also used as upstream conformance examples."""
import copy
import unittest
import reference as wire


def graph(title='Example'):
    return {'format': wire.FORMAT, 'trip': 'source-trip', 'revision': 'r1', 'complete': True,
        'records': [{'id': 'trip', 'kind': 'trip', 'visibility': 'trip',
            'fields': {'title': title, 'notes': ''}, 'references': {},
            'source': {'fields': {'title': 'present', 'notes': 'empty'}}}], 'originals': []}


class TransferContract(unittest.TestCase):
    def test_one_way_tracks_both_baselines_without_repeated_deletion_or_echo(self):
        local=graph('Local');remote=graph('Remote')
        baseline={'local':copy.deepcopy(local),'remote':copy.deepcopy(remote)}
        local['records'][0]['fields']['notes']='Destination writing stays local'
        plan=wire.merge(baseline,local,remote,'pull')
        self.assertEqual(plan['conflicts'],[])
        self.assertEqual(plan['local'],local)
        self.assertEqual(plan['remote'],remote)
        remote['records'][0]['fields']['title']='Remote changed'
        plan=wire.merge(baseline,local,remote,'pull')
        self.assertEqual(plan['conflicts'],[])
        self.assertEqual(plan['local']['records'][0]['fields'],{'title':'Remote changed','notes':'Destination writing stays local'})

    def test_child_only_changes_null_empty_and_protected_extension_survive(self):
        base = graph(); local = copy.deepcopy(base); remote = copy.deepcopy(base)
        local['records'][0]['fields']['title'] = 'Local title'
        remote['records'][0]['fields']['notes'] = None
        remote['records'][0]['source']['fields']['notes'] = 'unknown'
        remote['records'].append({'id':'child', 'kind':'trek:unmodelled', 'visibility':'private',
            'fields':{'original':{'empty':[], 'null':None, 'amount':'1234567890123456789.00'}},
            'references':{'trip':'trip'}, 'source':{'fields':{'original':'extension'}}})
        plan = wire.merge(base, local, remote)
        self.assertEqual(plan['conflicts'], [])
        for target in (plan['local'], plan['remote']):
            root = wire.indexed(target)['trip']
            self.assertEqual(root['fields'], {'title':'Local title', 'notes':None})
            self.assertEqual(wire.indexed(target)['child'], remote['records'][1])
        # A settled graph is a no-op, not an echo of the old direction.
        again = wire.merge(plan['local'], plan['local'], plan['remote'])
        self.assertEqual(again['conflicts'], [])
        self.assertEqual(wire.digest(again['local']), wire.digest(plan['local']))

    def test_competing_fields_and_audience_changes_need_exact_choices(self):
        base=graph(); local=graph('Local'); remote=graph('Remote')
        remote['records'][0]['visibility']='private'
        plan=wire.merge(base,local,remote)
        self.assertEqual({c['key'] for c in plan['conflicts']},{'trip/fields/title','trip/visibility'})
        self.assertIsNone(plan['local'])
        selected=wire.merge(base,local,remote,choices={'trip/fields/title':'local','trip/visibility':'remote'})
        self.assertEqual(selected['local']['records'][0]['fields']['title'],'Local')
        self.assertEqual(selected['remote']['records'][0]['visibility'],'private')
        with self.assertRaises(wire.TransferError):
            wire.merge(base,local,remote,choices={'outdated/fields/title':'local'})

    def test_deletion_is_never_implicit_and_pull_does_not_push(self):
        base=graph(); local=graph(); remote=graph()
        remote['records']=[]
        plan=wire.merge(base,local,remote)
        self.assertEqual(plan['conflicts'][0]['reason'],'deletion')
        selected=wire.merge(base,local,remote,choices={'trip/$record':'local'})
        self.assertEqual(selected['local']['records'],local['records'])
        remote=graph('New remote')
        plan=wire.merge(base,local,remote,direction='pull')
        self.assertEqual(plan['remote'],remote)
        self.assertEqual(plan['local']['records'][0]['fields']['title'],'New remote')

    def test_malformed_partial_dangling_and_unmanifested_data_are_rejected(self):
        for mutate in (lambda g:g.update(complete=False),
                       lambda g:g['records'].append(g['records'][0]),
                       lambda g:g['records'][0]['references'].update(parent='inaccessible'),
                       lambda g:g['records'][0]['fields'].update(unlisted='hidden'),
                       lambda g:g['records'][0]['fields'].update(notes=wire.MISSING),
                       lambda g:g['originals'].append({'id':'f','record':'trip','sha256':'0'*64,'size':wire.MAX_FILE_BYTES+1})):
            value=graph();mutate(value)
            with self.subTest(value=value),self.assertRaises(wire.TransferError):wire.snapshot(value)

    def test_original_ids_cannot_change_bytes_and_capabilities_are_all_or_nothing(self):
        local=graph();remote=graph()
        local['originals']=[{'id':'photo','record':'trip','sha256':'0'*64,'size':16}]
        remote['originals']=[{'id':'photo','record':'trip','sha256':'1'*64,'size':16}]
        with self.assertRaises(wire.TransferError):wire.merge(graph(),local,remote)
        supported={'format':wire.FORMAT,'features':sorted(wire.FEATURES),
            'max_original_bytes':wire.MAX_FILE_BYTES,'chunk_bytes':wire.CHUNK_BYTES}
        self.assertEqual(wire.capabilities(supported),supported)
        supported['features'].remove('durable-receipts')
        with self.assertRaises(wire.TransferError):wire.capabilities(supported)


if __name__=='__main__':unittest.main()
