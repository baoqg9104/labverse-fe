import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { ROLE } from "../components/profile/RoleUtils";

export const ProtectedRoute = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export const GuestOnlyRoute = () => {
  const { user } = useContext(AuthContext);

  if (user) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export const AdminRoute = () => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== ROLE.ADMIN) return <Navigate to="/" replace />;
  return <Outlet />;
};
