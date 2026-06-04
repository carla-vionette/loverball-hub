import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SiteNav from "../SiteNav";

const mockUseAuth = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/NotificationBell", () => ({
  default: () => <div data-testid="notif-bell" />,
}));

vi.mock("@/assets/loverball-logo-black.png", () => ({ default: "logo.png" }));

const renderNav = () =>
  render(
    <MemoryRouter>
      <SiteNav />
    </MemoryRouter>
  );

describe("SiteNav Admin link visibility", () => {
  beforeEach(() => mockUseAuth.mockReset());

  it("does not render Admin link for logged-out users", () => {
    mockUseAuth.mockReturnValue({ user: null, isAdmin: false });
    renderNav();
    expect(screen.queryByRole("link", { name: /admin/i })).toBeNull();
  });

  it("does not render Admin link for non-admin members", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isAdmin: false });
    renderNav();
    expect(screen.queryByRole("link", { name: /admin/i })).toBeNull();
  });

  it("renders Admin link for admin users", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isAdmin: true });
    renderNav();
    const adminLinks = screen.getAllByRole("link", { name: /admin/i });
    expect(adminLinks.length).toBeGreaterThan(0);
    expect(adminLinks[0]).toHaveAttribute("href", "/admin");
  });
});
