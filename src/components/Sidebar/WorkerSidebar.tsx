import React from "react";
import {
  Home,
  Package2,
  PanelLeft,
  ClipboardList,
  UserRound,
  Settings,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DashboardHeader from "@/pages/Dashboard/DashboardHeader/DashboardHeader";

 
const navGroups = [
  {
    title: "Dashboard",
    items: [{ title: "Dashboard", href: "/worker", icon: Home }],
  },
  {
    title: "My Work",
    items: [
      {
        title: "Assigned Bookings",
        href: "/bookings",
        icon: ClipboardList,
      },
      {
        title: "Attendance",
        href: "/worker/attendance",
        icon: CalendarCheck,
      },
      {
        title: "My Attendance Report",
        href: "/worker/attendance/report",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    title: "Account",
    items: [{ title: "My Profile", href: "/profile", icon: UserRound }],
  },
];

const WorkerSidebar: React.FC = () => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(navGroups.map(({ title }) => [title, false])),
  );

  const toggleGroup = (title: string) => {
    setExpandedGroups((current) => ({ ...current, [title]: !current[title] }));
  };

  const isActive = (path: string) => {
    const currentPath =
      location.pathname.replace(/\/+$/, "") || "/";
    const targetPath = path.replace(/\/+$/, "") || "/";

    if (targetPath === "/worker") {
      return currentPath === "/worker";
    }
    if (targetPath === "/worker/attendance") {
      return currentPath === targetPath;
    }

    return (
      currentPath === targetPath ||
      currentPath.startsWith(`${targetPath}/`)
    );
  };

  const desktopNavClass = (path: string) => {
    const active = isActive(path);

    return [
      "flex h-10 w-full items-center justify-start gap-3 rounded-lg px-3",
      "transition-colors duration-200",
      active
        ? "bg-sky-100 text-sky-700 font-semibold ring-1 ring-inset ring-sky-200"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    ].join(" ");
  };

  const mobileNavClass = (path: string) => {
    const active = isActive(path);

    return [
      "flex w-full items-center gap-3 rounded-lg px-3 py-3",
      "transition-colors duration-200",
      active
        ? "bg-sky-100 text-sky-700 font-semibold ring-1 ring-inset ring-sky-200"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    ].join(" ");
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Mobile menu button */}
        <div className="fixed left-3 top-3 z-50 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open worker navigation menu"
                className="h-10 w-10 border-slate-200 bg-white shadow-sm"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="flex w-72 flex-col p-0"
            >
              <div className="border-b border-slate-200 px-5 py-5">
                <Link
                  to="/worker"
                  className="flex items-center gap-2 font-bold text-slate-900"
                >
                  <Package2 className="h-6 w-6 text-sky-600" />
                  <span className="text-lg">DevERP Worker</span>
                </Link>
              </div>

              <nav className="flex-1 space-y-5 overflow-y-auto p-3">
                {navGroups.map((group) => (
                  <section key={group.title}>
                    <h2 className="mb-2">
                      <button
                        type="button"
                        aria-expanded={expandedGroups[group.title]}
                        aria-controls={`worker-mobile-${group.title.replace(/\W+/g, "-")}`}
                        onClick={() => toggleGroup(group.title)}
                        className="flex w-full items-center justify-between rounded px-3 py-1 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-700"
                      >
                        {group.title}
                        {expandedGroups[group.title] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </h2>
                    <div
                      id={`worker-mobile-${group.title.replace(/\W+/g, "-")}`}
                      className={expandedGroups[group.title] ? "space-y-1" : "hidden"}
                    >
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <SheetClose asChild key={item.href}>
                            <Link
                              to={item.href}
                              className={mobileNavClass(item.href)}
                              aria-current={active ? "page" : undefined}
                            >
                              <Icon className="h-5 w-5 shrink-0" />
                              <span>{item.title}</span>
                              {active && (
                                <span className="ml-auto h-2 w-2 rounded-full bg-sky-600" />
                              )}
                            </Link>
                          </SheetClose>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </nav>

              <div className="border-t border-slate-200 p-3">
                <SheetClose asChild>
                  <Link
                    to="/"
                    className={mobileNavClass("/")}
                  >
                    <Settings className="h-5 w-5 shrink-0" />
                    <span>Back to Website</span>
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col border-r border-slate-200 bg-white md:flex lg:w-56">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-slate-200 px-3 lg:justify-start lg:px-5">
            <Link
              to="/worker"
              className="flex items-center gap-2 font-bold text-slate-900"
            >
              <Package2 className="h-7 w-7 shrink-0 text-sky-600" />
              <span className="hidden text-lg lg:inline">
                DevERP Worker
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-4 overflow-y-auto p-2">
            {navGroups.map((group) => (
              <section key={group.title}>
                <h2 className="mb-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`${expandedGroups[group.title] ? "Collapse" : "Expand"} ${group.title}`}
                        aria-expanded={expandedGroups[group.title]}
                        aria-controls={`worker-desktop-${group.title.replace(/\W+/g, "-")}`}
                        onClick={() => toggleGroup(group.title)}
                        className="flex h-8 w-full items-center justify-between rounded px-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                      >
                        <span className="hidden lg:inline">{group.title}</span>
                        {expandedGroups[group.title] ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="lg:hidden">
                      {group.title}
                    </TooltipContent>
                  </Tooltip>
                </h2>
                <div
                  id={`worker-desktop-${group.title.replace(/\W+/g, "-")}`}
                  className={expandedGroups[group.title] ? "space-y-1" : "hidden"}
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.href}
                            className={desktopNavClass(item.href)}
                            aria-current={active ? "page" : undefined}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="hidden truncate lg:inline">
                              {item.title}
                            </span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="lg:hidden">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-200 p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/"
                  className={desktopNavClass("/")}
                >
                  <Settings className="h-5 w-5 shrink-0" />

                  <span className="hidden lg:inline">
                    Back to Website
                  </span>
                </Link>
              </TooltipTrigger>

              <TooltipContent
                side="right"
                className="lg:hidden"
              >
                Back to Website
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>

        {/* Main content */}
         <div className="min-w-0 md:pl-16 lg:pl-48">
          <DashboardHeader />

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WorkerSidebar;
