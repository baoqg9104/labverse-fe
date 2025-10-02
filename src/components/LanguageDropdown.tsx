import React, { useState } from "react";

const languages = [
  { code: "en", name: "English", flag: "/src/assets/en.png" },
  { code: "vi", name: "Vietnamese", flag: "/src/assets/vi.png" },
];

export const LanguageDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(languages[0]);

  return (
    <div className="relative w-40 text-sm">
      <button
        type="button"
        className="flex items-center w-full bg-white rounded-lg px-3 py-2 font-medium shadow cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <img src={selected.flag} alt={selected.name} className="w-5 h-5 mr-2" />
        <span className="text-gray-900">{selected.name}</span>
        <svg className="ml-auto w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <ul className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow z-10">
          {languages.map((lang) => (
            <li
              key={lang.code}
              className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${selected.code === lang.code ? 'bg-gray-100' : ''}`}
              onClick={() => { setSelected(lang); setOpen(false); }}
            >
              <img src={lang.flag} alt={lang.name} className="w-5 h-5 mr-2" />
              <span className="text-gray-900">{lang.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
