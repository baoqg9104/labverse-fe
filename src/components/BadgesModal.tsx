import React from "react";
import Modal from "./Modal";
import BadgeList from "./BadgeList";
import type { Badge } from "../types/badge";

interface BadgesModalProps {
  open: boolean;
  onClose: () => void;
  badges: Badge[];
}

const BadgesModal: React.FC<BadgesModalProps> = ({ open, onClose, badges }) => (
  <Modal open={open} onClose={onClose} title="🏆 Your Badge Collection">
    <div className="p-4">
      <BadgeList badges={badges} />
    </div>
  </Modal>
);

export default BadgesModal;
