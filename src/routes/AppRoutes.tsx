import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import SuspenseFallback from "../components/SuspenseFallback";
import { Home } from "../pages/Home";
import { ProtectedRoute, GuestOnlyRoute, AdminRoute } from "./ProtectedRoute";

const Login = lazy(() =>
  import("../pages/Login").then((m) => ({ default: m.Login }))
);
const Signup = lazy(() =>
  import("../pages/Signup").then((m) => ({ default: m.Signup }))
);
import { NotFound } from "../pages/NotFound";
const EmailSent = lazy(() =>
  import("../pages/EmailSent").then((m) => ({ default: m.default }))
);
const VerifyResult = lazy(() =>
  import("../pages/VerifyResult").then((m) => ({ default: m.default }))
);
const Contact = lazy(() =>
  import("../pages/Contact").then((m) => ({ default: m.Contact }))
);
const Learn = lazy(() =>
  import("../pages/Learn").then((m) => ({ default: m.Learn }))
);
const Pricing = lazy(() =>
  import("../pages/Pricing").then((m) => ({ default: m.Pricing }))
);
const Changelog = lazy(() =>
  import("../pages/Changelog").then((m) => ({ default: m.Changelog }))
);
const Profile = lazy(() =>
  import("../pages/Profile").then((m) => ({ default: m.Profile }))
);
const Account = lazy(() =>
  import("../pages/Account").then((m) => ({ default: m.Account }))
);
const AdminConsole = lazy(() =>
  import("../pages/AdminConsole").then((m) => ({ default: m.default }))
);
const AdminReports = lazy(() =>
  import("../pages/AdminReports").then((m) => ({ default: m.default }))
);
const AdminRevenue = lazy(() =>
  import("../pages/AdminRevenue").then((m) => ({ default: m.default }))
);
const AdminUsers = lazy(() =>
  import("../pages/AdminUsers").then((m) => ({ default: m.default }))
);
const AdminLabs = lazy(() =>
  import("../pages/AdminLabs").then((m) => ({ default: m.default }))
);
const PaymentResult = lazy(() =>
  import("../pages/PaymentResult").then((m) => ({ default: m.default }))
);
const EditLab = lazy(() =>
  import("../pages/EditLab").then((m) => ({ default: m.default }))
);

const LabDetail = lazy(() =>
  import("../pages/LabDetail").then((m) => ({ default: m.default }))
);
const Checkout = lazy(() =>
  import("../pages/Checkout").then((m) => ({ default: m.default }))
);
const Ranking = lazy(() =>
  import("../pages/Ranking").then((m) => ({ default: m.default }))
);
const Forum = lazy(() =>
  import("../pages/Forum").then((m) => ({ default: m.default }))
);

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/forum" element={<Forum />} />
      <Route
        path="/ranking"
        element={
          <Suspense fallback={<SuspenseFallback />}>
            <Ranking />
          </Suspense>
        }
      />
      {/* Public payment result routes to handle external redirects */}
      <Route path="/checkout/success" element={<PaymentResult />} />
      <Route path="/checkout/cancel" element={<PaymentResult />} />
      <Route
        path="/labs/:slug"
        element={
          <Suspense fallback={<SuspenseFallback />}>
            <LabDetail />
          </Suspense>
        }
      />
      <Route path="/contact" element={<Contact />} />
      <Route
        path="/changelog"
        element={
          <Suspense fallback={<SuspenseFallback />}>
            <Changelog />
          </Suspense>
        }
      />
      <Route path="/email-sent" element={<EmailSent />} />
      <Route path="/verify-result" element={<VerifyResult />} />

      <Route element={<GuestOnlyRoute />}>
        <Route
          path="/login"
          element={
            <Suspense fallback={<SuspenseFallback />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/signup"
          element={
            <Suspense fallback={<SuspenseFallback />}>
              <Signup />
            </Suspense>
          }
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<Account />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/labs/:id/edit" element={<EditLab />} />
        <Route
          path="/checkout"
          element={
            <Suspense fallback={<SuspenseFallback />}>
              <Checkout />
            </Suspense>
          }
        />
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
