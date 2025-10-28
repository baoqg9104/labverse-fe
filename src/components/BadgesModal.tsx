import React from "react";
import Modal from "./Modal";
import BadgeList from "./BadgeList";
import type { Badge } from "../types/badge";
import { useTranslation } from "react-i18next";

interface BadgesModalProps {
  open: boolean;
  onClose: () => void;
  badges: Badge[];
}

const BadgesModal: React.FC<BadgesModalProps> = ({ open, onClose, badges }) => {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("profile.badges.modalTitle", "🏆 Your Badge Collection")}
    >
      <div className="p-4">
        <BadgeList badges={badges} />
      </div>
    </Modal>
  );
};

export default BadgesModal;
