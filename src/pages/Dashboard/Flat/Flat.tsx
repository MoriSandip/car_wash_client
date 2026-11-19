
import React, { useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock3,
  ShieldCheck,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import FlatForm from "./FlatForm";

import {
  useCreateFlatMutation,
  useDeleteFlatMutation,
  useGetFlatsQuery,
  useUpdateFlatMutation,
  useVerifyFlatMutation,
  useRejectFlatMutation,
  type TFlat,
  type TFlatPayload,
  type TFlatVerificationStatus,
} from "@/redux/features/flat/flatApi";

interface TSocietyOption {
  _id: string;
  name?: string;
  societyName?: string;
}

const getFlats = (response: unknown): TFlat[] => {
  if (!response || typeof response !== "object") return [];

  const result = response as {
    data?: TFlat[] | { result?: TFlat[]; data?: TFlat[] };
    result?: TFlat[];
  };

  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.result)) return result.result;

  if (result.data && typeof result.data === "object") {
    if (Array.isArray(result.data.result)) return result.data.result;
    if (Array.isArray(result.data.data)) return result.data.data;
  }

  return [];
};

const getSocietyId = (society: TFlat["societyId"]): string => {
  return typeof society === "string" ? society : society?._id || "";
};

const getSocietyName = (society: TFlat["societyId"]): string => {
  if (typeof society === "object" && society) {
    return society.name || "Society";
  }

  return "Society";
};

const getVerificationStatus = (
  flat: TFlat,
): TFlatVerificationStatus => flat.verificationStatus || "PENDING";

const verificationBadge = (status: TFlatVerificationStatus) => {
  switch (status) {
    case "VERIFIED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verified
        </span>
      );

    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
          <XCircle className="h-3.5 w-3.5" />
          Rejected
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
          <Clock3 className="h-3.5 w-3.5" />
          Pending
        </span>
      );
  }
};

