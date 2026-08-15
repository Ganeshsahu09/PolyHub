import React from "react";
import { Routes, Route, Navigate, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DiscoverDesigners from "./pages/DiscoverDesigners";
import DesignerProfile from "./pages/DesignerProfile";
import BuyerHome from "./components/BuyerHome";
import SearchResults from "./components/SearchResults";
import PolyHubModelDetail from "./components/PolyHubModelDetail";
import DesignerRepo from "./components/DesignerRepo";
import PrinterDashboard from "./components/PrinterDashboard";

function BuyerDiscovery() {
  const navigate = useNavigate();
  return (
    <BuyerHome
      onViewChange={(view, modelId) => {
        if (view === "buyer-detail" || view === "model-detail") {
          navigate(`/buyer/model/${modelId}`);
        }
      }}
      onSearchSubmit={(query) => {
        navigate(`/buyer/search?q=${encodeURIComponent(query)}`);
      }}
    />
  );
}

function BuyerSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  return (
    <SearchResults
      initialQuery={searchParams.get("q") || ""}
      onViewChange={(view, modelId) => {
        if (view === "buyer-home") navigate("/buyer");
        if (view === "buyer-detail" || view === "model-detail") navigate(`/buyer/model/${modelId}`);
      }}
    />
  );
}

function BuyerModel() {
  const navigate = useNavigate();
  const { modelId } = useParams();
  return (
    <PolyHubModelDetail
      modelId={modelId}
      onViewChange={(view) => {
        if (view === "buyer-home") navigate("/buyer");
      }}
    />
  );
}

function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const roleLinks = [
    { role: "BUYER", label: "Buyer", path: "/buyer" },
    { role: "DESIGNER", label: "Designer", path: "/designer" },
    { role: "PRINTER_OWNER", label: "Printer", path: "/printer" },
  ].filter((r) => user.roles.includes(r.role));

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-6 py-3 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-teal-300">PolyHub</span>
        {roleLinks.map((r) => (
          <Link key={r.role} to={r.path} className="text-xs font-medium text-zinc-400 hover:text-zinc-100">
            {r.label}
          </Link>
        ))}
        <Link to="/discover" className="text-xs font-medium text-zinc-400 hover:text-zinc-100">
          Discover
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500">{user.email}</span>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.roles.includes("BUYER")) return <Navigate to="/buyer" replace />;
  if (user.roles.includes("DESIGNER")) return <Navigate to="/designer" replace />;
  if (user.roles.includes("PRINTER_OWNER")) return <Navigate to="/printer" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="relative min-h-screen bg-zinc-950">
      <TopNav />
      <div className="pt-14">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/buyer"
            element={
              <ProtectedRoute requireRole="BUYER">
                <BuyerDiscovery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/search"
            element={
              <ProtectedRoute requireRole="BUYER">
                <BuyerSearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/model/:modelId"
            element={
              <ProtectedRoute>
                <BuyerModel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/designer"
            element={
              <ProtectedRoute requireRole="DESIGNER">
                <DesignerRepo />
              </ProtectedRoute>
            }
          />

          <Route
            path="/printer"
            element={
              <ProtectedRoute requireRole="PRINTER_OWNER">
                <PrinterDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <DiscoverDesigners />
              </ProtectedRoute>
            }
          />
          <Route
            path="/designers/:id"
            element={
              <ProtectedRoute>
                <DesignerProfile />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </div>
    </div>
  );
}