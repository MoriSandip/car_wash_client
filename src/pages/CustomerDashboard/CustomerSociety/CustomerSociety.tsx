
import React, { useMemo, useState } from "react";
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Mail,
  UserRound,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import CSocietyForm from "./CSocietyForm";

// Update this import path to match your existing societyApi.ts location.
import {
  useGetMySocietiesQuery,
  useCreateSocietyMutation,
  type TSociety,
  type TSocietyPayload,
} from "@/redux/features/society/societyApi";

type TSocietyStatus = "PENDING" | "VERIFIED" | "REJECTED";

type TCustomerSociety = TSociety & {
  status?: TSocietyStatus;
  verificationNote?: string;
  verifiedAt?: string | null;
  createdBy?: string;
};

const statusConfig: Record<
  TSocietyStatus,
  {
    label: string;
    className: string;
    icon: React.ReactNode;
  }
> = {
  PENDING: {
    label: "Pending",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: <Clock className="mr-1 h-3.5 w-3.5" />,
  },
  VERIFIED: {
    label: "Verified",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 className="mr-1 h-3.5 w-3.5" />,
  },
  REJECTED: {
    label: "Rejected",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: <XCircle className="mr-1 h-3.5 w-3.5" />,
  },
};

const getSocietyStatus = (
  society: TCustomerSociety,
): TSocietyStatus => {
  const status = society.status?.toUpperCase();

  if (
    status === "VERIFIED" ||
    status === "REJECTED" ||
    status === "PENDING"
  ) {
    return status;
  }

  return "PENDING";
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    const err = error as {
      data?: { message?: string };
      message?: string;
    };

    return (
      err.data?.message ||
      err.message ||
      "Something went wrong. Please try again."
    );
  }

  return "Something went wrong. Please try again.";
};

