import React, { useRef, useState } from "react";
import Modal from "./Modal";
import type { User } from "../types/user";
import { DEFAULT_AVATAR_URL } from "../constants/config";
import {
  Avatar,
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  Stack,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { toast } from "react-toastify";
import api from "../utils/axiosInstance";
import { supabase } from "../libs/supabaseClient";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: User | null;
  setProfile: (profile: User | null) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  profile,
  setProfile,
}) => {
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarPreview, setAvatarPreview] = useState<string>(
    profile?.avatarUrl || DEFAULT_AVATAR_URL
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    newPassword?: string;
    confirmPassword?: string;
    avatar?: string;
  }>({});
  const [tab, setTab] = useState<number>(0);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle avatar file selection and preview
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate fields
  const validate = () => {
    const errs: typeof errors = {};
    if (!username.trim()) errs.username = "Username is required.";
    if (newPassword) {
      if (newPassword.length < 8)
        errs.newPassword = "Password must be at least 8 characters.";
      if (newPassword !== confirmPassword)
        errs.confirmPassword = "Passwords do not match.";
      if (!currentPassword)
        errs.newPassword =
          errs.newPassword || "Current password is required to set a new one.";
    }
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (avatarFile && avatarFile.size > maxBytes) {
      errs.avatar = "Avatar must be less than 5MB.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit handler: update profile and optionally change password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      // 1) Determine current user id
      type MeResponse = { id?: number };
      let userId: number | null = null;
      try {
        const me = await api.get<MeResponse>("/users/me");
        const val = me.data?.id;
        userId = typeof val === "number" ? val : null;
      } catch {
        userId = null;
      }
      if (!userId) {
        toast.error("User not found");
        setLoading(false);
        return;
      }

      // 2) Upload avatar to Supabase (if user selected a new file)
      let uploadedAvatarUrl: string | null = null;
      if (avatarFile) {
        const AVATAR_BUCKET =
          import.meta.env.VITE_SUPABASE_AVATARS_BUCKET || "avatars";
        const safeName = avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${userId}/${Date.now()}-${safeName}`;

        const { error: uploadErr } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(path, avatarFile, {
            upsert: true,
            contentType: avatarFile.type || "image/*",
          });

        if (uploadErr) {
          toast.error("Failed to upload avatar. Please try again.");
          setLoading(false);
          return;
        }

        const { data: publicData } = supabase.storage
          .from(AVATAR_BUCKET)
          .getPublicUrl(path);
        uploadedAvatarUrl = publicData?.publicUrl || null;
      }

      // 3) Build DTO (always include all fields; null when absent)
      const bioTrim = (bio ?? "").trim();
      const dto: {
        password: string | null;
        username: string | null;
        avatarUrl: string | null;
        bio: string | null;
      } = {
        password: null, // password changes go via /users/me/password
        username: username.trim() || null,
        avatarUrl: uploadedAvatarUrl ? uploadedAvatarUrl : null,
        bio: bioTrim ? bioTrim : null,
      };

      // 4) Update profile
      await api.patch(`/users/${userId}`, dto);

      // 5) Change password if requested
      if (newPassword) {
        await api.patch(`/users/me/password`, {
          oldPassword: currentPassword,
          newPassword: newPassword,
        });
      }

      // 6) Update local state and notify
      setProfile(
        profile
          ? {
              ...profile,
              username: dto.username ?? profile.username,
              bio: dto.bio ?? profile.bio,
              avatarUrl: dto.avatarUrl ?? profile.avatarUrl,
            }
          : null
      );

      if (newPassword) {
        toast.success("Password changed successfully");
      }
      toast.success("Profile updated successfully");
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          data?: {
            error?: {
              code?: string;
              message?: string;
            };
          };
        };
        message?: string;
      };
      const code = axiosErr?.response?.data?.error?.code || "";
      if (code === "INVALID_OLD_PASSWORD") {
        toast.error("Current password is incorrect. Please try again.");
      } else {
        const msg =
          axiosErr?.response?.data?.error?.message ||
          axiosErr?.message ||
          "Profile update failed";
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset modal state when opened
  React.useEffect(() => {
    if (open) {
      setUsername(profile?.username || "");
      setBio(profile?.bio || "");
      setAvatarPreview(profile?.avatarUrl || DEFAULT_AVATAR_URL);
      setAvatarFile(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    }
  }, [open, profile]);

  return (
    <Modal open={open} onClose={onClose} title={"✏️ Edit Your Profile"}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: { xs: 340, sm: 720 },
          height: { xs: 420, sm: 480 },
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: { xs: 1, sm: 2 }, pt: 1, pb: 0 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: (theme) =>
                `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Edit Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Update your personal info and security settings.
          </Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{ px: { xs: 1, sm: 2 }, mt: 1 }}
        >
          <Tab label="Profile" />
          <Tab label="Security" />
        </Tabs>

        <Box
          sx={{
            p: { xs: 1, sm: 2 },
            pt: 2,
            flex: 1,
            overflowY: tab === 0 ? "auto" : "hidden",
          }}
        >
          {tab === 0 && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "flex-start" }}
            >
              <Stack alignItems="center" spacing={1} sx={{ minWidth: 140 }}>
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={avatarPreview}
                    alt="avatar preview"
                    sx={{
                      width: 96,
                      height: 96,
                      border: "3px solid",
                      borderColor: "primary.main",
                      boxShadow: 3,
                    }}
                  />
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      bgcolor: "background.paper",
                      boxShadow: 2,
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PhotoCamera />
                  </IconButton>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleAvatarChange}
                  />
                </Box>
                <Typography
                  variant="caption"
                  color={errors.avatar ? "error" : "text.secondary"}
                >
                  {errors.avatar || "Click to change avatar"}
                </Typography>
              </Stack>

              <Box flex={1}>
                <TextField
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  fullWidth
                  margin="normal"
                  error={!!errors.username}
                  helperText={errors.username || " "}
                />
                <TextField
                  label="Bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                />
              </Box>
            </Stack>
          )}

          {tab === 1 && (
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              sx={{ overflowY: "hidden" }}
            >
              <TextField
                type={showPassword.current ? "text" : "password"}
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-[70%]"
                margin="normal"
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowPassword((s) => ({
                            ...s,
                            current: !s.current,
                          }))
                        }
                        edge="end"
                      >
                        {showPassword.current ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                type={showPassword.new ? "text" : "password"}
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-[70%]"
                margin="normal"
                autoComplete="new-password"
                error={!!errors.newPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowPassword((s) => ({ ...s, new: !s.new }))
                        }
                        edge="end"
                      >
                        {showPassword.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                type={showPassword.confirm ? "text" : "password"}
                label="Confirm New Password"
                onPaste={(e) => e.preventDefault()}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-[70%]"
                margin="normal"
                autoComplete="new-password"
                error={!!errors.confirmPassword}
                helperText={errors.newPassword || errors.confirmPassword || " "}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowPassword((s) => ({
                            ...s,
                            confirm: !s.confirm,
                          }))
                        }
                        edge="end"
                      >
                        {showPassword.confirm ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}
        </Box>

        <Box
          sx={{
            p: { xs: 1, sm: 2 },
            pt: 1,
            position: "sticky",
            bottom: 0,
            bgcolor: "background.paper",
          }}
        >
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: 2,
            }}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default EditProfileModal;
