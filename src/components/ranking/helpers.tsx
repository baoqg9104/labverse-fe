import React from "react";
import type { Criteria, RankingItem } from "./RankingTypes";
import firstMedalPng from "../../assets/first-medal.png";
import secondMedalPng from "../../assets/second-medal.png";
import thirdMedalPng from "../../assets/third-medal.png";

export function getCriteriaValue(item: RankingItem, c: Criteria) {
  if (c === "points") return item.points;
  if (c === "streak") return item.streakCurrent;
  return item.badgesCount;
}

export function funAchievement(criteria: Criteria, item: RankingItem) {
  if (criteria === "streak")
    return `🔥 ${Math.max(0, item.streakCurrent)}-day streak!`;
  if (criteria === "badges")
    return `⭐ ${Math.max(0, item.badgesCount)} badges collected!`;
  return `💯 ${Math.max(0, item.points)} points!`;
}

export function getTheme(c: Criteria) {
  if (c === "points") {
    return {
      text: "text-blue-700",
      bgFrom: "bg-blue-300",
      bgTo: "bg-indigo-300",
      hoverBg: "hover:bg-blue-50",
      glow: "ring-2 ring-offset-2 ring-blue-200",
      tier10: "bg-gradient-to-b from-blue-500 to-blue-300",
      tier20: "bg-gradient-to-b from-sky-400 to-sky-200",
      tier30: "bg-gradient-to-b from-cyan-400 to-cyan-200",
    } as const;
  }
  if (c === "streak") {
    return {
      text: "text-orange-700",
      bgFrom: "bg-orange-300",
      bgTo: "bg-amber-300",
      hoverBg: "hover:bg-orange-50",
      glow: "ring-2 ring-offset-2 ring-orange-200",
      tier10: "bg-gradient-to-b from-orange-500 to-amber-300",
      tier20: "bg-gradient-to-b from-amber-400 to-yellow-200",
      tier30: "bg-gradient-to-b from-yellow-400 to-yellow-200",
    } as const;
  }
  return {
    text: "text-purple-700",
    bgFrom: "bg-purple-300",
    bgTo: "bg-fuchsia-300",
    hoverBg: "hover:bg-purple-50",
    glow: "ring-2 ring-offset-2 ring-purple-200",
    tier10: "bg-gradient-to-b from-purple-500 to-fuchsia-300",
    tier20: "bg-gradient-to-b from-violet-400 to-purple-200",
    tier30: "bg-gradient-to-b from-fuchsia-400 to-pink-200",
  } as const;
}

export function getTierClass(rank: number, theme: ReturnType<typeof getTheme>) {
  if (rank <= 10) return theme.tier10;
  if (rank <= 20) return theme.tier20;
  if (rank <= 30) return theme.tier30;
  return "bg-gray-100";
}

export function medalSrcByRank(rank: 1 | 2 | 3): string {
  if (rank === 1) return firstMedalPng;
  if (rank === 2) return secondMedalPng;
  return thirdMedalPng;
}

export function getRankDecor(rank: number): { badge: React.ReactNode | null } {
  if (rank === 1 || rank === 2 || rank === 3) {
    const src = medalSrcByRank(rank as 1 | 2 | 3);
    return {
      badge: (
        <img
          src={src}
          alt={`Rank ${rank} medal`}
          className="w-6 h-6"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.style.display = "none";
          }}
        />
      ),
    };
  }
  return { badge: null };
}
