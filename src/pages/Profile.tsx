import { AuthContext } from "../contexts/AuthContext";
import UserCarousel from "../components/UserCarousel";
import type { User } from "../types/user";
import type { Badge } from "../types/badge";
import api from "../utils/axiosInstance";
import BadgesModal from "../components/BadgesModal";
import EditProfileModal from "../components/EditProfileModal";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileStats } from "../components/profile/ProfileStats";
import { TabsNav } from "../components/profile/TabsNav";
import { RoleTabContent } from "../components/profile/RoleTabContent";
import { ROLE, USER_TABS, AUTHOR_TABS } from "../components/profile/RoleUtils";
import { Link } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";

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
    <div className="mt-5 min-h-screen bg-gradient-to-b from-white to-blue-50 pt-8 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
          <ProfileHeader
            profile={profile}
            plan={plan}
            isMyProfile={isMyProfile}
            onEdit={() => setShowEditModal(true)}
            onViewBadges={() => setShowBadgesModal(true)}
            onBackToMe={() => user && setProfile(user)}
          />

          <ProfileStats
            badges={badges}
            onViewBadges={() => setShowBadgesModal(true)}
            role={profile?.role}
            joinedAt={profile?.createdAt || null}
            labsWritten={profile?.role === ROLE.AUTHOR ? 7 : undefined}
          />

          <TabsNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

          <RoleTabContent
            activeTab={activeTab}
            badges={badges}
            profile={profile}
            userList={userList}
          />

          {profile?.role === ROLE.ADMIN && isMyProfile && (
            <div className="px-8 pb-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-amber-900">
                    Looking for Admin tools?
                  </div>
                  <div className="text-amber-800/90">
                    Use the dedicated Admin Console to manage users, labs,
                    reports and revenue.
                  </div>
                </div>
                <Link
                  to="/admin"
                  className="cursor-pointer px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow"
                >
                  Open Admin Console
                </Link>
              </div>
            </div>
          )}
        </div>

        {profile?.role === ROLE.USER && (
          <div className="mt-12 pb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Explore Other Users
              </h2>
              <p className="text-gray-600">
                Discover profiles of other community members
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
