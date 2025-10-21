import type { LabLevel } from "../../../types/lab";

type Props = {
  title: string;
  slug: string;
  autoSlug: boolean;
  description: string;
  level: LabLevel;
  onChangeTitle: (v: string) => void;
  onChangeSlug: (v: string) => void;
  onToggleAutoSlug: (v: boolean) => void;
  onChangeDescription: (v: string) => void;
  onChangeLevel: (v: LabLevel) => void;
};

export default function MetaForm({
  title,
  slug,
  autoSlug,
  description,
  level,
  onChangeTitle,
  onChangeSlug,
  onToggleAutoSlug,
  onChangeDescription,
  onChangeLevel,
}: Props) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 mb-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🗒️</span>New Lab Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter lab title"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="cursor-pointer"
                checked={autoSlug}
                onChange={(e) => onToggleAutoSlug(e.target.checked)}
              />
              Auto-generate from Title
            </label>
          </div>
          <input
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50"
            placeholder="lab-title"
            value={slug}
            disabled={autoSlug}
            onChange={(e) => onChangeSlug(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={4}
            placeholder="Short description of the lab"
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text sm font-medium text-gray-700 mb-1">
            Difficulty
          </label>
          <select
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={level}
            onChange={(e) => onChangeLevel(e.target.value as LabLevel)}
          >
            <option value="Basic">Basic</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>
    </div>
  );
}
