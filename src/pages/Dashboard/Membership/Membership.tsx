import React, { useMemo, useState } from "react";

import {
  useCreateMembershipMutation,
  useDeleteMembershipMutation,
  useGetMembershipsQuery,
  useUpdateMembershipMutation,
  type TMembership,
  type TMembershipPayload,
} from "@/redux/features/membership/membershipApi";

import MembershipForm from "./MembershipForm";
import { useRecordOfflineMembershipPaymentMutation } from "@/redux/features/payment/transactionsApi";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

type TMode = "add" | "edit" | "view";

const getId = (value: any): string => {
  if (value == null) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const id = value._id ?? value.id ?? value.$oid;
    return id == null || id === value ? "" : getId(id);
  }

  return "";
};

const getMemberships = (response: any): TMembership[] => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.result)) return response.data.result;
  if (Array.isArray(response?.result)) return response.result;
  return [];
};

const getSocietyName = (membership: TMembership) => {
  const society = membership.societyId;

  return typeof society === "object" && society
    ? society.name || "—"
    : society || "—";
};

const getFlatName = (membership: TMembership) => {
  const flat = membership.flatId;

  if (!flat) return "—";
  if (typeof flat === "string") return flat;

  const number =
    flat.flatNumber ||
    flat.flatNo ||
    flat.flatName ||
    flat.name ||
    "";

  return `${number}${flat.block ? ` (${flat.block})` : ""}` || "—";
};

const getCarName = (membership: TMembership) => {
  const car = membership.carId;

  if (!car) return "—";
  if (typeof car === "string") return car;

  return [
    car.registrationNumber || "",
    [car.make, car.model].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" — ") || "—";
};

const getPlanName = (membership: TMembership) => {
  const plan = membership.planId;

  if (membership.planNameSnapshot) return membership.planNameSnapshot;
  if (!plan) return "—";
  if (typeof plan === "string") return plan;

  return plan.name || plan.planName || plan.title || "—";
};

const getOfferName = (membership: TMembership) => {
  const offer = membership.offerId;
  if (typeof offer === "string") return offer;
  return offer?.title || "—";
};

