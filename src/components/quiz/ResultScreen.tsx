import {
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  PolarAngleAxis,
} from "recharts";

export function ResultScreen({
  total,
  correct,
  score,
  onRestart,
}: {
  total: number;
  correct: number;
  score: number; // xp or points
  onRestart?: () => void;
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
