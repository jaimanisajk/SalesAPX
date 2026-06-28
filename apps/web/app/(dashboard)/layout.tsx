"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser, useOrganizationList } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  GitFork,
  Inbox,
  BarChart3,
  Settings,
  CreditCard,
  Bell,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation: SidebarItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", href: "/dashboard/leads", icon: Users },
    { name: "Sequences", href: "/dashboard/sequences", icon: GitFork },
    { name: "Inbox", href: "/dashboard/inbox", icon: Inbox, badgeCount: 3 },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-slate-800">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 bg-slate-900 border-b border-slate-800 gap-2">
            <Sparkles className="h-6 w-6 text-indigo-500" />
            <span className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ApexSDR
            </span>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto py-4 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 pl-2.5"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-300"
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badgeCount ? (
                    <span
                      className={`ml-3 inline-block py-0.5 px-2 text-xs font-semibold rounded-full ${
                        isActive
                          ? "bg-indigo-600/20 text-indigo-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>

          {/* User profile bottom bar */}
          <div className="flex-shrink-0 flex border-t border-slate-800 p-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-9 w-9 border border-slate-700",
                  },
                }}
              />
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-200">
                  {user?.fullName || "User Name"}
                </span>
                <span className="text-xs text-slate-500 capitalize">
                  {user?.emailAddresses[0]?.emailAddress.split("@")[0] || "member"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay and side panel */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 border-r border-slate-800">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4 gap-2">
                <Sparkles className="h-6 w-6 text-indigo-500" />
                <span className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  ApexSDR
                </span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                        isActive
                          ? "bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 pl-2.5"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-4 h-6 w-6" />
                      <span className="flex-1">{item.name}</span>
                      {item.badgeCount ? (
                        <span className="ml-3 inline-block py-0.5 px-2 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">
                          {item.badgeCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-slate-800 p-4 items-center gap-3">
              <UserButton afterSignOutUrl="/sign-in" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-200">{user?.fullName}</span>
                <span className="text-xs text-slate-500">Workspace Owner</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col md:pl-64 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center">
            <button
              type="button"
              className="px-4 border-r border-slate-800 text-slate-400 focus:outline-none md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-4 md:ml-0 flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-300">
                Workspace:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-indigo-400 border border-slate-700">
                {user?.firstName ? `${user.firstName}'s SDR Org` : "Loading Workspace..."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 focus:outline-none relative"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-900" />
            </button>
            <div className="h-6 w-px bg-slate-800" />
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
