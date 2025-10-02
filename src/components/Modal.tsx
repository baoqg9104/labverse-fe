import React from "react";
import MuiModal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: 3,
  boxShadow: 24,
  p: { xs: 2, sm: 4 },
  minWidth: 320,
  maxWidth: "90vw",
  outline: "none",
};

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  return (
    <MuiModal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-title"
      sx={{ zIndex: 2000 }}
    >
      <Box sx={style}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8, color: "grey.500" }}
        >
          <CloseIcon fontSize="large" />
        </IconButton>
        {title && (
          <Typography
            id="modal-title"
            variant="h6"
            component="h2"
            sx={{ mb: 2, pr: 5 }}
          >
            {title}
          </Typography>
        )}
        <Box>{children}</Box>
      </Box>
    </MuiModal>
  );
};

export default Modal;
