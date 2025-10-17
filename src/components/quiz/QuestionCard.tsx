import type { Question } from "../../types/quiz";
import { OptionButton } from "./OptionButton";
import { ShortTextInput } from "./ShortTextInput";

export type QuestionCardProps = {
  question: Question;
  value: string | string[] | boolean | undefined;
  submitting?: boolean;
  disabled?: boolean;
  onChange: (answer: string | string[] | boolean) => void;
  onSubmit?: () => void; // for multi or text
  feedback?: "correct" | "incorrect" | undefined;
};

export function QuestionCard({
  question,
  value,
  submitting,
  disabled,
  onChange,
  onSubmit,
  feedback,
}: QuestionCardProps) {
  const type = question.type;
  const choices = question.choices ?? [];
  // derive by type

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
            {type === 0 && "Single Choice"}
            {type === 1 && "Multiple Choice"}
            {type === 2 && "True / False"}
            {type === 3 && "Short Text"}
          </div>
          <p className="mt-2 text-gray-900 font-semibold text-lg sm:text-xl">
            {question.text}
          </p>
          {type === 1 && (
            <div className="mt-1 text-xs text-gray-500">Select all that apply</div>
          )}
        </div>
      </div>

      <div>
        {type === 0 && (
          <div className="space-y-3">
            {choices.map((c, idx) => (
              <OptionButton
                key={idx}
                label={c}
                selected={value === c}
                disabled={disabled || submitting}
                status={feedback}
                onClick={() => onChange(c)}
              />
            ))}
          </div>
        )}

        {type === 1 && (
          <div className="space-y-3">
            {choices.map((c, idx) => {
              const arr = (value as string[]) || [];
              const sel = arr.includes(c);
              return (
                <OptionButton
                  key={idx}
                  label={c}
                  selected={sel}
                  disabled={disabled || submitting}
                  status={feedback && sel ? feedback : undefined}
                  onClick={() => {
                    if (sel) {
                      onChange(arr.filter((x) => x !== c));
                    } else {
                      onChange([...arr, c]);
                    }
                  }}
                />
              );
            })}
            {onSubmit && (
              <button
                onClick={onSubmit}
                disabled={submitting || disabled || !((value as string[])?.length)}
                className="mt-2 inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md cursor-pointer disabled:opacity-60"
              >
                Submit
              </button>
            )}
          </div>
        )}

        {type === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <OptionButton
              label="True"
              variant="boolean"
              selected={value === true}
              disabled={disabled || submitting}
              status={feedback && value === true ? feedback : undefined}
              onClick={() => onChange(true)}
            />
            <OptionButton
              label="False"
              variant="boolean"
              selected={value === false}
              disabled={disabled || submitting}
              status={feedback && value === false ? feedback : undefined}
              onClick={() => onChange(false)}
            />
          </div>
        )}

        {type === 3 && (
          <div className="space-y-3">
            <ShortTextInput
              value={(value as string) || ""}
              onChange={(v) => onChange(v)}
              disabled={disabled || submitting}
            />
            {onSubmit && (
              <button
                onClick={onSubmit}
                disabled={
                  submitting ||
                  disabled ||
                  !((value as string)?.trim().length > 0)
                }
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md cursor-pointer disabled:opacity-60"
              >
                Submit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
