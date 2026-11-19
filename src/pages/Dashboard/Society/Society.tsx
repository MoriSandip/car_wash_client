
import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Download,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
  XCircle,
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
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

import {
  useGetSocietiesQuery,
  useCreateSocietyMutation,
  useUpdateSocietyMutation,
  useDeleteSocietyMutation,
  useVerifySocietyMutation,
  useRejectSocietyMutation,
  type TSociety,
  type TSocietyPayload,
} from "@/redux/features/society/societyApi";

import SocietyForm from "./SocietyForm";

type FormMode = "add" | "edit" | "view";

const getSocieties = (response: any): TSociety[] => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.result)) {
    return data.result;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(response?.result)) {
    return response.result;
  }

  return [];
};

const getErrorMessage = (
  error: any,
  fallback: string,
): string => {
  return (
    error?.data?.message ||
    error?.data?.errorSources?.[0]?.message ||
    error?.message ||
    fallback
  );
};

const getStatus = (
  society: TSociety,
): "PENDING" | "VERIFIED" | "REJECTED" => {
  return society.status || "PENDING";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "VERIFIED":
      return (
        <Badge className="border border-green-200 bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
          Verified
        </Badge>
      );

    case "REJECTED":
      return (
        <Badge className="border border-red-200 bg-red-100 text-red-700 hover:bg-red-100">
          <XCircle className="mr-1 h-3.5 w-3.5" />
          Rejected
        </Badge>
      );

    default:
      return (
        <Badge className="border border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100">
          Pending
        </Badge>
      );
  }
};

