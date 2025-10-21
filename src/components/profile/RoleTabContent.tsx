import type { Badge } from "../../types/badge";
import type { User } from "../../types/user";
import AboutTab from "./tabs/AboutTab";
import BadgesTab from "./tabs/BadgesTab";
import ActivityTab from "./tabs/ActivityTab";
import MyLabsTab from "./tabs/MyLabsTab";
import AdminOverviewTab from "./tabs/AdminOverviewTab";
import AdminUsersTab from "./tabs/AdminUsersTab";
import AdminLabsTab from "./tabs/AdminLabsTab";
import AdminReportsTab from "./tabs/AdminReportsTab";
import AdminRevenueTab from "./tabs/AdminRevenueTab";

import CreateLab from "../labs/CreateLab";
import CreateQuestions from "../questions/CreateQuestion";
import ViewQuestions from "../questions/ViewQuestions";
import { ROLE } from "./RoleUtils";

type Props = {
  activeTab: string;
  badges: Badge[];
  profile: User | null;
  userList: User[];
};

export function RoleTabContent({
  activeTab,
  badges,
  profile,
  userList,
}: Props) {
  const role = profile?.role;
  // local state kept in tab components now
  return (
    <div className="w-full p-8">
      {activeTab === "info" && <AboutTab profile={profile} />}

      {activeTab === "badges" && <BadgesTab badges={badges} />}

      {activeTab === "activity" && <ActivityTab />}

      {activeTab === "myLabs" && <MyLabsTab />}

      {activeTab === "createLab" && <CreateLab />}

      {activeTab === "createQuestion" && <CreateQuestions />}

      {activeTab === "viewQuestions" && <ViewQuestions />}

      {activeTab === "overview" && role === ROLE.ADMIN && <AdminOverviewTab />}

      {activeTab === "users" && role === ROLE.ADMIN && (
        <AdminUsersTab userList={userList} />
      )}

      {activeTab === "labs" && role === ROLE.ADMIN && <AdminLabsTab />}

      {activeTab === "reports" && role === ROLE.ADMIN && <AdminReportsTab />}

      {activeTab === "revenue" && role === ROLE.ADMIN && <AdminRevenueTab />}
    </div>
  );
}
