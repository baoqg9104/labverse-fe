import { AuthContext } from "../contexts/AuthContext";
import UserCarousel from "../components/UserCarousel";
import type { User } from "../types/user";
import type { Badge } from "../types/badge";
import api from "../utils/axiosInstance";
import BadgesModal from "../components/BadgesModal";
import EditProfileModal from "../components/EditProfileModal";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileStats } from "../components/profile/ProfileStats";
import GamificationStats from "../components/profile/GamificationStats";
import { TabsNav } from "../components/profile/TabsNav";
import { RoleTabContent } from "../components/profile/RoleTabContent";
import { ROLE, USER_TABS, AUTHOR_TABS } from "../components/profile/RoleUtils";
import { Link } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import { ActivitySection } from "../components/profile/ActivitySection";

export function Profile() {
  const { user } = useContext(AuthContext);

  const [profile, setProfile] = useState<User | null>(user);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeUserEmail, setActiveUserEmail] = useState<string | null>(
    user?.email ?? null
  );

  const plan = useMemo(
    () => profile?.subscription || "Free",
    [profile?.subscription]
  );
  const isMyProfile = useMemo(
    () => !!(profile?.email && user?.email && profile.email === user.email),
    [profile?.email, user?.email]
  );

  const defaultTab = useMemo(() => "info", []);
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  useEffect(() => setActiveTab(defaultTab), [defaultTab]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get<User[]>("/users", {
          params: { isOnlyVerifiedUser: true },
        });

        if (mounted) setUserList(res.data || []);
      } catch {
        if (mounted) setUserList([]);
      }
    })();
    // TODO: fetch real badges for the profile user
    setBadges([]);
    return () => {
      mounted = false;
    };
  }, []);

  const TABS = useMemo(() => {
    if (profile?.role === ROLE.AUTHOR)
      return AUTHOR_TABS as readonly {
        key: string;
        label: string;
        icon: string;
      }[];
    return USER_TABS as readonly { key: string; label: string; icon: string }[];
  }, [profile?.role]);

  const userCarouselData = useMemo(() => {
    return userList
      .filter((u) => u.email !== user?.email && u.role === 0)
      .map((u) => ({
        email: u.email,
        username: u.username,
        avatarUrl: u.avatarUrl,
        onClick: () => {
          setProfile(u);
          setActiveUserEmail(u.email);
          setActiveTab(u.role === ROLE.ADMIN ? "overview" : "info");
        },
      }));
  }, [userList, user?.email]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50 text-slate-900">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-100/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-180px] right-[-120px] h-[480px] w-[480px] rounded-full bg-indigo-100/60 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,124,255,0.08),_transparent_65%)]" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <ProfileHeader
          profile={profile}
          plan={plan}
          isMyProfile={isMyProfile}
          onEdit={() => setShowEditModal(true)}
          onViewBadges={() => setShowBadgesModal(true)}
          onBackToMe={() => user && setProfile(user)}
        />

        {profile?.role !== ROLE.ADMIN && (
          <GamificationStats
            points={profile?.points}
            level={profile?.level}
            streakCurrent={profile?.streakCurrent}
            streakBest={profile?.streakBest}
          />
        )}

        <ProfileStats
          badges={badges}
          onViewBadges={() => setShowBadgesModal(true)}
          role={profile?.role}
          joinedAt={profile?.createdAt || null}
          labsWritten={profile?.role === ROLE.AUTHOR ? 7 : undefined}
        />

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white pb-10 shadow-[0_30px_80px_-45px_rgba(79,124,255,0.25)]">
          <TabsNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          <RoleTabContent
            activeTab={activeTab}
            badges={badges}
            profile={profile}
            userList={userList}
          />
        </div>

        <ActivitySection
          username={profile?.username || undefined}
          className="w-full"
        />

        {profile?.role === ROLE.ADMIN && isMyProfile && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-8 py-6 text-amber-900 shadow-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.3em] text-amber-500">
                  Looking for Admin tools?
                </div>
                <div className="text-lg font-semibold">
                  Use the dedicated console to manage users, labs, reports, and
                  revenue.
                </div>
              </div>
              <Link
                to="/admin"
                className="cursor-pointer rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-amber-400"
              >
                Open Admin Console
              </Link>
            </div>
          </div>
        )}

        {profile?.role === ROLE.USER && (
          <div className="mb-6 mt-4 rounded-3xl border border-slate-200 bg-white px-6 py-8 text-slate-900 shadow-md">
            <div className="mb-6 text-center">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Discover
              </div>
              <h2 className="text-3xl font-semibold">Explore Other Learners</h2>
              <p className="mt-2 text-sm text-slate-600">
                Dive into community profiles and follow their learning path.
              </p>
            </div>
            <UserCarousel
              users={userCarouselData}
              activeUserEmail={activeUserEmail}
            />
          </div>
        )}
      </div>

      <BadgesModal
        open={showBadgesModal}
        onClose={() => setShowBadgesModal(false)}
        badges={badges}
      />

      <EditProfileModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        setProfile={setProfile}
      />
    </div>
  );
}
