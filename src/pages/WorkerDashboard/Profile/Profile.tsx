import { useMemo } from "react";
import {
  UserRound,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  CalendarDays,
  BriefcaseBusiness,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { useGetMyProfileQuery } from "@/redux/features/worker/workerApi";

type TWorkerProfile = {
  _id?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  profileImage?: string;
  image?: string;
  status?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
};

const getInitials = (name: string) => {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "W"
  );
};

const formatDate = (value?: string) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getDisplayValue = (value?: string) => {
  return value?.trim() || "Not provided";
};

export default function Profile() {
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMyProfileQuery();

  const worker: TWorkerProfile | undefined = useMemo(() => {
    const payload = response?.data ?? response;

    // Supports either { data: worker } or { data: { data: worker } }.
    const profile = payload?.data ?? payload;

    return profile && typeof profile === "object"
      ? (profile as TWorkerProfile)
      : undefined;
  }, [response]);

  const name =
    worker?.name ||
    worker?.fullName ||
    [worker?.firstName, worker?.lastName].filter(Boolean).join(" ") ||
    "Worker";

  const email = getDisplayValue(worker?.email);
  const phone = getDisplayValue(
    worker?.phone || worker?.phoneNumber || worker?.mobile,
  );

  const address = [
    worker?.address,
    worker?.city,
    worker?.state,
  ]
    .filter(Boolean)
    .join(", ");

  const status = worker?.status || "Unknown";
  const isActive = status.toUpperCase() === "ACTIVE";

  if (isLoading) {
  return (
    <div className="space-y-6 bg-slate-50/70 p-4 md:p-6 lg:p-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />

      <div className="h-52 animate-pulse rounded-xl bg-slate-200" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

  if (isError || !worker) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>

        <h2 className="text-xl font-semibold text-slate-900">
          Unable to load profile
        </h2>

        <p className="max-w-md text-sm text-slate-500">
          We couldn't retrieve your profile details. Please try again.
        </p>

        <Button onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* Page heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View your personal information and worker account details.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-fit bg-white"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Profile banner */}
      <Card className="overflow-hidden border-0 shadow-sm">
        <div className="h-28 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 sm:h-36" />

        <CardContent className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-blue-100 text-2xl font-bold text-blue-700 shadow-sm sm:h-28 sm:w-28">
                {worker.profileImage || worker.image ? (
                  <img
                    src={worker.profileImage || worker.image}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(name)
                )}
              </div>

              <div className="min-w-0 pb-1">
                <h2 className="break-words text-xl font-bold text-slate-900 sm:text-2xl">
                  {name}
                </h2>

                <p className="mt-1 break-all text-sm text-slate-500">
                  {email}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {status}
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Worker Account
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pb-1 text-sm text-slate-500">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Authenticated Account
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-5 w-5 text-blue-600" />
              Personal Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 p-5">
            <InfoRow
              icon={<UserRound className="h-5 w-5" />}
              label="Full Name"
              value={name}
            />

            <InfoRow
              icon={<Mail className="h-5 w-5" />}
              label="Email Address"
              value={email}
            />

            <InfoRow
              icon={<Phone className="h-5 w-5" />}
              label="Phone Number"
              value={phone}
            />

            <InfoRow
              icon={<MapPin className="h-5 w-5" />}
              label="Address"
              value={getDisplayValue(address)}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <BriefcaseBusiness className="h-5 w-5 text-blue-600" />
              Account Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 p-5">
            <InfoRow
              icon={<ShieldCheck className="h-5 w-5" />}
              label="Account Status"
              value={status}
            />

            <InfoRow
              icon={<BriefcaseBusiness className="h-5 w-5" />}
              label="Role"
              value={worker.role || "WORKER"}
            />

            <InfoRow
              icon={<CalendarDays className="h-5 w-5" />}
              label="Account Created"
              value={formatDate(worker.createdAt)}
            />

            <InfoRow
              icon={<CalendarDays className="h-5 w-5" />}
              label="Last Updated"
              value={formatDate(worker.updatedAt)}
            />

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">
                Worker ID
              </p>
              <p className="mt-1 break-all font-mono text-xs text-slate-700">
                {worker._id || "Not available"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}
