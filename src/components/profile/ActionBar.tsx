import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import { FiEdit2, FiSettings, FiLogOut } from "react-icons/fi";

export function ActionBar({ onEdit }: { onEdit: () => void }) {
  const { logout } = useContext(AuthContext);

  type Intent = "default" | "primary" | "danger";
  const Btn: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    intent?: Intent;
  }> = ({ icon, label, onClick, intent = "default" }) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      className={[
        "cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-sm",
        intent === "primary"
          ? "bg-blue-600 hover:bg-blue-700 text-white"
          : intent === "danger"
          ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
          : "bg-white hover:bg-gray-50 text-gray-800 border border-gray-200",
      ].join(" ")}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );

  return (
    <div className="px-8 pb-6">
      <div className="flex flex-wrap gap-3">
        <Btn
          icon={<FiEdit2 />}
          label="Edit Profile"
          onClick={onEdit}
          intent="primary"
        />
        <Btn
          icon={<FiSettings />}
          label="Settings"
          onClick={() => {
            /* TODO: open settings */
          }}
        />
        <Btn
          icon={<FiLogOut />}
          label="Logout"
          onClick={logout}
          intent="danger"
        />
      </div>
    </div>
  );
}
