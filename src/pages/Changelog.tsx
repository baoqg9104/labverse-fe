import { changelog as changelogData } from "../data/changelog";
import { useTranslation } from "react-i18next";

const Badge = ({ type, upcoming }: { type: string; upcoming?: boolean }) => {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium";
  const { t } = useTranslation();
  switch (type) {
    case "New":
      return (
        <span className={base + " bg-emerald-100 text-emerald-800"}>
          <svg
            className="-ml-0.5 mr-1.5 h-3 w-3 text-emerald-600"
            fill="currentColor"
            viewBox="0 0 8 8"
          >
            <circle cx="4" cy="4" r="3" />
          </svg>
          {t("changelog.labels.New")}
        </span>
      );
    case "Improved":
      return (
        <span className={base + " bg-sky-100 text-sky-800"}>
          <svg
            className="-ml-0.5 mr-1.5 h-3 w-3 text-sky-600"
            fill="currentColor"
            viewBox="0 0 8 8"
          >
            <path
              d="M1 4h6M4 1v6"
              stroke="currentColor"
              strokeWidth={1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("changelog.labels.Improved")}
        </span>
      );
    case "Fixed":
      return (
        <span className={base + " bg-amber-100 text-amber-800"}>
          <svg
            className="-ml-0.5 mr-1.5 h-3 w-3 text-amber-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {t("changelog.labels.Fixed")}
        </span>
      );
    case "Removed":
      return (
        <span className={base + " bg-red-100 text-red-800"}>
          {t("changelog.labels.Removed")}
        </span>
      );
    case "Deprecated":
      return (
        <span className={base + " bg-gray-100 text-gray-800"}>
          {t("changelog.labels.Deprecated")}
        </span>
      );
    default:
      return (
        <span className={base + " bg-gray-100 text-gray-800"}>
          {type}
          {upcoming && (
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 rounded px-1.5 py-0.5">
              {t("changelog.labels.Upcoming")}
            </span>
          )}
        </span>
      );
  }
};

export const Changelog = () => {
  const { t, i18n } = useTranslation();
  // Sort by semantic version descending (newest first). If equal, fallback to date.
  const semverCompare = (a: string, b: string) => {
    const pa = a.split(".").map((s) => parseInt(s, 10));
    const pb = b.split(".").map((s) => parseInt(s, 10));
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] ?? 0;
      const nb = pb[i] ?? 0;
      if (na > nb) return -1;
      if (na < nb) return 1;
    }
    return 0;
  };

  const entries = [...changelogData].sort((a, b) => {
    const sv = semverCompare(a.version, b.version);
    if (sv !== 0) return sv;
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return db - da;
  });

  return (
    <main className="px-4 md:px-12 py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {t("changelog.title")}
          </h1>
          <p className="text-gray-300 mt-3">{t("changelog.lead")}</p>
          <div className="mt-4 text-sm text-gray-400">
            {/* {t("changelog.note", { path: "src/data/changelog.ts" })} */}
          </div>
        </div>

        <div className="space-y-6">
          {entries.map((entry) => (
            <article
              key={entry.version}
              className="bg-gray-800/40 rounded-lg p-5 md:p-6 border border-gray-700"
            >
              <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-xl font-semibold text-white">
                      {entry.titleKey
                        ? t(entry.titleKey)
                        : `${t("changelog.versionPrefix")} ${entry.version}`}
                    </h2>
                    <span className="text-sm text-gray-400">
                      {entry.version}
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <time className="text-sm text-gray-400">
                      {new Date(entry.date).toLocaleDateString(i18n.language)}
                    </time>
                  </div>
                </div>
                {/* Entry-level badges */}
                <div className="flex items-center gap-2">
                  {entry.upcoming && (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-sm font-medium">
                      {t("changelog.labels.Upcoming")}
                    </span>
                  )}
                </div>
                {/* <div className="flex gap-2 md:gap-3 md:items-center">
                  <Link to="/">Home</Link>
                </div> */}
              </header>

              <div className="mt-4">
                <ul className="space-y-3">
                  {entry.changes.map((c, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="shrink-0">
                        <Badge type={c.type} upcoming={c.upcoming} />
                      </div>
                      <p className="text-gray-200">
                        {c.descriptionKey ? t(c.descriptionKey) : null}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Changelog;
