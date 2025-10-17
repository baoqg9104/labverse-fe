
export function OptionButton({
  label,
  selected,
  disabled,
  onClick,
  variant = "choice",
  status,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "choice" | "boolean";
  status?: "correct" | "incorrect" | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full text-left group relative overflow-hidden rounded-xl ring-1 p-4 flex items-start gap-3 transition-all cursor-pointer",
        "active:scale-[0.99]",
        status === "correct"
          ? "bg-green-50 ring-green-300 hover:ring-green-400"
          : status === "incorrect"
          ? "bg-red-50 ring-red-300 hover:ring-red-400"
          : selected
          ? "bg-blue-50 ring-blue-400 hover:ring-blue-500"
          : "bg-white ring-gray-200 hover:shadow-md hover:ring-blue-400",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <span
        className={[
          variant === "boolean" ? "rounded-md" : "rounded-full",
          "mt-0.5 inline-flex size-5 border-2",
          status === "correct"
            ? "border-green-600 bg-green-600"
            : status === "incorrect"
            ? "border-red-600 bg-red-600"
            : selected
            ? "border-blue-600 bg-blue-600"
            : "border-gray-300",
          "transition-colors flex-shrink-0",
        ].join(" ")}
      />
      <span className="text-gray-700 group-hover:text-gray-900 text-sm sm:text-base">
        {label}
      </span>
    </button>
  );
}