const Society = () => {
  const {
    data: societiesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetSocietiesQuery();

  const [createSociety, { isLoading: isCreating }] =
    useCreateSocietyMutation();

  const [updateSociety, { isLoading: isUpdating }] =
    useUpdateSocietyMutation();

  const [deleteSociety, { isLoading: isDeleting }] =
    useDeleteSocietyMutation();

  const [verifySociety, { isLoading: isVerifying }] =
    useVerifySocietyMutation();

  const [rejectSociety, { isLoading: isRejecting }] =
    useRejectSocietyMutation();

  const societies = useMemo(
    () => getSocieties(societiesResponse),
    [societiesResponse],
  );

  const [searchTerm, setSearchTerm] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [selectedSociety, setSelectedSociety] =
    useState<TSociety | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [societyToDelete, setSocietyToDelete] =
    useState<TSociety | null>(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [societyToReject, setSocietyToReject] =
    useState<TSociety | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const [actionError, setActionError] = useState("");

  const activeSocieties = useMemo(
    () => societies.filter((society) => !society.isDeleted),
    [societies],
  );

  const filteredSocieties = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return activeSocieties;
    }

    return activeSocieties.filter((society) => {
      return [
        society.name,
        society.address,
        society.city,
        society.state,
        society.contactPerson,
        society.phone,
        society.email,
        getStatus(society),
      ].some((value) =>
        String(value || "").toLowerCase().includes(search),
      );
    });
  }, [activeSocieties, searchTerm]);

  const verifiedCount = activeSocieties.filter(
    (society) => getStatus(society) === "VERIFIED",
  ).length;

  const pendingCount = activeSocieties.filter(
    (society) => getStatus(society) === "PENDING",
  ).length;

  const rejectedCount = activeSocieties.filter(
    (society) => getStatus(society) === "REJECTED",
  ).length;

  const citiesCount = new Set(
    activeSocieties
      .map((society) => society.city?.trim().toLowerCase())
      .filter(Boolean),
  ).size;

  const openAddDialog = () => {
    setSelectedSociety(null);
    setFormMode("add");
    setActionError("");
    setFormOpen(true);
  };

  const openEditDialog = (society: TSociety) => {
    setSelectedSociety(society);
    setFormMode("edit");
    setActionError("");
    setFormOpen(true);
  };

  const openViewDialog = (society: TSociety) => {
    setSelectedSociety(society);
    setFormMode("view");
    setActionError("");
    setFormOpen(true);
  };

  const handleFormSubmit = async (
    payload: TSocietyPayload,
  ) => {
    try {
      if (formMode === "edit" && selectedSociety?._id) {
        const response = await updateSociety({
          id: selectedSociety._id,
          data: payload,
        }).unwrap();

        toast.success(
          response?.message || "Society updated successfully.",
        );
      } else {
        const response = await createSociety(payload).unwrap();

        toast.success(
          response?.message || "Society created successfully.",
        );
      }

      setFormOpen(false);
      setSelectedSociety(null);
      setActionError("");
      await refetch();
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Unable to save society.",
      );

      setActionError(message);
      toast.error(message);
    }
  };

  const openDeleteDialog = (society: TSociety) => {
    setSocietyToDelete(society);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSociety = async () => {
    if (!societyToDelete?._id) {
      return;
    }

    try {
      const response = await deleteSociety(
        societyToDelete._id,
      ).unwrap();

      toast.success(
        response?.message || "Society deleted successfully.",
      );

      setDeleteDialogOpen(false);
      setSocietyToDelete(null);
      await refetch();
    } catch (error: any) {
      toast.error(
        getErrorMessage(error, "Unable to delete society."),
      );
    }
  };

  // Admin verifies a pending or rejected society.
  const handleVerifySociety = async (society: TSociety) => {
    if (!society._id) {
      toast.error("Society ID is missing.");
      return;
    }

    try {
      const response = await verifySociety(society._id).unwrap();

      toast.success(
        response?.message ||
          `${society.name} verified successfully.`,
      );

      await refetch();
    } catch (error: any) {
      toast.error(
        getErrorMessage(error, "Failed to verify society."),
      );
    }
  };

  const openRejectDialog = (society: TSociety) => {
    setSocietyToReject(society);
    setRejectionReason("");
    setRejectError("");
    setRejectDialogOpen(true);
  };

  // Admin rejects a society and provides a reason.
  const handleRejectSociety = async () => {
    if (!societyToReject?._id) {
      setRejectError("Society ID is missing.");
      return;
    }

    if (!rejectionReason.trim()) {
      setRejectError("Please enter a rejection reason.");
      return;
    }

    try {
      const response = await rejectSociety({
        id: societyToReject._id,
        verificationNote: rejectionReason.trim(),
      }).unwrap();

      toast.success(
        response?.message ||
          `${societyToReject.name} rejected successfully.`,
      );

      setRejectDialogOpen(false);
      setSocietyToReject(null);
      setRejectionReason("");
      setRejectError("");

      await refetch();
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Failed to reject society.",
      );

      setRejectError(message);
      toast.error(message);
    }
  };

  const handleExportCSV = () => {
    if (filteredSocieties.length === 0) {
      toast.error("No societies available to export.");
      return;
    }

    const headers = [
      "Name",
      "Address",
      "City",
      "State",
      "Pincode",
      "Contact Person",
      "Phone",
      "Email",
      "Status",
      "Verification Note",
    ];

    const escapeCSV = (value: unknown) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = filteredSocieties.map((society) => [
      society.name,
      society.address,
      society.city,
      society.state,
      society.pincode,
      society.contactPerson,
      society.phone,
      society.email,
      getStatus(society),
      society.verificationNote,
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "societies.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Society CSV exported successfully.");
  };

  const isSavingForm = isCreating || isUpdating;

  return (
   <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Society Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage, verify and review registered societies.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCSV}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button type="button" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Society
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">
                Total Societies
              </p>
              <p className="mt-2 text-2xl font-bold">
                {activeSocieties.length}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">Verified</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                {verifiedCount}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">Pending Review</p>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Eye className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">Rejected</p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                {rejectedCount}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <ShieldX className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Society table */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Registered Societies</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                {citiesCount} cities · {filteredSocieties.length}{" "}
                societies displayed
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <Input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search societies..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading societies...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Society</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[190px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredSocieties.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-slate-500"
                      >
                        {searchTerm
                          ? "No societies match your search."
                          : "No societies found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSocieties.map((society) => {
                      const status = getStatus(society);
                      const canReview =
                        status === "PENDING" ||
                        status === "REJECTED";

                      return (
                        <TableRow key={society._id}>
                          <TableCell>
                            <div className="font-medium text-slate-900">
                              {society.name}
                            </div>

                            <div className="mt-1 max-w-[240px] truncate text-xs text-slate-500">
                              {society.address}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                              <div>
                                <p>{society.city}</p>
                                {society.state && (
                                  <p className="text-xs text-slate-500">
                                    {society.state}
                                  </p>
                                )}
                                {society.pincode && (
                                  <p className="text-xs text-slate-500">
                                    {society.pincode}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">
                              {society.contactPerson || "—"}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {society.phone || society.email || "—"}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              {getStatusBadge(status)}

                              {status === "REJECTED" &&
                                society.verificationNote && (
                                  <p
                                    className="max-w-[220px] text-xs text-red-600"
                                    title={society.verificationNote}
                                  >
                                    Reason: {society.verificationNote}
                                  </p>
                                )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {/* View */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="View Society"
                                aria-label={`View ${society.name}`}
                                onClick={() =>
                                  openViewDialog(society)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {/* Edit */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Edit Society"
                                aria-label={`Edit ${society.name}`}
                                onClick={() =>
                                  openEditDialog(society)
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              {/* Verify and Reject */}
                              {canReview && (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title="Verify Society"
                                    aria-label={`Verify ${society.name}`}
                                    disabled={
                                      isVerifying || isRejecting
                                    }
                                    className="text-green-600 hover:bg-green-50 hover:text-green-700"
                                    onClick={() =>
                                      handleVerifySociety(society)
                                    }
                                  >
                                    <ShieldCheck className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title="Reject Society"
                                    aria-label={`Reject ${society.name}`}
                                    disabled={
                                      isVerifying || isRejecting
                                    }
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      openRejectDialog(society)
                                    }
                                  >
                                    <ShieldX className="h-4 w-4" />
                                  </Button>
                                </>
                              )}

                              {/* Delete */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Delete Society"
                                aria-label={`Delete ${society.name}`}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                  openDeleteDialog(society)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {isFetching && !isLoading && (
            <p className="mt-3 text-right text-xs text-slate-400">
              Refreshing societies...
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
            setSelectedSociety(null);
            setActionError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "add"
                ? "Add Society"
                : formMode === "edit"
                  ? "Edit Society"
                  : "Society Details"}
            </DialogTitle>

            <DialogDescription>
              {formMode === "view"
                ? "Review the society information and verification status."
                : "Enter the society details below."}
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {actionError}
            </div>
          )}

          <SocietyForm
            initialData={selectedSociety}
            mode={formMode}
            loading={isSavingForm}
            onSubmit={handleFormSubmit}
            onClose={() => {
              setFormOpen(false);
              setSelectedSociety(null);
              setActionError("");
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Reject Society dialog */}
      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);

          if (!open) {
            setSocietyToReject(null);
            setRejectionReason("");
            setRejectError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldX className="h-5 w-5 text-red-600" />
              Reject Society
            </DialogTitle>

            <DialogDescription>
              Enter the reason for rejecting{" "}
              <strong>{societyToReject?.name || "this society"}</strong>.
              The reason should be clear to the customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="rejectionReason"
              className="text-sm font-medium"
            >
              Rejection reason <span className="text-red-600">*</span>
            </label>

            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(event) => {
                setRejectionReason(event.target.value);
                setRejectError("");
              }}
              placeholder="Example: Please provide a valid society address."
              rows={4}
              maxLength={500}
            />

            <div className="flex justify-between text-xs text-slate-500">
              <span>Reason is required.</span>
              <span>{rejectionReason.length}/500</span>
            </div>

            {rejectError && (
              <p className="text-sm text-red-600">{rejectError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isRejecting}
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={
                isRejecting || !rejectionReason.trim()
              }
              onClick={handleRejectSociety}
            >
              {isRejecting ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);

          if (!open) {
            setSocietyToDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Society</DialogTitle>

            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{societyToDelete?.name}</strong>? This action
              cannot be undone from this screen.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteSociety}
            >
              {isDeleting ? "Deleting..." : "Delete Society"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Society;