const getErrorMessage = (error: any): string =>
  error?.data?.message ||
  error?.message ||
  "Something went wrong.";

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusClass = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700";
    case "Pending":
      return "bg-amber-100 text-amber-700";
    case "Expired":
      return "bg-gray-100 text-gray-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const paymentClass = (status: string) => {
  switch (status) {
    case "Paid":
      return "bg-green-100 text-green-700";
    case "Pending":
      return "bg-amber-100 text-amber-700";
    case "Failed":
      return "bg-red-100 text-red-700";
    case "Refunded":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const Membership: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [societyFilter, setSocietyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mode, setMode] = useState<TMode>("add");
  const [selectedMembership, setSelectedMembership] =
    useState<TMembership | null>(null);
  const [actionError, setActionError] = useState("");
  const [offlinePaymentOpen, setOfflinePaymentOpen] = useState(false);
  const [offlinePaymentMethod, setOfflinePaymentMethod] =
    useState<"Cash" | "UPI">("Cash");
  const [offlinePaymentReference, setOfflinePaymentReference] = useState("");

  const {
    data: membershipResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMembershipsQuery({});

  const [createMembership, { isLoading: isCreating }] =
    useCreateMembershipMutation();

  const [updateMembership, { isLoading: isUpdating }] =
    useUpdateMembershipMutation();

  const [deleteMembership, { isLoading: isDeleting }] =
    useDeleteMembershipMutation();
  const [recordOfflinePayment, offlinePaymentState] =
    useRecordOfflineMembershipPaymentMutation();

  const submitOfflineMembershipPayment = async () => {
    if (!selectedMembership) return;
    try {
      await recordOfflinePayment({
        membershipId: selectedMembership._id,
        body: {
          method: offlinePaymentMethod,
          ...(offlinePaymentReference.trim()
            ? { reference: offlinePaymentReference.trim() }
            : {}),
        },
      }).unwrap();
      toast.success("Offline membership payment recorded.");
      setOfflinePaymentOpen(false);
      setOfflinePaymentReference("");
      refetch();
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(response.data?.message || "Unable to record membership payment.");
    }
  };

  const memberships = useMemo(
    () => getMemberships(membershipResponse),
    [membershipResponse]
  );

  const societyOptions = useMemo(() => {
    const unique = new Map<string, any>();

    memberships.forEach((membership) => {
      const society = membership.societyId;

      if (society && typeof society === "object") {
        const id = getId(society);

        if (id) unique.set(id, society);
      }
    });

    return Array.from(unique.values());
  }, [memberships]);

  const filteredMemberships = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return memberships.filter((membership) => {
      const searchableValues = [
        getSocietyName(membership),
        getFlatName(membership),
        getCarName(membership),
        getPlanName(membership),
        membership.status,
        membership.paymentStatus,
        String(membership.totalAmount ?? ""),
      ];

      const matchesSearch =
        !search ||
        searchableValues.some((value) =>
          String(value || "").toLowerCase().includes(search)
        );

      const matchesSociety =
        societyFilter === "all" ||
        getId(membership.societyId) === societyFilter;

      const matchesStatus =
        statusFilter === "all" ||
        membership.status === statusFilter;

      const matchesPayment =
        paymentFilter === "all" ||
        membership.paymentStatus === paymentFilter;

      return (
        matchesSearch &&
        matchesSociety &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [
    memberships,
    searchTerm,
    societyFilter,
    statusFilter,
    paymentFilter,
  ]);

  const openAddForm = () => {
    setSelectedMembership(null);
    setMode("add");
    setActionError("");
    setFormOpen(true);
  };

  const openEditForm = (membership: TMembership) => {
    setSelectedMembership(membership);
    setMode("edit");
    setActionError("");
    setFormOpen(true);
  };

  const openViewForm = (membership: TMembership) => {
    setSelectedMembership(membership);
    setMode("view");
    setActionError("");
    setFormOpen(true);
  };

  const handleFormSubmit = async (payload: TMembershipPayload) => {
    setActionError("");
    
    try {
      if (mode === "edit" && selectedMembership) {
        await updateMembership({
          id: selectedMembership._id,
          data: payload,
        }).unwrap();
      } else {
        await createMembership(payload).unwrap();
      }

      setFormOpen(false);
      setSelectedMembership(null);
    } catch (error: any) {
      const message = getErrorMessage(error);
      setActionError(message);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedMembership) return;

    setActionError("");

    try {
      await deleteMembership(selectedMembership._id).unwrap();

      setDeleteOpen(false);
      setSelectedMembership(null);
    } catch (error: any) {
      setActionError(getErrorMessage(error));
    }
  };

  const exportCSV = () => {
    const headers = [
      "Society",
      "Flat",
      "Car",
      "Plan",
      "Offer",
      "Start Date",
      "End Date",
      "Amount",
      "Payment Status",
      "Membership Status",
      "Remarks",
    ];

    const rows = filteredMemberships.map((membership) => [
      getSocietyName(membership),
      getFlatName(membership),
      getCarName(membership),
      getPlanName(membership),
      getOfferName(membership),
      formatDate(membership.startDate),
      formatDate(membership.endDate),
      membership.totalAmount ?? "",
      membership.paymentStatus,
      membership.status,
      membership.remarks || "",
    ]);

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "memberships.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const activeCount = memberships.filter(
    (item) => item.status === "Active"
  ).length;

  const pendingCount = memberships.filter(
    (item) => item.status === "Pending"
  ).length;

  const expiredCount = memberships.filter(
    (item) => item.status === "Expired"
  ).length;

  const paidCount = memberships.filter(
    (item) => item.paymentStatus === "Paid"
  ).length;

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Membership Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage car wash memberships, plans, validity and payments.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button onClick={openAddForm}>
            <Plus className="mr-2 h-4 w-4" />
            Add Membership
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Memberships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{memberships.length}</p>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {activeCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {pendingCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{expiredCount}</p>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Payments Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-green-600">
                {paidCount}
              </p>
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Memberships</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search car, flat, plan..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <Select
              value={societyFilter}
              onValueChange={setSocietyFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Society" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Societies</SelectItem>
                {societyOptions.map((society) => {
                  const id = getId(society);
                  if (!id) return null;

                  return (
                    <SelectItem key={id} value={id}>
                      {society.name || id}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Membership Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Membership Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading Memberships...
            </div>
          ) : isError ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-sm text-red-600">
                Failed to load Memberships. Please try again.
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Society</TableHead>
                    <TableHead>Flat</TableHead>
                    <TableHead>Car</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Wash progress / renewal</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredMemberships.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No Memberships found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMemberships.map((membership) => (
                      <TableRow key={membership._id}>
                        <TableCell className="font-medium">
                          {getSocietyName(membership)}
                        </TableCell>

                        <TableCell>{getFlatName(membership)}</TableCell>

                        <TableCell>{getCarName(membership)}</TableCell>

                        <TableCell>{getPlanName(membership)}</TableCell>
                        <TableCell>{getOfferName(membership)}</TableCell>

                        <TableCell className="whitespace-nowrap">
                          <div>{formatDate(membership.startDate)}</div>
                          <div className="text-xs text-muted-foreground">
                            to {formatDate(membership.endDate)}
                          </div>
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-sm">
                          <div>
                            {membership.completedWashes ??
                              membership.usedWashes ??
                              0}
                            /{membership.includedWashes ?? 0} completed ·{" "}
                            {membership.reservedWashes ?? 0} scheduled
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {membership.status === "Active"
                              ? `${membership.daysRemaining ?? 0} days left · renew by `
                              : "Renewal date: "}
                            {formatDate(
                              membership.renewalDueDate ||
                                membership.endDate,
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="font-semibold">
                          ₹
                          {Number(membership.totalAmount || 0).toLocaleString(
                            "en-IN"
                          )}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${paymentClass(
                              membership.paymentStatus
                            )}`}
                          >
                            {membership.paymentStatus}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                              membership.status
                            )}`}
                          >
                            {membership.status}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {membership.paymentStatus !== "Paid" &&
                              membership.status === "Pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={offlinePaymentState.isLoading}
                                  onClick={() => {
                                    setSelectedMembership(membership);
                                    setOfflinePaymentMethod("Cash");
                                    setOfflinePaymentReference("");
                                    setOfflinePaymentOpen(true);
                                  }}
                                >
                                  Record Cash / UPI
                                </Button>
                              )}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View Membership"
                              onClick={() => openViewForm(membership)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Membership"
                              onClick={() => openEditForm(membership)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Membership"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSelectedMembership(membership);
                                setActionError("");
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {isFetching && !isLoading && (
            <p className="text-xs text-muted-foreground">
              Refreshing data...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit / View dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);

          if (!open) {
            setSelectedMembership(null);
            setActionError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? "Add Membership"
                : mode === "edit"
                  ? "Edit Membership"
                  : "View Membership"}
            </DialogTitle>
            <DialogDescription>
              {mode === "view"
                ? "Membership, car, plan and payment information."
                : "Select the society, flat, car and plan details."}
            </DialogDescription>
          </DialogHeader>

          <MembershipForm
            key={`${mode}-${selectedMembership?._id || "new"}`}
            initialData={selectedMembership}
            mode={mode}
            loading={isCreating || isUpdating}
            onSubmit={handleFormSubmit}
            onClose={() => {
              setFormOpen(false);
              setSelectedMembership(null);
              setActionError("");
            }}
          />

          {mode === "view" && selectedMembership && (
            <section className="space-y-4 rounded-lg border p-4">
              <div>
                <h3 className="font-semibold">Membership progress</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedMembership.planNameSnapshot ||
                    getPlanName(selectedMembership)}{" "}
                  · Services:{" "}
                  {selectedMembership.planServicesSnapshot?.join(", ") ||
                    "Plan services"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedMembership.status === "Active"
                    ? `${selectedMembership.daysRemaining ?? 0} validity days remaining`
                    : selectedMembership.status === "Expired"
                      ? "Membership expired"
                      : selectedMembership.status === "Cancelled"
                        ? "Membership cancelled"
                        : `Plan validity: ${selectedMembership.planValidityDays ?? 0} days`}{" "}
                  · Renew by{" "}
                  {formatDate(
                    selectedMembership.renewalDueDate ||
                      selectedMembership.endDate,
                  )}
                  {selectedMembership.renewalDueSoon
                    ? " · Renewal due soon"
                    : ""}
                </p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Wash allowance</p>
                  <p className="font-medium">
                    {selectedMembership.includedWashes ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p className="font-medium">
                    {selectedMembership.completedWashes ??
                      selectedMembership.usedWashes ??
                      0}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Scheduled</p>
                  <p className="font-medium">
                    {selectedMembership.reservedWashes ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Available to book</p>
                  <p className="font-medium">
                    {selectedMembership.remainingWashes ??
                      Math.max(
                        0,
                        (selectedMembership.includedWashes ?? 0) -
                          (selectedMembership.usedWashes ?? 0) -
                          (selectedMembership.reservedWashes ?? 0),
                      )}
                  </p>
                </div>
              </div>
              <div className="space-y-2 border-t pt-3">
                <h4 className="text-sm font-semibold">Daily wash history</h4>
                {selectedMembership.washHistory?.length ? (
                  selectedMembership.washHistory.map((wash) => (
                    <div
                      key={wash._id}
                      className="flex flex-col justify-between gap-1 rounded-md bg-muted/40 p-2 text-sm sm:flex-row"
                    >
                      <span>
                        {formatDate(wash.bookingDate)} at {wash.bookingTime} ·{" "}
                        {wash.serviceNameSnapshot}
                      </span>
                      <span className="text-muted-foreground">
                        {wash.status} / {wash.workStatus || "Not started"}
                        {wash.workCompletedAt
                          ? ` · Completed ${new Date(
                              wash.workCompletedAt,
                            ).toLocaleString("en-IN")}`
                          : ""}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No daily washes scheduled yet.
                  </p>
                )}
              </div>
            </section>
          )}

          {actionError && (
            <p role="alert" className="text-sm text-red-600">
              {actionError}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setActionError("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Membership</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this membership for{" "}
              <strong>
                {selectedMembership
                  ? getCarName(selectedMembership)
                  : ""}
              </strong>
              ? This action will soft-delete the record if your backend
              implements soft deletion.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <p role="alert" className="text-sm text-red-600">
              {actionError}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={offlinePaymentOpen}
        onOpenChange={setOfflinePaymentOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record offline membership payment</DialogTitle>
            <DialogDescription>
              Confirm Cash or UPI received. This activates the membership.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={offlinePaymentMethod}
              onValueChange={(value: "Cash" | "UPI") =>
                setOfflinePaymentMethod(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={offlinePaymentReference}
              onChange={(event) =>
                setOfflinePaymentReference(event.target.value)
              }
              placeholder="Reference (optional)"
              maxLength={120}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOfflinePaymentOpen(false)}
              disabled={offlinePaymentState.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={submitOfflineMembershipPayment}
              disabled={offlinePaymentState.isLoading}
            >
              Confirm payment received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Membership;