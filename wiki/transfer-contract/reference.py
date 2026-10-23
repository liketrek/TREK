"""Versioned transfer validation and three-way plans; no network or database writes.

The same wire rules are proposed upstream. Absence, null and empty values remain
different. A plan never interprets an omitted record as permission to delete it.
"""
import copy
import hashlib
import json
import math

FORMAT = 'travel-transfer/1'
MAX_RECORDS = 20000
MAX_GRAPH_BYTES = 64 * 1024 * 1024
CHUNK_BYTES = 1024 * 1024
MAX_FILE_BYTES = 512 * 1024 * 1024
FEATURES = frozenset({'complete-snapshots', 'field-manifests', 'original-chunks',
    'historical-attribution', 'silent-apply', 'conditional-apply', 'durable-receipts',
    'protected-extensions', 'graph-staging', 'idempotent-trip-create', 'scoped-apply'})
MISSING = {'$transfer': 'absent'}


class TransferError(ValueError):
    pass


def canonical(value):
    try:
        return json.dumps(value, sort_keys=True, ensure_ascii=False,
            separators=(',', ':'), allow_nan=False).encode('utf-8')
    except (ValueError, TypeError, UnicodeError, RecursionError):
        raise TransferError('Transfer contains an invalid JSON value') from None


def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def token(value, maximum=200):
    return isinstance(value, str) and 0 < len(value) <= maximum and not any(ord(c) < 32 for c in value)


def json_value(value, depth=0):
    if depth > 30:
        raise TransferError('Transfer nesting exceeds the limit')
    if value is None or type(value) in (bool, int, str):
        if isinstance(value, str) and ('\0' in value or len(value) > 1024 * 1024):
            raise TransferError('Transfer text exceeds the limit')
        return
    if isinstance(value, float):
        # Exact money/weights must use strings; geometry may be a finite float.
        if not math.isfinite(value):
            raise TransferError('Non-finite transfer number')
        return
    if isinstance(value, list):
        for item in value:
            json_value(item, depth + 1)
        return
    if isinstance(value, dict):
        if value == MISSING:
            raise TransferError('Reserved transfer marker in source data')
        for name, item in value.items():
            if not token(name, 512):
                raise TransferError('Invalid transfer field name')
            json_value(item, depth + 1)
        return
    raise TransferError('Unsupported transfer value')


def capabilities(value):
    if (not isinstance(value, dict) or value.get('format') != FORMAT
            or not isinstance(value.get('features'), list)
            or not all(isinstance(item, str) for item in value['features'])
            or not FEATURES <= set(value['features'])
            or type(value.get('max_original_bytes')) is not int
            or value['max_original_bytes'] < MAX_FILE_BYTES
            or type(value.get('chunk_bytes')) is not int
            or not 1 <= value['chunk_bytes'] <= CHUNK_BYTES):
        raise TransferError('TREK does not support the complete travel transfer contract')
    return value


def snapshot(value):
    if not isinstance(value, dict) or set(value) != {'format', 'trip', 'revision', 'complete', 'records', 'originals'}:
        raise TransferError('Invalid complete snapshot envelope')
    if value['format'] != FORMAT or value['complete'] is not True:
        raise TransferError('A complete supported snapshot is required')
    if not token(value['trip']) or not token(value['revision']):
        raise TransferError('Snapshot identity/revision missing')
    records, originals = value['records'], value['originals']
    if not isinstance(records, list) or len(records) > MAX_RECORDS or not isinstance(originals, list):
        raise TransferError('Snapshot record limit exceeded')
    if len(canonical(value)) > MAX_GRAPH_BYTES:
        raise TransferError('Snapshot exceeds the graph byte limit')
    seen = set()
    for record in records:
        if not isinstance(record, dict) or set(record) != {'id', 'kind', 'fields', 'references', 'visibility', 'source'}:
            raise TransferError('Invalid transfer record')
        if not token(record['id']) or record['id'] in seen or not token(record['kind'], 100):
            raise TransferError('Invalid or duplicate source identity')
        seen.add(record['id'])
        if record['visibility'] not in ('private', 'trip'):
            raise TransferError('Unreviewable record audience')
        if not isinstance(record['fields'], dict) or not isinstance(record['references'], dict) or not isinstance(record['source'], dict):
            raise TransferError('Record fields, references and source manifest are required')
        if record['fields'].get('audience') in ('private','trip') and record['fields']['audience']!=record['visibility']:
            raise TransferError('Record and field audiences disagree')
        # Every source field must have an explicit destination or be preserved as
        # an extension. Unknown/unavailable is distinct from supplied null.
        manifest = record['source'].get('fields')
        if not isinstance(manifest, dict) or set(manifest) != set(record['fields']):
            raise TransferError('Incomplete source field manifest')
        if any(state not in ('present', 'empty', 'unknown', 'unavailable', 'extension') for state in manifest.values()):
            raise TransferError('Unsupported field-manifest state')
        json_value(record)
    for record in records:
        for target in record['references'].values():
            if target is not None and (not isinstance(target, str) or target not in seen):
                raise TransferError('Snapshot has a missing or inaccessible relationship')
    files = set()
    for item in originals:
        if (not isinstance(item, dict) or set(item) != {'id', 'record', 'size', 'sha256'}
                or not token(item['id']) or item['id'] in files or not token(item['record']) or item['record'] not in seen
                or type(item['size']) is not int or not 0 <= item['size'] <= MAX_FILE_BYTES
                or not isinstance(item['sha256'], str) or len(item['sha256']) != 64
                or any(c not in '0123456789abcdef' for c in item['sha256'])):
            raise TransferError('Invalid original-file manifest')
        files.add(item['id'])
    return copy.deepcopy(value)


