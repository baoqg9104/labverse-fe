import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../utils/axiosInstance";
import { DEFAULT_AVATAR_URL } from "../constants/config";
import { useSound } from "../components/quiz/SoundEffect";
import RankingSkeleton from "../components/ranking/RankingSkeleton";
import { TabButton, PillButton } from "../components/ranking/Buttons";
import StatsRow from "../components/ranking/StatsRow";
import Podium from "../components/ranking/Podium";
import UserModal from "../components/ranking/UserModal";
import type {
  Criteria,
  TabKey,
  RankingItem,
} from "../components/ranking/RankingTypes";
import {
  getTheme,
  getTierClass,
  getRankDecor,
} from "../components/ranking/helpers";
import Avatar from "../components/Avatar";

export default function Ranking() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>("users");
  const [criteria, setCriteria] = useState<Criteria>("points");
  const [take] = useState(50);
  const [data, setData] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<RankingItem | null>(null);
  const lastKeyRef = useRef<string>("");

  const TING =
    "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQAAABJMYXZmNTMuMTkuMTAw//uQZAAPAAAACAAADS8AABpIAAACgAAAC4AAAEMQWFtYWMgNi4wLjEw//uQZAAHAAAADgAAE5YAACkYAABXAAAAGgAAAEZkYXRhAAAAAA==";
  const ACHIEVE =
    "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACaQAAABJMYXZmNTMuMTkuMTAw//uQZAAHAAAADgAADYkAABo0AAAaAAAAC4AAAEMQWFtYWMgNi4wLjEw//uQZAAHAAAAEgAAE5YAACkYAABcAAAAGgAAAEZkYXRhAAAAAA==";
  const playTing = useSound(TING, { volume: 0.25 });
  const playAchieve = useSound(ACHIEVE, { volume: 0.25 });

  const endpoint = useMemo(
    () => (tab === "users" ? "/rankings/users" : "/rankings/authors"),
    [tab]
  );

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(endpoint, { params: { criteria, take } });
        if (!active) return;
        setData(res.data || []);
      } catch {
        if (!active) return;
        setError("error");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [endpoint, criteria, take]);

  useEffect(() => {
    const key = `${endpoint}:${criteria}`;
    if (!loading && data.length > 0 && lastKeyRef.current !== key) {
      lastKeyRef.current = key;
      playAchieve();
    }
  }, [loading, data, endpoint, criteria, playAchieve]);

  const theme = getTheme(criteria);

  return (
    <div className="relative min-h-screen bg-white">
      <div className="relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <h1 className="pb-1 text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-gray-900 via-blue-700 to-blue-500 bg-clip-text text-transparent">
          {t("ranking.title")}
        </h1>
        <p className="text-sm text-gray-700 mb-6">
          {t("ranking.showBy")}:{" "}
          <span className={`font-semibold ${theme.text}`}>
            {t(`ranking.criteria.${criteria}`)}
          </span>
        </p>

        <div className="flex items-center gap-2 bg-white rounded-2xl border p-1 w-fit mb-6 shadow-sm">
          <TabButton
            label={
              <span className="inline-flex items-center gap-2">
                <span aria-hidden>👥</span>
                {t("ranking.tabs.users")}
              </span>
            }
            active={tab === "users"}
            onClick={() => {
              setTab("users");
              playTing();
            }}
          />
          <TabButton
            label={
              <span className="inline-flex items-center gap-2">
                <span aria-hidden>✍️</span>
                {t("ranking.tabs.authors")}
              </span>
            }
            active={tab === "authors"}
            onClick={() => {
              setTab("authors");
              playTing();
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <label className="text-sm font-medium text-gray-700">
            {t("ranking.criteria.label")}
          </label>
          <div className="flex items-center gap-2 bg-white border rounded-xl p-1 shadow-sm">
            <PillButton
              active={criteria === "points"}
              onClick={() => {
                setCriteria("points");
                playTing();
              }}
            >
              <span className="inline-flex items-center gap-2">
                <span aria-hidden>💯</span>
                {t("ranking.criteria.points")}
              </span>
            </PillButton>
            <PillButton
              active={criteria === "streak"}
              onClick={() => {
                setCriteria("streak");
                playTing();
              }}
            >
              <span className="inline-flex items-center gap-2">
                <span aria-hidden>🔥</span>
                {t("ranking.criteria.streak")}
              </span>
            </PillButton>
            <PillButton
              active={criteria === "badges"}
              onClick={() => {
                setCriteria("badges");
                playTing();
              }}
            >
              <span className="inline-flex items-center gap-2">
                <span aria-hidden>⭐</span>
                {t("ranking.criteria.badges")}
              </span>
            </PillButton>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-500 overflow-hidden shadow-lg">
          {loading ? (
            <RankingSkeleton />
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              {t("ranking.error")}
            </div>
          ) : data.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {t("ranking.empty")}
            </div>
          ) : (
            <div>
              <Podium
                items={data.slice(0, 3)}
                criteria={criteria}
                onClickUser={(u) => setSelectedUser(u)}
              />
              <ol
                className={
                  tab === "authors" || data.length <= 6
                    ? "max-w-2xl mx-auto"
                    : undefined
                }
              >
                {data.slice(3).map((u, idx) => {
                  const i = idx + 3;
                  const rank = i + 1;
                  const avatarSrc = (
                    u.avatarUrl && u.avatarUrl.trim().length > 0
                      ? u.avatarUrl
                      : DEFAULT_AVATAR_URL
                  ) as string;
                  const { badge } = getRankDecor(rank);
                  const themeLocal = theme;
                  const tierClass = getTierClass(rank, themeLocal);
                  const avatarGlow = rank <= 10 ? themeLocal.glow : "";
                  return (
                    <li
                      key={u.userId}
                      className={`relative flex items-center gap-4 p-4 border-b last:border-b-0 hover:scale-[1.01] transition-all duration-200 ${themeLocal.hoverBg}`}
                      onClick={() => setSelectedUser(u)}
                    >
                      <div
                        className={`absolute left-0 top-0 h-full w-1 ${tierClass}`}
                        aria-hidden
                      />
                      <div className="w-12 flex justify-end">
                        <span
                          className="inline-flex min-w-8 justify-center text-base font-semibold"
                          aria-label={`Rank ${rank}`}
                        >
                          {badge ?? rank}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={avatarSrc || undefined}
                          fallback={DEFAULT_AVATAR_URL}
                          className={`size-12 rounded-full object-cover bg-gray-100 border ${avatarGlow}`}
                        />
                        <div>
                          <div className="font-semibold text-gray-900">
                            {u.username}
                          </div>
                        </div>
                      </div>
                      <StatsRow item={u} criteria={criteria} />
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>

        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          criteria={criteria}
        />
      </div>
    </div>
  );
}
