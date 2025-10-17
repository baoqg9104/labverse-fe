export function ShortTextInput({
  value,
  onChange,
  placeholder = "Type your answer...",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={4}
      className="w-full rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-3 text-sm sm:text-base disabled:opacity-60"
    />
  );
}
