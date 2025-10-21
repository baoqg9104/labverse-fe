import {
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  PolarAngleAxis,
} from "recharts";
import { useState } from "react";
import { labsApi } from "../../libs/labsApi";
import { toast } from "react-toastify";

export function ResultScreen({
  total,
  correct,
  score,
  labId,
  onRestart,
  onRated,
}: {
  total: number;
  correct: number;
  score: number; // xp or points
  labId: number;
  onRestart?: () => void;
  onRated?: (score: number) => void;
}) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const data = [
    {
      name: "Correct",
      value: pct,
      fill: pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444",
    },
  ];
  const mood =
    pct >= 90
      ? "Outstanding!"
      : pct >= 75
      ? "Great job!"
      : pct >= 50
      ? "Nice effort!"
      : "Keep practicing!";
  const emoji = pct >= 90 ? "🏆" : pct >= 75 ? "🎉" : pct >= 50 ? "👏" : "🚀";
  return (
    <div className="text-center space-y-4">
      <div className="text-3xl">{emoji}</div>
      <h3 className="text-2xl font-extrabold text-gray-900">{mood}</h3>
      <p className="text-gray-600">
        You answered <span className="font-semibold">{correct}</span> of
        <span className="font-semibold"> {total}</span> correctly.
      </p>
      <div className="h-44 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            {/* Fix domain so bar length reflects actual percentage instead of filling full circle */}
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={8} />
            <Tooltip />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-2xl font-bold text-gray-900">{pct}%</div>
        </div>
      </div>
      <div className="text-sm text-gray-700">
        Score: <span className="font-semibold">{score}</span> • Accuracy:{" "}
        <span className="font-semibold">{pct}%</span>
      </div>
      {/* Rating section */}
      <RatingSection
        labId={labId}
        onRated={(s) => {
          toast.success("Thanks for your feedback!");
          onRated?.(s);
        }}
      />
      {onRestart && (
        <button
          onClick={onRestart}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

function RatingSection({
  labId,
  onRated,
}: {
  labId?: number;
  onRated?: (score: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const options: { score: number; emoji: string; label: string }[] = [
    { score: 1, emoji: "😡", label: "Very dissatisfied" },
    { score: 2, emoji: "😕", label: "Dissatisfied" },
    { score: 3, emoji: "😐", label: "Neutral" },
    { score: 4, emoji: "🙂", label: "Satisfied" },
    { score: 5, emoji: "🤩", label: "Very satisfied" },
  ];

  const submit = async (score: number) => {
    console.log(labId);
    if (!labId) return toast.warn("Cannot submit rating: lab id missing");
    setSubmitting(true);
    try {
      await labsApi.rate(labId, score);
      setDone(true);
      onRated?.(score);
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  if (done)
    return (
      <div className="mt-3 text-green-600 font-medium">
        Thank you for rating!
      </div>
    );

  return (
    <div className="mt-4">
      <div className="text-sm text-gray-600 mb-2">How was this lab?</div>
      <div className="flex items-center justify-center gap-3">
        {options.map((o) => (
          <button
            key={o.score}
            onClick={() => {
              setSelected(o.score);
              void submit(o.score);
            }}
            disabled={submitting}
            title={o.label}
            className={`text-3xl p-2 rounded-lg transition-transform hover:scale-110 focus:outline-none ${{
              true: "",
            }}`}
          >
            <span
              style={{ opacity: selected === o.score ? 1 : 0.85 }}
              className="cursor-pointer"
            >
              {o.emoji}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
