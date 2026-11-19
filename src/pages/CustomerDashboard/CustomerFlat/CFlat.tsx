import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Home,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil,
  Layers3,
  Ruler,
  AlertCircle,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
} from "@/components/ui/dialog";

import {
  useGetMyFlatsQuery,
  useCreateFlatMutation,
  useUpdateFlatMutation,
} from "@/redux/features/flat/flatApi";

import type {
  TFlat,
  TFlatPayload,
  TFlatVerificationStatus,
} from "@/redux/features/flat/flatApi";

import CFlatForm from "./CFlatForm";

type FormMode = "add" | "edit" | "view";

const getFlatArray = (response: unknown): TFlat[] => {
  if (Array.isArray(response)) {
    return response as TFlat[];
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const obj = response as {
    data?: unknown;
    result?: unknown;
    flats?: unknown;
  };

  if (Array.isArray(obj.data)) {
    return obj.data as TFlat[];
  }

  if (Array.isArray(obj.result)) {
    return obj.result as TFlat[];
  }

  if (Array.isArray(obj.flats)) {
    return obj.flats as TFlat[];
  }

  if (obj.data && typeof obj.data === "object") {
    const nested = obj.data as {
      data?: unknown;
      result?: unknown;
      flats?: unknown;
    };

    if (Array.isArray(nested.result)) {
      return nested.result as TFlat[];
    }

    if (Array.isArray(nested.data)) {
      return nested.data as TFlat[];
    }

    if (Array.isArray(nested.flats)) {
      return nested.flats as TFlat[];
    }
  }

  return [];
};

const getSocietyName = (societyId: TFlat["societyId"]) => {
  if (societyId && typeof societyId === "object") {
    return societyId.name || "Society";
  }

  return "Society";
};

const getVerificationStatus = (
  status?: string,
): TFlatVerificationStatus => {
  const value = status?.toUpperCase();

  if (
    value === "VERIFIED" ||
    value === "REJECTED" ||
    value === "PENDING"
  ) {
    return value;
  }

  return "PENDING";
};

const getVerificationBadge = (status?: string) => {
  const value = getVerificationStatus(status);

  switch (value) {
    case "VERIFIED":
      return (
        <Badge
          variant="outline"
          className="border-green-200 bg-green-50 text-green-700"
        >
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
          Verified
        </Badge>
      );

    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="border-red-200 bg-red-50 text-red-700"
        >
          <XCircle className="mr-1 h-3.5 w-3.5" />
          Rejected
        </Badge>
      );

    default:
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700"
        >
          <Clock className="mr-1 h-3.5 w-3.5" />
          Pending
        </Badge>
      );
  }
};

