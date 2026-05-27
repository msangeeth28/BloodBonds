import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import DonorPage from "./pages/DonorPage";
import OrgPage from "./pages/OrgPage";
import AdminPage from "./pages/AdminPage";

/*
  ProtectedRoute — keeps logged-out users away from dashboards.
  If there is no token or the role doesn't match, redirect to home.
*/
function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  // Not logged in at all → go to home
  if (!user || !localStorage.getItem("token")) {
    return <Navigate to="/" replace />;
  }

  // Logged in but wrong role (e.g. donor trying to reach /org) → send to their own dashboard
  if (role && user.role !== role) {
    if (user.role === "donor")        return <Navigate to="/donor" replace />;
    if (user.role === "organization") return <Navigate to="/org"   replace />;
    if (user.role === "admin")        return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

/*
  PublicRoute — keeps already-logged-in users away from the home page.
  If someone presses the browser back button after logging in they would
  land on "/" (home). This guard catches that and sends them back to
  their dashboard instead of showing the landing page.

  This also prevents a logged-in user from accessing "/" directly via the
  address bar or any link.
*/
function PublicRoute({ children }) {
  const { user } = useAuth();

  if (user && localStorage.getItem("token")) {
    // Already logged in — redirect straight to the correct dashboard
    if (user.role === "donor")        return <Navigate to="/donor" replace />;
    if (user.role === "organization") return <Navigate to="/org"   replace />;
    if (user.role === "admin")        return <Navigate to="/admin" replace />;
  }

  // Not logged in — show the home/landing page normally
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Home is wrapped in PublicRoute so logged-in users can never see it */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Home />
          </PublicRoute>
        }
      />

      {/* Each dashboard is wrapped in ProtectedRoute so logged-out users are redirected */}
      <Route
        path="/donor"
        element={
          <ProtectedRoute role="donor">
            <DonorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/org"
        element={
          <ProtectedRoute role="organization">
            <OrgPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Any unknown URL → home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
