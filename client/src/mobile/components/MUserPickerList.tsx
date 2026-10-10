interface MUserPickerListProps {
  users: { id: number; username: string }[];
  selected: number | null;
  onPick: (id: number) => void;
}

/**
 * The unfolded user list under a phone sheet's user picker (the vacay invite
 * and share sheets): one row per user, the picked one tinted.
 */
export default function MUserPickerList({ users, selected, onPick }: MUserPickerListProps) {
  return (
    <div className="mt-[6px] max-h-[180px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[6px]">
      {users.map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => onPick(u.id)}
          className={`flex w-full items-center gap-[9px] rounded-[10px] px-[10px] py-[9px] text-start text-[0.8125rem] font-semibold ${
            u.id === selected ? 'bg-[color:var(--m-ic)]' : ''
          }`}
        >
          <span className="min-w-0 flex-1 truncate">{u.username}</span>
        </button>
      ))}
    </div>
  );
}
