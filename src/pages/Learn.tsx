import { useState, useMemo, useEffect } from "react";
import type { Lab, LabLevel } from "../types/lab";

const color: Record<LabLevel, string> = {
  Basic: "bg-green-400",
  Intermediate: "bg-yellow-300",
  Advanced: "bg-red-500",
};

const labs: Lab[] = [
  {
    title: "Install Kali Linux on VirtualBox",
    desc: "Step-by-step guide to set up Kali Linux as a VM, with optimized config files for low-spec laptops.",
    level: "Basic",
    type: "Rooms",
  },
  {
    title: "Basic Network Scanning with Nmap",
    desc: "Discover local network devices with just 5 commands - detailed breakdown of each parameter.",
    level: "Basic",
    type: "Networks",
  },
  {
    title: "Build an Apache Web Server on Ubuntu",
    desc: "Set up a home web server in 15 minutes and understand HTTP request/response handling.",
    level: "Basic",
    type: "Rooms",
  },
  {
    title: "Exploit SQL Injection Using DVWA",
    desc: "Hands-on practice exploiting SQL flaws in web apps, with step-by-step video demos.",
    level: "Intermediate",
    type: "Rooms",
  },
  {
    title: "Bypass Authentication with Burp Suite",
    desc: "Intercept and modify HTTP requests to bypass simple login pages.",
    level: "Intermediate",
    type: "Networks",
  },
  {
    title: "Simulate Malware Distribution via Metasploit",
    desc: "Create harmless mock malware PDFs to understand infection mechanisms (safe lab environment).",
    level: "Intermediate",
    type: "Networks",
  },
  {
    title: "Build a DIY SIEM System",
    desc: "Combine ELK Stack + Wazuh for home network monitoring using real-world datasets.",
    level: "Advanced",
    type: "Rooms",
  },
  {
    title: "Malware Reverse Engineering with Ghidra",
    desc: "Analyze safe PE malware samples and learn basic obfuscation techniques.",
    level: "Advanced",
    type: "Networks",
  },
  {
    title: "MITM Attacks Using Raspberry Pi",
    desc: "Turn a Pi into a network sniffer, with prevention best practices.",
    level: "Advanced",
    type: "Networks",
  },
];

