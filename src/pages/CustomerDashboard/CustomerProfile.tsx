import { useMemo } from "react";
import {
  UserRound,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  CalendarDays,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetMyCustomerProfileQuery } from "@/redux/features/customer/customerApi";

 
type TCustomerProfile = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "C";

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

const getDisplayValue = (value?: string) =>
  value?.trim() || "Not provided";

export default function CustomerProfile() {
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMyCustomerProfileQuery();

  const customer: TCustomerProfile | undefined = useMemo(() => {
    const payload = response?.data;

    // API response format: { data: customer }
    // Also supports nested { data: { data: customer } }.
    const profile =
      payload &&
      typeof payload === "object" &&
      "data" in payload
        ? payload.data
        : payload;

    return profile && typeof profile === "object"
      ? (profile as TCustomerProfile)
      : undefined;
  }, [response]);

  const name = customer?.name || "Customer";
  const email = getDisplayValue(customer?.email);
  const phone = getDisplayValue(customer?.phone);
  const address = getDisplayValue(customer?.address);

  const status = customer?.status || "Unknown";
  const isActive = status.toUpperCase() === "ACTIVE";

  if (isLoading) {
    return (
      <div className="space-y-6 px-12 py-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-52 animate-pulse rounded-xl bg-slate-200" />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>

        <h2 className="text-xl font-semibold text-slate-900">
          Unable to load profile
        </h2>

        <p className="max-w-md text-sm text-slate-500">
          We couldn't retrieve your customer details. Please try again.
        </p>

        <Button onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              isFetching ? "animate-spin" : ""
            }`}
          />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/70 p-4 md:p-6 lg:p-8">
      {/* Page heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View your personal information and customer account details.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-fit bg-white"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              isFetching ? "animate-spin" : ""
            }`}
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
                {getInitials(name)}
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
                    Customer Account
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
              value={address}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
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
              icon={<UserRound className="h-5 w-5" />}
              label="Role"
              value="CUSTOMER"
            />

            <InfoRow
              icon={<CalendarDays className="h-5 w-5" />}
              label="Account Created"
              value={formatDate(customer.createdAt)}
            />

            <InfoRow
              icon={<CalendarDays className="h-5 w-5" />}
              label="Last Updated"
              value={formatDate(customer.updatedAt)}
            />

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">
                Customer ID
              </p>
              <p className="mt-1 break-all font-mono text-xs text-slate-700">
                {customer._id || "Not available"}
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