const getCustomerSocieties = (
  response: unknown,
): TCustomerSociety[] => {
  if (Array.isArray(response)) {
    return response as TCustomerSociety[];
  }

  if (typeof response !== "object" || response === null) {
    return [];
  }

  const result = response as {
    data?: unknown;
    result?: unknown;
    societies?: unknown;
  };

  if (Array.isArray(result.data)) {
    return result.data as TCustomerSociety[];
  }

  if (Array.isArray(result.result)) {
    return result.result as TCustomerSociety[];
  }

  if (Array.isArray(result.societies)) {
    return result.societies as TCustomerSociety[];
  }

  if (typeof result.data === "object" && result.data !== null) {
    const nested = result.data as {
      data?: unknown;
      result?: unknown;
      societies?: unknown;
    };

    if (Array.isArray(nested.data)) {
      return nested.data as TCustomerSociety[];
    }

    if (Array.isArray(nested.result)) {
      return nested.result as TCustomerSociety[];
    }

    if (Array.isArray(nested.societies)) {
      return nested.societies as TCustomerSociety[];
    }
  }

  return [];
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const CustomerSociety: React.FC = () => {
  const {
    data: societyResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetMySocietiesQuery();

  const [createSociety, { isLoading: isCreating }] =
    useCreateSocietyMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedSociety, setSelectedSociety] =
    useState<TCustomerSociety | null>(null);
  const [search, setSearch] = useState("");

  const societies = useMemo(() => {
    return getCustomerSocieties(societyResponse).filter(
      (society) => !society.isDeleted,
    );
  }, [societyResponse]);

  const filteredSocieties = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) return societies;

    return societies.filter((society) => {
      return [
        society.name,
        society.address,
        society.city,
        society.state,
        society.pincode,
        society.contactPerson,
        society.phone,
        society.email,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(searchText),
      );
    });
  }, [societies, search]);

  const pendingCount = societies.filter(
    (society) => getSocietyStatus(society) === "PENDING",
  ).length;

  const verifiedCount = societies.filter(
    (society) => getSocietyStatus(society) === "VERIFIED",
  ).length;

  const rejectedCount = societies.filter(
    (society) => getSocietyStatus(society) === "REJECTED",
  ).length;

  const handleCreateSociety = async (payload: TSocietyPayload) => {
    try {
      await createSociety(payload).unwrap();

      toast.success("Society registered successfully");
      setFormOpen(false);
      await refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  const handleViewSociety = (society: TCustomerSociety) => {
    setSelectedSociety(society);
    setViewOpen(true);
  };

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch {
      toast.error("Unable to refresh societies");
    }
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Building2 className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                My Societies
              </h1>
              <p className="text-sm text-muted-foreground">
                Register and manage your society details.
              </p>
            </div>
          </div>
        </div>

        {/* Add Society button */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            type="button"
            onClick={() => setFormOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Society
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Societies
              </p>
              <p className="mt-2 text-3xl font-bold">
                {societies.length}
              </p>
            </div>

            <div className="rounded-xl bg-primary/10 p-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                Pending
              </p>
              <p className="mt-2 text-3xl font-bold text-amber-600">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                Verified
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {verifiedCount}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                Rejected
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600">
                {rejectedCount}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Society list */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Society List</CardTitle>
              <CardDescription className="mt-1">
                View your registered societies and verification status.
              </CardDescription>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search society..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Loading societies...
              </span>
            </div>
          ) : filteredSocieties.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>

              <h3 className="text-lg font-semibold">
                {search
                  ? "No matching societies"
                  : "No societies registered yet"}
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {search
                  ? "Try searching with another society name, city, or contact detail."
                  : "Register your society to get started. Once submitted, its verification status will appear here."}
              </p>

              {!search && (
                <Button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="mt-5 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Society
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="list-table">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-3 font-semibold">
                      Society
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Contact Person
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Contact Details
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Registration Date
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSocieties.map((society) => {
                    const status = getSocietyStatus(society);
                    const config = statusConfig[status];

                    return (
                      <tr
                        key={society._id}
                        className="border-b transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>

                            <div>
                              <p className="font-semibold">
                                {society.name}
                              </p>

                              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {[
                                  society.city,
                                  society.state,
                                ]
                                  .filter(Boolean)
                                  .join(", ") || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {society.contactPerson || "—"}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-1.5">
                            {society.phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                {society.phone}
                              </p>
                            )}

                            {society.email && (
                              <p className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                {society.email}
                              </p>
                            )}

                            {!society.phone && !society.email && "—"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(society.createdAt)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={config.className}
                          >
                            {config.icon}
                            {config.label}
                          </Badge>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSociety(society)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 text-xs text-muted-foreground">
                Showing {filteredSocieties.length} of {societies.length}{" "}
                societies
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Society dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!isCreating) setFormOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Register Society
            </DialogTitle>

            <DialogDescription>
              Enter your society details and submit them for verification.
            </DialogDescription>
          </DialogHeader>

          <CSocietyForm
            mode="add"
            loading={isCreating}
            onSubmit={handleCreateSociety}
            onClose={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Society dialog */}
      <Dialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) setSelectedSociety(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Society Details
            </DialogTitle>

            <DialogDescription>
              View society information and verification status.
            </DialogDescription>
          </DialogHeader>

          {selectedSociety && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold">
                      {selectedSociety.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Registered on{" "}
                      {formatDate(selectedSociety.createdAt)}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={
                    statusConfig[getSocietyStatus(selectedSociety)]
                      .className
                  }
                >
                  {statusConfig[getSocietyStatus(selectedSociety)].icon}
                  {statusConfig[getSocietyStatus(selectedSociety)].label}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">
                    Society Name
                  </Label>
                  <p className="font-medium">
                    {selectedSociety.name || "—"}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground">
                    Contact Person
                  </Label>
                  <p className="font-medium">
                    {selectedSociety.contactPerson || "—"}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground">
                    Phone
                  </Label>
                  <p className="flex items-center gap-2 font-medium">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {selectedSociety.phone || "—"}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground">
                    Email
                  </Label>
                  <p className="flex items-center gap-2 font-medium">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedSociety.email || "—"}
                  </p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-muted-foreground">
                    Address
                  </Label>
                  <p className="flex items-start gap-2 font-medium">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>
                      {[
                        selectedSociety.address,
                        selectedSociety.city,
                        selectedSociety.state,
                        selectedSociety.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </span>
                  </p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-muted-foreground">
                    Description
                  </Label>
                  <p className="whitespace-pre-wrap font-medium">
                    {selectedSociety.description || "—"}
                  </p>
                </div>
              </div>

              {getSocietyStatus(selectedSociety) === "REJECTED" && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="flex items-center gap-2 font-semibold text-red-700">
                    <XCircle className="h-4 w-4" />
                    Rejection Reason
                  </p>
                  <p className="mt-2 text-sm text-red-700">
                    {selectedSociety.verificationNote ||
                      "No rejection reason provided."}
                  </p>
                </div>
              )}

              {getSocietyStatus(selectedSociety) === "VERIFIED" && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="flex items-center gap-2 font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Society Verified
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    {selectedSociety.verifiedAt
                      ? `Verified on ${formatDate(selectedSociety.verifiedAt)}`
                      : "Your society has been verified by the administrator."}
                  </p>
                </div>
              )}

              {getSocietyStatus(selectedSociety) === "PENDING" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="flex items-center gap-2 font-semibold text-amber-700">
                    <Clock className="h-4 w-4" />
                    Verification Pending
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    Your society registration is awaiting administrator
                    verification.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setViewOpen(false);
                setSelectedSociety(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerSociety;
