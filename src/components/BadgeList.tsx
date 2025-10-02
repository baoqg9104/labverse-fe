import React from "react";
import type { Badge } from "../types/badge";
import { FaMedal } from "react-icons/fa";

interface BadgeListProps {
  badges: Badge[];
}

const badgeColors = [
  "border-yellow-400 bg-yellow-50",
  "border-blue-400 bg-blue-50",
  "border-green-400 bg-green-50",
  "border-purple-400 bg-purple-50",
  "border-pink-400 bg-pink-50",
];

const BadgeList: React.FC<BadgeListProps> = ({ badges }) => {
  if (!badges.length) return <div>No badges yet.</div>;
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {badges.map((badge, idx) => (
        <div
          key={badge.name}
          className={`relative flex flex-col items-center border-2 ${badgeColors[idx % badgeColors.length]} rounded-xl p-4 shadow-md hover:scale-105 transition-transform duration-200 cursor-pointer group min-w-[110px]`}
        >
          <div className="w-14 h-14 flex items-center justify-center mb-2">
            {badge.iconUrl ? (
              <img
                src={badge.iconUrl}
                alt={badge.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <FaMedal className="w-12 h-12 text-yellow-400" />
            )}
          </div>
          <span className="text-sm font-semibold text-gray-700 text-center truncate max-w-[90px]">{badge.name}</span>
          {/* Tooltip on hover */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20">
            <div className="relative bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 shadow-lg whitespace-pre-line min-w-[120px] max-w-xs">
              {badge.desc}
              <div className="absolute left-1/2 -bottom-2 w-3 h-3 bg-white border-l border-b border-gray-300 rotate-45 -translate-x-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BadgeList;
