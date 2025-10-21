import { useState, useMemo, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import type { Lab, LabLevel } from "../types/lab";
import api from "../utils/axiosInstance";
import { labsApi } from "../libs/labsApi";
import { AuthContext } from "../contexts/AuthContext";
import { ROLE } from "../components/profile/RoleUtils";
import { useTranslation } from "react-i18next";
import heroCyberImg from "../assets/cyber-security (1).png";
import loupeImg from "../assets/loupe.png";
import rightArrowImg from "../assets/right-arrow.png";

const color: Record<LabLevel, string> = {
  Basic: "bg-green-400",
  Intermediate: "bg-yellow-300",
  Advanced: "bg-red-500",
};

// map difficulty levels to lab levels
const mapDifficultyToLabLevel = (difficulty: number): LabLevel => {
  if (difficulty === 0) return "Basic";
  if (difficulty === 1) return "Intermediate";
  if (difficulty === 2) return "Advanced";
  return "Basic"; // default fallback
};

export const Learn = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [difficultyDropdownOpen, setDifficultyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 5 : 9);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!difficultyDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDifficultyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [difficultyDropdownOpen]);

  // Fetch labs based on role/subscription
  useEffect(() => {
    const fetchLabs = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const isAuthorOrAdmin =
          user && (user.role === ROLE.AUTHOR || user.role === ROLE.ADMIN);
        const isUser = user && user.role === ROLE.USER;
        const sub = (user?.subscription || "").toLowerCase();
        const isPremium =
          isUser &&
          (sub.includes("premium") || sub === "pro" || sub === "paid");

        const endpoint = !user
          ? "/labs/preview"
          : isAuthorOrAdmin || isPremium
          ? "/labs"
          : "/labs/preview";

        const res = await api.get(endpoint);

        setLabs(res.data);
        setPage(1);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load labs";
        console.error("Failed to load labs", e);
        setLoadError(msg);
        setLabs([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLabs();
  }, [user]);

  // Filtered labs
  const filteredLabs = useMemo(() => {
    return labs.filter((lab) => {
      // const matchType = filterType === "All" || lab.type === filterType;
      const matchDifficulty =
        difficulty === "All" ||
        mapDifficultyToLabLevel(lab.difficultyLevel) === difficulty;
      const matchSearch =
        lab.title.toLowerCase().includes(search.toLowerCase()) ||
        lab.description.toLowerCase().includes(search.toLowerCase());
      return matchDifficulty && matchSearch;
    });
  }, [labs, search, difficulty]);

  const totalPages = Math.max(1, Math.ceil(filteredLabs.length / itemsPerPage));
  const paginatedLabs = filteredLabs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleDifficulty = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDifficulty(e.target.value);
    setPage(1);
  };
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };
  const handleClearSearch = () => setSearch("");
  const handlePage = (p: number) => setPage(p);

  const isFreeUser = useMemo(() => {
    if (!user) return false; // guests handled separately
    if (user.role !== ROLE.USER) return false;
    const sub = (user.subscription || "").toLowerCase();
    return !(sub.includes("premium") || sub === "pro" || sub === "paid");
  }, [user]);

  return (
    <div className="min-h-screen pb-0">
      {/* Hero Section */}
      <section className="px-4 md:px-16 pt-14 pb-8 md:pb-14 text-white rounded-b-3xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
              {t("learn.heroTitle")}
            </h1>
            <h2 className="text-lg md:text-2xl font-medium mb-5 text-violet-100">
              {t("learn.heroSubtitle")}
            </h2>
            <p className="text-base text-violet-200 max-w-3xl mb-6">
              {t("learn.heroDesc")}
            </p>
            <div className="flex items-center gap-3 font-bold">
              <span className="bg-white text-violet-700 px-4 py-[5px] rounded-full text-2xl shadow">
                50+
              </span>
              <span className="text-violet-100 text-lg">
                {t("learn.stats.labs")}
              </span>
            </div>
          </div>
          <div className="hidden md:block md:mr-34">
            <img
              src={heroCyberImg}
              alt={t("learn.alt.hero")}
              className="size-44 object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Filter & Search */}
      <section className="bg-white px-4 md:px-16 py-16">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="" /* Difficulty dropdown region */>
            <div ref={dropdownRef} className="relative inline-flex">
              <button
                id="difficulty-dropdown"
                type="button"
                className="cursor-pointer py-3 px-4 min-w-36 inline-flex justify-between items-center gap-x-4 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                aria-haspopup="menu"
                aria-expanded={difficultyDropdownOpen}
                aria-label="Dropdown"
                onClick={() => setDifficultyDropdownOpen((open) => !open)}
              >
                {difficulty === "All"
                  ? t("learn.difficulty.label")
                  : difficulty === "Basic"
                  ? t("learn.difficulty.basic")
                  : difficulty === "Intermediate"
                  ? t("learn.difficulty.intermediate")
                  : difficulty === "Advanced"
                  ? t("learn.difficulty.advanced")
                  : t("learn.difficulty.all")}
                <svg
                  className={
                    difficultyDropdownOpen ? "rotate-180 size-4" : "size-4"
                  }
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {difficultyDropdownOpen && (
                <div
                  className="absolute left-0 right-0 top-10 pr-3 z-50 transition-opacity duration-150 bg-white shadow-md rounded-lg mt-2"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="difficulty-dropdown"
                >
                  <div className="p-1 space-y-0.5">
                    {["All", "Basic", "Intermediate", "Advanced"].map(
                      (level) => (
                        <button
                          key={level}
                          className={`cursor-pointer flex w-full text-left items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${
                            difficulty === level
                              ? "bg-violet-100 font-bold"
                              : ""
                          }`}
                          onClick={() => {
                            handleDifficulty({
                              target: { value: level },
                            } as React.ChangeEvent<HTMLSelectElement>);
                            setDifficultyDropdownOpen(false);
                          }}
                          role="menuitem"
                        >
                          {level === "All"
                            ? t("learn.difficulty.all")
                            : level === "Basic"
                            ? t("learn.difficulty.basic")
                            : level === "Intermediate"
                            ? t("learn.difficulty.intermediate")
                            : t("learn.difficulty.advanced")}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 items-center w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <div className="flex items-center w-full">
                <img
                  src={loupeImg}
                  alt="Search"
                  className="w-4 absolute left-1"
                />
                <input
                  className="bg-transparent px-8 outline-none w-full text-gray-700 py-2 border-b-2 border-gray-400 focus:border-violet-600 transition placeholder-gray-400"
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder={t("learn.searchPlaceholder")}
                />
                <button
                  className="absolute right-0 cursor-pointer pl-2 pr-1 text-gray-500 hover:text-gray-700"
                  onClick={handleClearSearch}
                >
                  <svg width="22" height="22" fill="none" stroke="currentColor">
                    <line x1="6" y1="6" x2="16" y2="16" strokeWidth="2" />
                    <line x1="16" y1="6" x2="6" y2="16" strokeWidth="2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Labs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 p-5 animate-pulse bg-white"
              >
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
                <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                <div className="h-4 w-5/6 bg-gray-200 rounded mb-6" />
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center text-red-600 py-10">{loadError}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedLabs.length === 0 ? (
              <div className="col-span-3 text-center text-gray-500 py-10">
                {t("learn.noLabs")}
              </div>
            ) : (
              paginatedLabs.map((lab, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col justify-between min-h-[180px] hover:shadow-lg hover:-translate-y-0.5 transition cursor-pointer"
                  onClick={async () => {
                    // Guests must login before viewing details
                    if (!user) {
                      navigate("/login", { replace: false });
                      return;
                    }
                    // Only track view for real users (role user)
                    if (user.role === ROLE.USER) {
                      try {
                        await labsApi.trackView(lab.id);
                      } catch {
                        // ignore error, still navigate
                      }
                    }
                    // Navigate using lab.slug (fallback already handled during mapping)
                    navigate(`/labs/${lab.slug}`);
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      {/* <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                        {lab.type}
                      </span> */}
                      <span className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-700 font-semibold">
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${
                            color[mapDifficultyToLabLevel(lab.difficultyLevel)]
                          }`}
                        ></span>
                        {mapDifficultyToLabLevel(lab.difficultyLevel)}
                      </span>
                    </div>
                    <div className="font-semibold text-base md:text-lg mb-2 text-gray-900">
                      {lab.title}
                    </div>
                    <div className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {lab.description}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="inline-flex items-center gap-3">
                        <span>
                          ⭐{" "}
                          {typeof lab.ratingAverage === "number"
                            ? lab.ratingAverage.toFixed(1)
                            : "0.0"}
                        </span>
                        <span>
                          👀 {typeof lab.views === "number" ? lab.views : 0}
                        </span>
                        <span>
                          📝{" "}
                          {typeof lab.ratingCount === "number"
                            ? lab.ratingCount
                            : 0}
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 font-semibold text-xs md:text-sm text-violet-700 hover:text-violet-800">
                      {t("common.viewMore", "View More")}
                      <img
                        src={rightArrowImg}
                        alt=""
                        className="w-[11px] md:mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Blurred premium teaser directly below real labs for free users */}
        {!isLoading && !loadError && isFreeUser && (
          <div className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="relative rounded-2xl border border-gray-200 bg-white p-5 min-h-[180px] overflow-hidden cursor-pointer"
                  onClick={() =>
                    navigate("/pricing", { state: { highlight: "premium" } })
                  }
                >
                  <div className="filter blur-sm grayscale opacity-80 select-none pointer-events-none">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                        {t("pricingPage.premium.title")}
                      </span>
                      <span className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-500 font-semibold">
                        <span className="inline-block w-3 h-3 rounded-full bg-gray-300"></span>
                        {t("learn.difficulty.advanced")}
                      </span>
                    </div>
                    <div className="h-5 w-4/5 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                    <button className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow">
                      {t("common.showMore", "Show More")}
                      <svg
                        className="size-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            className="size-9 rounded cursor-pointer flex items-center justify-center border-[#DFE3E8] border-2 disabled:border-none disabled:bg-[#c8ced5]"
            disabled={page === 1}
            onClick={() => handlePage(page - 1)}
          >
            <svg
              width="9"
              height="12"
              viewBox="0 0 9 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.15991 1.41L3.57991 6L8.15991 10.59L6.74991 12L0.749912 6L6.74991 0L8.15991 1.41Z"
                fill={page === 1 ? "#e1e6ea" : "#C4CDD5"}
              />
            </svg>
          </button>
          {/* Condensed Pagination Logic */}
          {totalPages <= 7 ? (
            Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`size-9 rounded font-bold cursor-pointer border-2 ${
                  page === i + 1
                    ? "text-[#4200FF]"
                    : "text-[#212B36] border-[#DFE3E8]"
                }`}
                onClick={() => handlePage(i + 1)}
              >
                {i + 1}
              </button>
            ))
          ) : (
            <>
              {/* Always show first 3 pages */}
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`size-9 rounded font-bold cursor-pointer border-2 ${
                    page === p
                      ? "text-[#4200FF]"
                      : "text-[#212B36] border-[#DFE3E8]"
                  }`}
                  onClick={() => handlePage(p)}
                >
                  {p}
                </button>
              ))}
              {/* Ellipsis if needed */}
              {page > 5 && <span className="px-2">...</span>}
              {/* Show current page and neighbors if not in first/last 3 */}
              {page > 3 && page < totalPages - 2 && (
                <>
                  <button
                    className="size-9 rounded font-bold cursor-pointer border-2 text-[#4200FF]"
                    onClick={() => handlePage(page)}
                  >
                    {page}
                  </button>
                </>
              )}
              {/* Ellipsis before last 3 pages if needed */}
              {page < totalPages - 3 && <span className="px-2">...</span>}
              {/* Always show last 3 pages */}
              {[totalPages - 2, totalPages - 1, totalPages].map((p) => (
                <button
                  key={p}
                  className={`size-9 rounded font-bold cursor-pointer border-2 ${
                    page === p
                      ? "text-[#4200FF]"
                      : "text-[#212B36] border-[#DFE3E8]"
                  }`}
                  onClick={() => handlePage(p)}
                >
                  {p}
                </button>
              ))}
            </>
          )}
          <button
            className="size-9 rounded cursor-pointer flex items-center justify-center border-[#DFE3E8] border-2 disabled:border-none disabled:bg-[#c8ced5]"
            disabled={page === totalPages}
            onClick={() => handlePage(page + 1)}
          >
            <svg
              width="9"
              height="12"
              viewBox="0 0 9 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.840088 1.41L5.42009 6L0.840088 10.59L2.25009 12L8.25009 6L2.25009 0L0.840088 1.41Z"
                fill={page === totalPages ? "#e1e6ea" : "#C4CDD5"}
              />
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
};
