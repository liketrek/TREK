/** The people a balance is owed to or by, as avatar pills after a short lead such as "to". */
export function FlowPills({
  ids,
  lead,
  Avatar,
  name,
}: {
  ids: number[];
  lead: string;
  Avatar: (p: { id: number; size?: number }) => React.JSX.Element;
  name: (id: number) => string;
}) {
  const uniq = Array.from(new Set(ids));
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span className="text-content-faint">{lead}</span>
      {uniq.map((id) => (
        <span
          key={id}
          className="border border-edge bg-surface-secondary text-content"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            paddingBlock: 3,
            paddingInline: '3px 10px',
            borderRadius: 999,
            fontSize: 'calc(12px * var(--fs-scale-body, 1))',
            fontWeight: 600,
          }}
        >
          <Avatar id={id} size={18} />
          {name(id)}
        </span>
      ))}
    </span>
  );
}