const getOccupancyBadge = (status: TFlat["status"]) => {
  switch (status) {
    case "Occupied":
      return (
        <Badge
          variant="outline"
          className="border-blue-200 bg-blue-50 text-blue-700"
        >
          Occupied
        </Badge>
      );

    case "Maintenance":
      return (
        <Badge
          variant="outline"
          className="border-orange-200 bg-orange-50 text-orange-700"
        >
          Maintenance
        </Badge>
      );

    default:
      return (
        <Badge
          variant="outline"
          className="border-gray-200 bg-gray-50 text-gray-700"
        >
          Available
        </Badge>
      );
  }
};

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object") {
    const apiError = error as {
      data?: { message?: string };
      error?: string;
      message?: string;
    };

    return (
      apiError.data?.message ||
      apiError.error ||
      apiError.message ||
      "Something went wrong. Please try again."
    );
  }

  return "Something went wrong. Please try again.";
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const CFlat: React.FC = () => {
  const {
    data: flatsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetMyFlatsQuery(undefined);

  const [createFlat, { isLoading: isCreating }] =
    useCreateFlatMutation();

  const [updateFlat, { isLoading: isUpdating }] =
    useUpdateFlatMutation();

  const [search, setSearch] = useState("");

  const [verificationFilter, setVerificationFilter] =
    useState<"ALL" | TFlatVerificationStatus>("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [mode, setMode] = useState<FormMode>("add");

  const [selectedFlat, setSelectedFlat] =
    useState<TFlat | null>(null);

  const [actionError, setActionError] = useState("");

  const flats = useMemo(
    () => getFlatArray(flatsResponse),
    [flatsResponse],
  );

  const filteredFlats = useMemo(() => {
    const term = search.trim().toLowerCase();

    return flats.filter((flat) => {
      const flatNumber = (flat.flatNumber || "").toLowerCase();
      const block = (flat.block || "").toLowerCase();
      const flatType = (flat.flatType || "").toLowerCase();
      const societyName = getSocietyName(flat.societyId).toLowerCase();

      const matchesSearch =
        !term ||
        flatNumber.includes(term) ||
        block.includes(term) ||
        flatType.includes(term) ||
        societyName.includes(term);

      const status = getVerificationStatus(
        flat.verificationStatus,
      );

      const matchesVerification =
        verificationFilter === "ALL" ||
        status === verificationFilter;

      return matchesSearch && matchesVerification;
    });
  }, [flats, search, verificationFilter]);

  const pendingCount = flats.filter(
    (flat) =>
      getVerificationStatus(flat.verificationStatus) === "PENDING",
  ).length;

  const verifiedCount = flats.filter(
    (flat) =>
      getVerificationStatus(flat.verificationStatus) === "VERIFIED",
  ).length;

  const rejectedCount = flats.filter(
    (flat) =>
      getVerificationStatus(flat.verificationStatus) === "REJECTED",
  ).length;

  const openAddDialog = () => {
    setSelectedFlat(null);
    setMode("add");
    setActionError("");
    setDialogOpen(true);
  };

  const openEditDialog = (flat: TFlat) => {
    if (
      getVerificationStatus(flat.verificationStatus) === "VERIFIED"
    ) {
      toast.error(
        "Verified flats cannot be edited. Please contact the administrator.",
      );
      return;
    }

    setSelectedFlat(flat);
    setMode("edit");
    setActionError("");
    setDialogOpen(true);
  };

  const openViewDialog = (flat: TFlat) => {
    setSelectedFlat(flat);
    setMode("view");
    setActionError("");
    setDialogOpen(true);
  };

  const handleSubmit = async (payload: TFlatPayload) => {
    setActionError("");

    try {
      if (mode === "edit" && selectedFlat?._id) {
        await updateFlat({
          id: selectedFlat._id,
          data: payload,
        }).unwrap();

        toast.success("Flat updated successfully");
      } else {
        await createFlat(payload).unwrap();

        toast.success(
          "Flat registered successfully. Awaiting admin verification.",
        );
      }

      setDialogOpen(false);
      setSelectedFlat(null);
      setActionError("");

      await refetch();
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setActionError(message);
      toast.error(message);

      throw error;
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch {
      toast.error("Unable to refresh flats.");
    }
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-2.5">
            <Building2 className="h-6 w-6 text-blue-700" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              My Flats
            </h1>

            <p className="text-sm text-slate-500">
              Register and manage your society flats.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>

          <Button
            type="button"
            onClick={openAddDialog}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Flat
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">Total Flats</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {flats.length}
              </p>
            </div>

            <div className="rounded-xl bg-blue-100 p-3">
              <Home className="h-6 w-6 text-blue-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">Pending Approval</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-xl bg-amber-100 p-3">
              <Clock className="h-6 w-6 text-amber-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">Verified Flats</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {verifiedCount}
              </p>
            </div>

            <div className="rounded-xl bg-green-100 p-3">
              <ShieldCheck className="h-6 w-6 text-green-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">Rejected Flats</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {rejectedCount}
              </p>
            </div>

            <div className="rounded-xl bg-red-100 p-3">
              <XCircle className="h-6 w-6 text-red-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <div>
            <p className="font-semibold">Unable to load your flats</p>
            <p className="mt-1">{getErrorMessage(error)}</p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void refetch()}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Flats list */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="gap-4">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <CardTitle className="text-lg">
                Registered Flats
              </CardTitle>

              <CardDescription className="mt-1">
                View your submissions and their approval status.
              </CardDescription>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search flats..."
                  className="pl-9 sm:w-64"
                />
              </div>

              <select
                value={verificationFilter}
                onChange={(event) =>
                  setVerificationFilter(
                    event.target.value as
                      | "ALL"
                      | TFlatVerificationStatus,
                  )
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Approval Status</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <RefreshCw className="mr-2 h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-slate-500">
                Loading your flats...
              </span>
            </div>
          ) : filteredFlats.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center">
              <div className="mb-3 rounded-full bg-slate-100 p-4">
                <Home className="h-8 w-8 text-slate-400" />
              </div>

              <h3 className="font-semibold text-slate-800">
                {flats.length === 0
                  ? "No flats registered yet"
                  : "No matching flats found"}
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {flats.length === 0
                  ? "Add your flat details to submit it for administrator approval."
                  : "Try changing your search or approval status filter."}
              </p>

              {flats.length === 0 && (
                <Button
                  type="button"
                  onClick={openAddDialog}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Register Your First Flat
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="list-table">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-500">
                      <th className="px-4 py-3 font-medium">Flat</th>
                      <th className="px-4 py-3 font-medium">Society</th>
                      <th className="px-4 py-3 font-medium">Details</th>
                      <th className="px-4 py-3 font-medium">Occupancy</th>
                      <th className="px-4 py-3 font-medium">Approval</th>
                      <th className="px-4 py-3 font-medium">Registered</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredFlats.map((flat) => (
                      <tr
                        key={flat._id}
                        className="border-b last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-50 p-2">
                              <Home className="h-5 w-5 text-blue-700" />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {flat.flatNumber}
                              </p>

                              <p className="text-xs text-slate-500">
                                {flat.block
                                  ? `Block ${flat.block}`
                                  : "No block"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            {getSocietyName(flat.societyId)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-800">
                            {flat.flatType || "Type not specified"}
                          </p>

                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                            {flat.floorNumber !== undefined && (
                              <span className="inline-flex items-center gap-1">
                                <Layers3 className="h-3.5 w-3.5" />
                                Floor {flat.floorNumber}
                              </span>
                            )}

                            {flat.area !== undefined && (
                              <span className="inline-flex items-center gap-1">
                                <Ruler className="h-3.5 w-3.5" />
                                {flat.area} sq ft
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {getOccupancyBadge(flat.status)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {getVerificationBadge(
                              flat.verificationStatus,
                            )}

                            {getVerificationStatus(
                              flat.verificationStatus,
                            ) === "REJECTED" &&
                              flat.verificationNote && (
                                <p className="max-w-48 text-xs text-red-600">
                                  {flat.verificationNote}
                                </p>
                              )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(flat.createdAt)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title="View flat"
                              onClick={() => openViewDialog(flat)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {getVerificationStatus(
                              flat.verificationStatus,
                            ) !== "VERIFIED" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Edit flat"
                                onClick={() => openEditDialog(flat)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredFlats.map((flat) => (
                  <div
                    key={flat._id}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-50 p-2.5">
                          <Home className="h-5 w-5 text-blue-700" />
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {flat.flatNumber}
                          </h3>

                          <p className="text-sm text-slate-500">
                            {flat.block
                              ? `Block ${flat.block}`
                              : "No block"}
                          </p>
                        </div>
                      </div>

                      {getVerificationBadge(
                        flat.verificationStatus,
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {getSocietyName(flat.societyId)}
                      </p>

                      <p>
                        {flat.flatType || "Type not specified"}
                        {flat.floorNumber !== undefined
                          ? ` · Floor ${flat.floorNumber}`
                          : ""}
                        {flat.area !== undefined
                          ? ` · ${flat.area} sq ft`
                          : ""}
                      </p>

                      <div>{getOccupancyBadge(flat.status)}</div>

                      <p className="flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Registered: {formatDate(flat.createdAt)}
                      </p>

                      {getVerificationStatus(
                        flat.verificationStatus,
                      ) === "REJECTED" && (
                        <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">
                          <strong>Rejection reason:</strong>{" "}
                          {flat.verificationNote ||
                            "No rejection reason provided."}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2 border-t pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openViewDialog(flat)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>

                      {getVerificationStatus(
                        flat.verificationStatus,
                      ) !== "VERIFIED" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditDialog(flat)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                Showing {filteredFlats.length} of {flats.length} flats
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit / View dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (
            !open &&
            (isCreating || isUpdating)
          ) {
            return;
          }

          setDialogOpen(open);

          if (!open) {
            setSelectedFlat(null);
            setActionError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? "Register New Flat"
                : mode === "edit"
                  ? "Update Flat Details"
                  : "Flat Details"}
            </DialogTitle>

            <DialogDescription>
              {mode === "add"
                ? "Fill in your flat details and submit them for approval."
                : mode === "edit"
                  ? "Update your flat information."
                  : "View your registered flat information and approval status."}
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <CFlatForm
            key={`${mode}-${selectedFlat?._id || "new"}`}
            initialData={selectedFlat}
            mode={mode}
            loading={isCreating || isUpdating}
            onSubmit={handleSubmit}
            onClose={() => {
              setDialogOpen(false);
              setSelectedFlat(null);
              setActionError("");
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CFlat;