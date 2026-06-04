import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminDashboard from "../AdminDashboard";

const mockUseAuth = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/services/adminService", () => ({
  fetchMembers: vi.fn().mockResolvedValue([]),
  fetchApplications: vi.fn().mockResolvedValue([]),
  fetchCreatorApplications: vi.fn().mockResolvedValue([]),
  fetchAdminEvents: vi.fn().mockResolvedValue([]),
  fetchPendingEvents: vi.fn().mockResolvedValue([]),
  fetchAdminVideos: vi.fn().mockResolvedValue([]),
  fetchAllVideosForAdmin: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/services/analyticsService", () => ({
  fetchDashboardStats: vi.fn().mockResolvedValue({
    totalMembers: 0,
    totalVideos: 0,
    totalEvents: 0,
    activeSubscriptions: 0,
    recentSignups: 0,
  }),
}));

vi.mock("@/components/admin/AdminSidebar", () => ({
  default: () => <aside data-testid="admin-sidebar" />,
}));

vi.mock("@/components/admin/KpiCard", () => ({
  default: ({ label }: { label: string }) => <div data-testid={`kpi-${label}`} />,
}));

vi.mock("@/pages/admin/AdminMembersTab", () => ({
  default: () => <div data-testid="members-tab" />,
}));

vi.mock("@/pages/admin/AdminVideosTab", () => ({
  default: () => <div data-testid="videos-tab" />,
}));

vi.mock("@/pages/admin/AdminEventsTab", () => ({
  default: () => <div data-testid="events-tab" />,
}));

vi.mock("@/pages/admin/AdminApplicationsTab", () => ({
  default: () => <div data-testid="applications-tab" />,
}));

vi.mock("@/pages/admin/AdminCreatorApplicationsTab", () => ({
  default: () => <div data-testid="creator-apps-tab" />,
}));

vi.mock("@/pages/admin/AdminEventApprovalsTab", () => ({
  default: () => <div data-testid="event-approvals-tab" />,
}));

vi.mock("@/pages/admin/AdminVideoApprovalsTab", () => ({
  default: () => <div data-testid="video-approvals-tab" />,
}));

vi.mock("@/pages/admin/AdminSubscriptionsTab", () => ({
  default: () => <div data-testid="subscriptions-tab" />,
}));

vi.mock("@/pages/admin/AdminAnalyticsTab", () => ({
  default: () => <div data-testid="analytics-tab" />,
}));

const renderAdmin = () =>
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/watch" element={<div>WATCH_PAGE</div>} />
        <Route path="/" element={<div>HOME</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("AdminDashboard direct-access guard", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockNavigate.mockReset();
  });

  it("redirects logged-out users to /watch when accessed directly", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAdmin: false,
    });
    renderAdmin();
    expect(mockNavigate).toHaveBeenCalledWith("/watch");
  });

  it("redirects non-admin members to /watch when accessed directly", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      isAdmin: false,
    });
    renderAdmin();
    expect(mockNavigate).toHaveBeenCalledWith("/watch");
  });

  it("renders dashboard content for admin users", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      isAdmin: true,
    });
    renderAdmin();
    // Wait for data fetch to resolve
    const sidebar = await screen.findByTestId("admin-sidebar");
    expect(sidebar).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
