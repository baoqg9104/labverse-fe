import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Home } from "../pages/Home";
const Login = lazy(() => import("../pages/Login").then(m => ({ default: m.Login })));
const Signup = lazy(() => import("../pages/Signup").then(m => ({ default: m.Signup })));
import { NotFound } from "../pages/NotFound";
import EmailSent from "../pages/EmailSent";
import VerifyResult from "../pages/VerifyResult";
import { Contact } from "../pages/Contact";
import { Learn } from "../pages/Learn";
import { Pricing } from "../pages/Pricing";
import { Profile } from "../pages/Profile";
import { Account } from "../pages/Account";
import { ProtectedRoute, GuestOnlyRoute, AdminRoute } from "./ProtectedRoute";
import AdminConsole from "../pages/AdminConsole";
import AdminReports from "../pages/AdminReports";
import AdminRevenue from "../pages/AdminRevenue";
import AdminUsers from "../pages/AdminUsers";
import AdminLabs from "../pages/AdminLabs";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/email-sent" element={<EmailSent />} />
      <Route path="/verify-result" element={<VerifyResult />} />

      <Route element={<GuestOnlyRoute />}>
        <Route path="/login" element={
          <Suspense fallback={<div>Loading...</div>}>
            <Login />
          </Suspense>
        } />
        <Route path="/signup" element={
          <Suspense fallback={<div>Loading...</div>}>
            <Signup />
          </Suspense>
        } />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<Account />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminConsole />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/labs" element={<AdminLabs />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/revenue" element={<AdminRevenue />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
