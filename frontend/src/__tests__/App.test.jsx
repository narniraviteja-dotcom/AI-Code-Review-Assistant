import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet } from "react-router-dom";
import { AppRoutes } from "../App";

// Mock the auth module
vi.mock("../auth", () => ({
  getAuthToken: vi.fn(() => "mock-token"),
  getCurrentUser: vi.fn(() => ({
    _id: "123",
    name: "Test User",
    email: "test@example.com",
  })),
  setStoredAuth: vi.fn(),
  clearStoredAuth: vi.fn(),
}));

// Mock axios
vi.mock("axios", () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    create: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ data: {} })),
      post: vi.fn(() => Promise.resolve({ data: {} })),
      delete: vi.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

// Mock child components to avoid deep rendering issues
vi.mock("../pages/Login", () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

vi.mock("../pages/Dashboard", () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));

vi.mock("../pages/UploadCode", () => ({
  default: () => <div data-testid="upload-page">Upload Code Page</div>,
}));

vi.mock("../pages/History", () => ({
  default: () => <div data-testid="history-page">History Page</div>,
}));

vi.mock("../pages/Profile", () => ({
  default: () => <div data-testid="profile-page">Profile Page</div>,
}));

vi.mock("../layouts/DashboardLayout", () => ({
  default: () => (
    <div data-testid="dashboard-layout">
      <nav>Dashboard Nav</nav>
      <Outlet />
    </div>
  ),
}));

describe("App Component", () => {
  it("renders login page at root route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId("login-page")).toBeDefined();
  });

  it("renders dashboard page at /dashboard", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId("dashboard-page")).toBeDefined();
  });

  it("renders upload page at /upload", () => {
    render(
      <MemoryRouter initialEntries={["/upload"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId("upload-page")).toBeDefined();
  });

  it("renders history page at /history", () => {
    render(
      <MemoryRouter initialEntries={["/history"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId("history-page")).toBeDefined();
  });

  it("renders profile page at /profile", () => {
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId("profile-page")).toBeDefined();
  });

  it("renders dashboard layout wrapper for protected routes", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId("dashboard-layout")).toBeDefined();
  });
});