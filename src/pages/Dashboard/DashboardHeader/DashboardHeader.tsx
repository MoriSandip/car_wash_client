import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { logout, selectCurrentUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, Search, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const DashboardHeader = () => {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const handelLogout = () => {
    dispatch(logout());
  };
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
<header className="sticky top-0 z-30 ml-10 mt-2 flex h-16 items-center gap-5  bg-white/95 px-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)] backdrop-blur-md transition-all sm:px-6">

  {/* Breadcrumb */}
<div className="hidden min-w-0 flex-1 md:block">
  <Breadcrumb>
    <div className="flex min-w-0 items-center gap-2">
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;

        const label = decodeURIComponent(value)
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        return (
          <div
            key={to}
            className="flex min-w-0 items-center gap-2"
          >
            {index > 0 && (
              <BreadcrumbSeparator className="shrink-0 text-slate-300" />
            )}

            <BreadcrumbItem className="min-w-0">
              {isLast ? (
                <span
                  aria-current="page"
                  className="block max-w-[220px] truncate text-sm font-semibold text-slate-800"
                  title={label}
                >
                  {label}
                </span>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    to={to}
                    className="block max-w-[180px] truncate text-sm font-medium text-slate-500 transition-colors hover:text-sky-600"
                    title={label}
                  >
                    {label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        );
      })}
    </div>
  </Breadcrumb>

  <p className="mt-1 truncate text-[11px] tracking-wide text-slate-400">
    Manage your workspace
  </p>
</div>

  {/* Search */}
  <div className="relative ml-auto w-full max-w-[340px] flex-1 md:ml-0 md:flex-none">
    <Search className="absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" />

    <Input
      type="search"
      placeholder="Search anything..."
      className="h-11 rounded-xl border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm shadow-none transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus-visible:border-sky-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-sky-100"
    />
  </div>

  {/* Profile Menu */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        className="h-11 shrink-0 gap-2 rounded-xl border border-transparent px-2 transition-all hover:border-slate-200 hover:bg-slate-50 sm:gap-3 sm:px-3"
      >
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-200">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              width={36}
              height={36}
              alt="Avatar"
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <UserRound className="h-5 w-5" />
          )}
        </span>

        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold text-slate-800">
            My Account
          </span>
          <span className="block text-[11px] text-slate-400">
            Account settings
          </span>
        </span>

        <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      sideOffset={8}
      className="w-56 rounded-xl border-slate-200 p-2 shadow-xl"
    >
      <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        My Account
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={handelLogout}
        className="cursor-pointer gap-2 rounded-lg px-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</header>

  );
};

export default DashboardHeader;
