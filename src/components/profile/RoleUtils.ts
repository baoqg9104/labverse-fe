export const ROLE = { USER: 0, AUTHOR: 1, ADMIN: 2 } as const;
export type RoleKey = keyof typeof ROLE;

export function getRoleMeta(role?: number): {
  name: RoleKey | "USER";
  label: string;
  badgeClass: string;
  icon: string;
} {
  switch (role) {
    case ROLE.AUTHOR:
      return {
        name: "AUTHOR",
        label: "Author",
        // Use a pen/handwriting emoji which better represents an author
        icon: "✍️",
        badgeClass:
          "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border border-white/30",
      };
    case ROLE.ADMIN:
      return {
        name: "ADMIN",
        label: "Admin",
        icon: "👑",
        badgeClass:
          "bg-gradient-to-r from-rose-400 to-orange-400 text-white shadow",
      };
    case ROLE.USER:
    default:
      return {
        name: "USER",
        label: "User",
        icon: "👤",
        badgeClass: "bg-slate-100 text-slate-700 border border-slate-300",
      };
  }
}

export const USER_TABS = [
  { key: "info", label: "Profile Info", icon: "👤" },
  { key: "badges", label: "Achievements", icon: "🏆" },
  { key: "activity", label: "Recent Activity", icon: "📊" },
] as const;

export const AUTHOR_TABS = [
  { key: "info", label: "Profile Info", icon: "👤" },
  { key: "myLabs", label: "My Labs", icon: "🗒️" },
  { key: "createLab", label: "Create Lab", icon: "➕" },
  { key: "viewQuestions", label: "View Questions", icon: "📋" },
  { key: "createQuestion", label: "Create Question", icon: "➕" },
  { key: "activity", label: "Activity", icon: "📊" },
] as const;

export const ADMIN_TABS = [
  { key: "overview", label: "Overview", icon: "📈" },
  { key: "users", label: "Users", icon: "👥" },
  { key: "labs", label: "Labs", icon: "🗒️" },
  { key: "reports", label: "Reports", icon: "📑" },
  { key: "revenue", label: "Revenue", icon: "💰" },
] as const;