export const Learn = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 5 : 9);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filtered labs
  const filteredLabs = useMemo(() => {
    return labs.filter((lab) => {
      const matchType = filterType === "All" || lab.type === filterType;
      const matchDifficulty = difficulty === "All" || lab.level === difficulty;
      const matchSearch =
        lab.title.toLowerCase().includes(search.toLowerCase()) ||
        lab.desc.toLowerCase().includes(search.toLowerCase());
      return matchType && matchDifficulty && matchSearch;
    });
  }, [search, filterType, difficulty]);

  const totalPages = Math.max(1, Math.ceil(filteredLabs.length / itemsPerPage));
  const paginatedLabs = filteredLabs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleFilterType = (type: string) => {
    setFilterType(type);
    setPage(1);
  };
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

  return (
    <div className="min-h-screen pb-0">
      {/* Hero Section */}
      <section className="px-4 md:px-16 pt-14 pb-8 md:pb-14 text-white rounded-b-3xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
              Labverse Academy
            </h1>
            <h2 className="text-lg md:text-2xl font-medium mb-5 text-violet-100">
              Unlock Cyber Skills at Home
            </h2>
            <p className="text-base text-violet-200 max-w-3xl mb-6">
              Dive into practical cybersecurity labs designed for home setups.
              Progress from beginner to advanced with interactive guides,
              challenges, and real-world scenarios. No expensive gear required!
            </p>
            <div className="flex items-center gap-3 font-bold">
              <span className="bg-white text-violet-700 px-4 py-[5px] rounded-full text-2xl shadow">
                50+
              </span>
              <span className="text-violet-100 text-lg">Labs</span>
            </div>
          </div>
          <div className="hidden md:block md:mr-34">
            <img
              src="src/assets/cyber-security (1).png"
              alt="Cybersecurity Labs"
              className="size-44 object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Filter & Search */}
      <section className="bg-white px-4 md:px-16 py-16">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-3">
            <button
              onClick={() => handleFilterType("All")}
              className={`px-5 py-2 rounded-lg font-semibold cursor-pointer ${
                filterType === "All"
                  ? "bg-violet-100 text-violet-700"
                  : "bg-white text-gray-700 border border-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterType("Rooms")}
              className={`px-5 py-2 rounded-lg font-semibold cursor-pointer ${
                filterType === "Rooms"
                  ? "bg-violet-100 text-violet-700"
                  : "bg-white text-gray-700 border border-gray-200"
              }`}
            >
              Rooms
            </button>
            <button
              onClick={() => handleFilterType("Networks")}
              className={`px-5 py-2 rounded-lg font-semibold cursor-pointer ${
                filterType === "Networks"
                  ? "bg-violet-100 text-violet-700"
                  : "bg-white text-gray-700 border border-gray-200"
              }`}
            >
              Networks
            </button>
          </div>
          <div className="">
            {/* <select
              value={difficulty}
              onChange={handleDifficulty}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold bg-white focus:border-violet-600"
            >
              <option value="All">Difficulty</option>
              <option value="All">All</option>
              <option value="Basic">Basic</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select> */}
            <div className="hs-dropdown [--auto-close:inside] relative inline-flex">
              <button
                id="hs-dropdown-default"
                type="button"
                className="cursor-pointer hs-dropdown-toggle py-3 px-4 min-w-36 inline-flex justify-between items-center gap-x-4 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                aria-haspopup="menu"
                aria-expanded="false"
                aria-label="Dropdown"
              >
                {difficulty === "All" ? "Difficulty" : difficulty}
                {/* {difficulty} */}
                <svg
                  className="hs-dropdown-open:rotate-180 size-4"
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

              <div
                className="pr-3 z-50 hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden bg-white shadow-md rounded-lg mt-2 after:h-4 after:absolute after:-bottom-4 after:start-0 after:w-full before:h-4 before:absolute before:-top-4 before:start-0 before:w-full"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="hs-dropdown-default"
              >
                <div className="p-1 space-y-0.5">
                  {["All", "Basic", "Intermediate", "Advanced"].map((level) => (
                    <button
                      key={level}
                      className={`cursor-pointer flex w-full text-left items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${
                        difficulty === level ? "bg-violet-100 font-bold" : ""
                      }`}
                      onClick={() => {
                        // setDifficulty(level);
                        // setPage(1);
                        handleDifficulty({
                          target: { value: level },
                        } as React.ChangeEvent<HTMLSelectElement>);
                      }}
                      role="menuitem"
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <div className="flex items-center w-full">
                <img
                  src="src/assets/loupe.png"
                  alt="Search"
                  className="w-4 absolute left-1"
                />
                <input
                  className="bg-transparent px-8 outline-none w-full text-gray-700 py-2 border-b-2 border-gray-400 focus:border-violet-600 transition placeholder-gray-400"
                  type="text"
                  value={search}
                  onChange={handleSearch}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedLabs.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500 py-10">
              No labs found.
            </div>
          ) : (
            paginatedLabs.map((lab, idx) => (
              <div
                key={idx}
                className="bg-[#f7f5fa] rounded-xl shadow p-5 flex flex-col justify-between min-h-[170px] cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-base md:text-lg mb-2">
                    {lab.title}
                  </div>
                  <div className="text-gray-600 text-sm mb-4">{lab.desc}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        color[lab.level]
                      }`}
                    ></span>
                    <span className="text-xs md:text-sm text-gray-700 font-semibold">
                      {lab.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-xs md:text-sm text-gray-800">
                    View More{" "}
                    <img
                      src="src/assets/right-arrow.png"
                      alt=""
                      className="w-[11px] md:mt-1"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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