const flatStatusBadge = (status: TFlat["status"]) => {
  const styles: Record<TFlat["status"], string> = {
    Available: "bg-green-100 text-green-700",
    Occupied: "bg-blue-100 text-blue-700",
    Maintenance: "bg-orange-100 text-orange-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
};

const Flat: React.FC = () => {
  const {
    data: flatResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetFlatsQuery();

  const [createFlat, { isLoading: isCreating }] = useCreateFlatMutation();
  const [updateFlat, { isLoading: isUpdating }] = useUpdateFlatMutation();
  const [deleteFlat, { isLoading: isDeleting }] = useDeleteFlatMutation();
  const [verifyFlat, { isLoading: isVerifying }] = useVerifyFlatMutation();
  const [rejectFlat, { isLoading: isRejecting }] = useRejectFlatMutation();

  const flats = useMemo(() => getFlats(flatResponse), [flatResponse]);

  const [searchTerm, setSearchTerm] = useState("");
  const [societyFilter, setSocietyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit" | "view">("add");
  const [selectedFlat, setSelectedFlat] = useState<TFlat | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flatToDelete, setFlatToDelete] = useState<TFlat | null>(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [flatToReject, setFlatToReject] = useState<TFlat | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const societies = useMemo<TSocietyOption[]>(() => {
    const map = new Map<string, TSocietyOption>();

    flats.forEach((flat) => {
      if (typeof flat.societyId === "object" && flat.societyId?._id) {
        map.set(flat.societyId._id, {
          _id: flat.societyId._id,
          name: flat.societyId.name,
        });
      } else if (typeof flat.societyId === "string" && flat.societyId) {
        map.set(flat.societyId, {
          _id: flat.societyId,
          name: "Society",
        });
      }
    });

    return Array.from(map.values());
  }, [flats]);

  const filteredFlats = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return flats.filter((flat) => {
      const matchesSearch =
        !query ||
        flat.flatNumber?.toLowerCase().includes(query) ||
        flat.block?.toLowerCase().includes(query) ||
        flat.flatType?.toLowerCase().includes(query) ||
        getSocietyName(flat.societyId).toLowerCase().includes(query);

      const matchesSociety =
        societyFilter === "all" ||
        getSocietyId(flat.societyId) === societyFilter;

      const matchesStatus =
        statusFilter === "all" || flat.status === statusFilter;

      const matchesVerification =
        verificationFilter === "all" ||
        getVerificationStatus(flat) === verificationFilter;

      return (
        matchesSearch &&
        matchesSociety &&
        matchesStatus &&
        matchesVerification
      );
    });
  }, [
    flats,
    searchTerm,
    societyFilter,
    statusFilter,
    verificationFilter,
  ]);

  const pendingCount = flats.filter(
    (flat) => getVerificationStatus(flat) === "PENDING",
  ).length;

  const verifiedCount = flats.filter(
    (flat) => getVerificationStatus(flat) === "VERIFIED",
  ).length;

  const rejectedCount = flats.filter(
    (flat) => getVerificationStatus(flat) === "REJECTED",
  ).length;

  const clearMessages = () => {
    setActionError("");
    setActionMessage("");
  };

  const openAddForm = () => {
    clearMessages();
    setSelectedFlat(null);
    setFormMode("add");
    setFormOpen(true);
  };

  const openEditForm = (flat: TFlat) => {
    clearMessages();
    setSelectedFlat(flat);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openViewForm = (flat: TFlat) => {
    clearMessages();
    setSelectedFlat(flat);
    setFormMode("view");
    setFormOpen(true);
  };

  const handleSaveFlat = async (payload: TFlatPayload) => {
    clearMessages();

    try {
      if (formMode === "edit" && selectedFlat) {
        await updateFlat({
          id: selectedFlat._id,
          data: payload,
        }).unwrap();

        setActionMessage("Flat updated successfully.");
      } else {
        await createFlat(payload).unwrap();
        setActionMessage("Flat created successfully.");
      }

      setFormOpen(false);
      setSelectedFlat(null);
    } catch (error: unknown) {
      const err = error as {
        data?: { message?: string };
        message?: string;
      };

      setActionError(
        err?.data?.message || err?.message || "Unable to save flat.",
      );
    }
  };

  const openDeleteDialog = (flat: TFlat) => {
    clearMessages();
    setFlatToDelete(flat);
    setDeleteDialogOpen(true);
  };

  const handleDeleteFlat = async () => {
    if (!flatToDelete) return;

    clearMessages();

    try {
      await deleteFlat(flatToDelete._id).unwrap();
      setActionMessage("Flat deleted successfully.");
      setDeleteDialogOpen(false);
      setFlatToDelete(null);
    } catch (error: unknown) {
      const err = error as {
        data?: { message?: string };
        message?: string;
      };

      setActionError(
        err?.data?.message || err?.message || "Unable to delete flat.",
      );
    }
  };

  const handleVerifyFlat = async (flat: TFlat) => {
    clearMessages();

    try {
      await verifyFlat(flat._id).unwrap();
      setActionMessage(`Flat ${flat.flatNumber} approved successfully.`);
    } catch (error: unknown) {
      const err = error as {
        data?: { message?: string };
        message?: string;
      };

      setActionError(
        err?.data?.message || err?.message || "Unable to approve flat.",
      );
    }
  };

  const openRejectDialog = (flat: TFlat) => {
    clearMessages();
    setFlatToReject(flat);
    setRejectionNote("");
    setRejectDialogOpen(true);
  };

  const handleRejectFlat = async () => {
    if (!flatToReject) return;

    if (!rejectionNote.trim()) {
      setActionError("Please enter a reason for rejecting this flat.");
      return;
    }

    clearMessages();

    try {
      await rejectFlat({
        id: flatToReject._id,
        data: { verificationNote: rejectionNote.trim() },
      }).unwrap();

      setActionMessage(`Flat ${flatToReject.flatNumber} rejected.`);
      setRejectDialogOpen(false);
      setFlatToReject(null);
      setRejectionNote("");
    } catch (error: unknown) {
      const err = error as {
        data?: { message?: string };
        message?: string;
      };

      setActionError(
        err?.data?.message || err?.message || "Unable to reject flat.",
      );
    }
  };

  const exportCSV = () => {
    const headers = [
      "Society",
      "Flat Number",
      "Block",
      "Floor",
      "Flat Type",
      "Area",
      "Flat Status",
      "Verification Status",
      "Verification Note",
    ];

    const rows = filteredFlats.map((flat) => [
      getSocietyName(flat.societyId),
      flat.flatNumber,
      flat.block || "",
      flat.floorNumber ?? "",
      flat.flatType || "",
      flat.area ?? "",
      flat.status,
      getVerificationStatus(flat),
      flat.verificationNote || "",
    ]);

    const escapeCSV = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "flats.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
   <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Building2 className="h-7 w-7" />
            Flat Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage flats and review customer submissions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button onClick={openAddForm}>
            <Plus className="mr-2 h-4 w-4" />
            Add Flat
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="font-semibold"
          >
            ×
          </button>
        </div>
      )}

      {actionMessage && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage("")}
            className="font-semibold"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flats</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flats.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock3 className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {pendingCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {verifiedCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flats List</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search flat, block, society..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <Select value={societyFilter} onValueChange={setSocietyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by society" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Societies</SelectItem>
                {societies.map((society) => (
                  <SelectItem key={society._id} value={society._id}>
                    {society.name || society.societyName || "Society"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter flat status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flat Statuses</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Occupied">Occupied</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={verificationFilter}
              onValueChange={setVerificationFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Society</TableHead>
                  <TableHead>Flat Number</TableHead>
                  <TableHead>Block / Wing</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Flat Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="min-w-[190px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-28 text-center text-muted-foreground"
                    >
                      Loading flats...
                    </TableCell>
                  </TableRow>
                ) : filteredFlats.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-28 text-center text-muted-foreground"
                    >
                      No flats found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFlats.map((flat) => {
                    const verification = getVerificationStatus(flat);

                    return (
                      <TableRow key={flat._id}>
                        <TableCell className="font-medium">
                          {getSocietyName(flat.societyId)}
                        </TableCell>

                        <TableCell className="font-semibold">
                          {flat.flatNumber}
                        </TableCell>

                        <TableCell>{flat.block || "—"}</TableCell>
                        <TableCell>{flat.floorNumber ?? "—"}</TableCell>
                        <TableCell>{flat.flatType || "—"}</TableCell>
                        <TableCell>
                          {flat.area ? `${flat.area} sq. ft.` : "—"}
                        </TableCell>

                        <TableCell>{flatStatusBadge(flat.status)}</TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {verificationBadge(verification)}
                            {verification === "REJECTED" &&
                              flat.verificationNote && (
                                <p
                                  className="max-w-[180px] truncate text-xs text-red-600"
                                  title={flat.verificationNote}
                                >
                                  Reason: {flat.verificationNote}
                                </p>
                              )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View flat"
                              onClick={() => openViewForm(flat)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit flat"
                              onClick={() => openEditForm(flat)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete flat"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => openDeleteDialog(flat)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            {verification === "PENDING" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Approve flat"
                                  className="text-green-600 hover:text-green-700"
                                  disabled={isVerifying}
                                  onClick={() => handleVerifyFlat(flat)}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Reject flat"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => openRejectDialog(flat)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filteredFlats.length} of {flats.length} flats.
          </p>
        </CardContent>
      </Card>

      <FlatForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedFlat(null);
        }}
        onSubmit={handleSaveFlat}
        initialData={selectedFlat}
        mode={formMode}
        loading={isCreating || isUpdating}
      />

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setFlatToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Flat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete flat{" "}
              <strong>{flatToDelete?.flatNumber}</strong>? This action cannot
              be undone from this screen.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteFlat}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Flat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) {
            setFlatToReject(null);
            setRejectionNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Flat</DialogTitle>
            <DialogDescription>
              Enter the reason for rejecting flat{" "}
              <strong>{flatToReject?.flatNumber}</strong>. The customer can see
              this reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rejection Reason *</label>
            <Textarea
              value={rejectionNote}
              onChange={(event) => setRejectionNote(event.target.value)}
              placeholder="Explain why this flat is being rejected..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleRejectFlat}
              disabled={isRejecting || !rejectionNote.trim()}
            >
              {isRejecting ? "Rejecting..." : "Reject Flat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Flat;