def indexed(value):
    return {record['id']: record for record in value['records']}


def pointer(*parts):
    return '/'.join(part.replace('~', '~0').replace('/', '~1') for part in parts)


def merge(baseline, local, remote, direction='both', choices=None):
    """Propose both resulting graphs. Applying them requires their exact revisions.

    All changed record properties (including references/audience/source metadata)
    are compared. Destruction and audience changes always require an explicit
    choice even if only one side changed. Each side keeps its independent trip ID.
    """
    if direction not in ('pull', 'push', 'both'):
        raise TransferError('Choose a transfer direction')
    snapshot(local); snapshot(remote)
    split = baseline is not None and set(baseline) == {'local','remote'}
    if baseline is not None:
        if split:snapshot(baseline['local']); snapshot(baseline['remote'])
        else:snapshot(baseline)
    choices = choices or {}
    if not isinstance(choices, dict) or any(v not in ('local', 'remote') for v in choices.values()):
        raise TransferError('Invalid conflict choice')
    base = indexed(baseline['local'] if split else baseline) if baseline else {}
    remote_base = indexed(baseline['remote']) if split else base
    left, right = indexed(local), indexed(remote)
    result, conflicts, used = {}, [], set()
    for identifier in sorted(base.keys() | remote_base.keys() | left.keys() | right.keys()):
        b, l, r = (v.get(identifier, MISSING) for v in (base, left, right))
        rb=remote_base.get(identifier,MISSING)
        # One-way sync tracks each side independently. An unchanged source is
        # never a fresh deletion/overwrite proposal against destination edits.
        if baseline is not None and ((direction=='pull' and r==rb) or (direction=='push' and l==b)):
            picked=l if direction=='pull' else r
            if picked!=MISSING:result[identifier]=picked
            continue
        if l == r:
            if l != MISSING: result[identifier] = l
            continue
        if l == MISSING or r == MISSING:
            destructive = b != MISSING or rb != MISSING
            key = pointer(identifier, '$record')
            selected = choices.get(key)
            if selected: used.add(key)
            if destructive and not selected:
                conflicts.append({'key': key, 'reason': 'deletion', 'local': l, 'remote': r})
                continue
            picked = l if selected == 'local' else r if selected == 'remote' else r if l == MISSING else l
            if picked != MISSING: result[identifier] = picked
            continue
        merged = {'id': identifier, 'kind': l['kind'], 'fields': {}, 'references': {}, 'source': {}}
        for section in ('kind', 'visibility', 'fields', 'references', 'source'):
            names = sorted(l[section].keys() | r[section].keys() | (b.get(section, {}).keys() if b != MISSING else set())) if isinstance(l[section], dict) else [None]
            for name in names:
                lv = l[section].get(name, MISSING) if name is not None else l[section]
                rv = r[section].get(name, MISSING) if name is not None else r[section]
                bv = b.get(section, {}).get(name, MISSING) if name is not None and b != MISSING else b.get(section, MISSING) if b != MISSING else MISSING
                rbv = rb.get(section, {}).get(name, MISSING) if name is not None and rb != MISSING else rb.get(section, MISSING) if rb != MISSING else MISSING
                key = pointer(identifier, section, name) if name is not None else pointer(identifier, section)
                choice = choices.get(key)
                if choice: used.add(key)
                unchanged_source=baseline is not None and (direction=='pull' and rv==rbv or direction=='push' and lv==bv)
                conflict = not unchanged_source and lv != rv and (lv != bv and rv != rbv or section in ('visibility', 'kind') or (bv != MISSING or rbv!=MISSING) and (lv == MISSING or rv == MISSING))
                if conflict and not choice:
                    conflicts.append({'key': key, 'reason': 'audience' if section == 'visibility' else 'field', 'local': lv, 'remote': rv})
                    continue
                selected = lv if choice == 'local' else rv if choice == 'remote' else (lv if direction=='pull' else rv) if unchanged_source else rv if lv == bv else lv
                if selected != MISSING:
                    if name is None: merged[section] = selected
                    else: merged[section][name] = selected
        result[identifier] = merged
    if set(choices) != used:
        raise TransferError('Conflict choices no longer match this plan')
    if conflicts:
        return {'conflicts': conflicts, 'local': None, 'remote': None}
    # File manifests participate in the same conflict/revision boundary. A changed
    # original is a new identity/version, never an in-place overwrite.
    originals = {}
    for item in local['originals'] + remote['originals']:
        if item['id'] in originals and originals[item['id']] != item:
            raise TransferError('Original-file identity changed; retain both versions')
        originals[item['id']] = item
    def output(template):
        records = [result[k] for k in sorted(result)]
        ids = set(result)
        return snapshot({**template, 'records': records,
            'originals': [v for k, v in sorted(originals.items()) if v['record'] in ids]})
    return {'conflicts': [], 'local': output(local) if direction != 'push' else local,
        'remote': output(remote) if direction != 'pull' else remote}
