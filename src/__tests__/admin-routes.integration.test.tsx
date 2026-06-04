import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProtectedRoute from "@/components/ProtectedRoute";

const mockUseAuth = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

const DummyAdminPage = () => <div data-testid="admin-content">ADMIN_PAGE</div>;
const DummyFeed = () => <div data-testid="feed-content">FEED_PAGE</div>;
const DummyHome = () => <div data-testid="home-content">HOME_PAGE</div>;

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<DummyHome />} />
    <Route path="/feed" element={<DummyFeed />} />
    <Route
      path="/admin"
      element={
        <ProtectedRoute requireAdmin>
          <DummyAdminPage />
        </ProtectedRoute>
      }
    />
    <Route path="/watch" element={<Navigate to="/feed" replace />} />
  </Routes>
);

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  );

describe("Admin routes — direct navigation", () => {
  beforeEach(() => mockUseAuth.mockReset());

  it("redirects logged-out users from /admin to /", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      isMember: false,
      isAdmin: false,
    });
    renderAt("/admin");
    expect(screen.queryByTestId("admin-content")).toBeNull();
    expect(screen.getByTestId("home-content")).toBeInTheDocument();
  });

  it("redirects non-admin members from /admin to /feed via /watch fallback", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      loading: false,
      isMember: true,
      isAdmin: false,
    });
    renderAt("/admin");
    expect(screen.queryByTestId("admin-content")).toBeNull();
    expect(screen.getByTestId("feed-content")).toBeInTheDocument();
  });

  it("allows admin users to reach /admin directly", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      loading: false,
      isMember: true,
      isAdmin: true,
    });
    renderAt("/admin");
    expect(screen.getByTestId("admin-content")).toBeInTheDocument();
    expect(screen.queryByTestId("feed-content")).toBeNull();
  });
});
