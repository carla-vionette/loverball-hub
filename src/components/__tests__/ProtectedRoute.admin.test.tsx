import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProtectedRoute from "../ProtectedRoute";

const mockUseAuth = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <div>ADMIN_CONTENT</div>
            </ProtectedRoute>
          }
        />
        <Route path="/watch" element={<div>WATCH_PAGE</div>} />
        <Route path="/" element={<div>HOME</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute admin gating", () => {
  beforeEach(() => mockUseAuth.mockReset());

  it("redirects logged-out users away from /admin", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      isMember: false,
      isAdmin: false,
    });
    renderAt("/admin");
    expect(screen.queryByText("ADMIN_CONTENT")).toBeNull();
    expect(screen.getByText("HOME")).toBeInTheDocument();
  });

  it("redirects non-admin members to /watch", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      loading: false,
      isMember: true,
      isAdmin: false,
    });
    renderAt("/admin");
    expect(screen.queryByText("ADMIN_CONTENT")).toBeNull();
    expect(screen.getByText("WATCH_PAGE")).toBeInTheDocument();
  });

  it("renders admin content for admin users", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      loading: false,
      isMember: true,
      isAdmin: true,
    });
    renderAt("/admin");
    expect(screen.getByText("ADMIN_CONTENT")).toBeInTheDocument();
  });

  it("shows loading spinner while auth resolves", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      isMember: false,
      isAdmin: false,
    });
    const { container } = renderAt("/admin");
    expect(screen.queryByText("ADMIN_CONTENT")).toBeNull();
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });
});
