import React from "react";
import { motion } from "framer-motion";

export function TabButton({
  label,
  active,
  onClick,
}: {
  label: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={[
        "cursor-pointer px-4 py-2 rounded-xl text-sm font-medium transition-colors",
        active ? "bg-blue-600 text-white shadow" : "text-gray-700 hover:bg-gray-100",
      ].join(" ")}
    >
      {label}
    </motion.button>
  );
}

export function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={[
        "cursor-pointer px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
        active ? "bg-blue-600 text-white shadow" : "text-gray-700 hover:bg-gray-100",
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}
