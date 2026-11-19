
import React, { useMemo, useState } from "react";

import {
  useCreateWorkerMutation,
  useDeleteWorkerMutation,
  useGetWorkersQuery,
  useUpdateWorkerMutation,
  type TWorker,
  type TWorkerPayload,
  type TWorkerStatus,
} from "@/redux/features/worker/workerApi";

import WorkerForm from "./WorkerForm";

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
  CheckCircle2,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  UserX,
} from "lucide-react";

type TMode = "add" | "edit" | "view";

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

const statusClass = (status: TWorkerStatus) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "INACTIVE":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const Worker: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mode, setMode] = useState<TMode>("add");

  const [selectedWorker, setSelectedWorker] =
    useState<TWorker | null>(null);

  const [actionError, setActionError] = useState("");

  const {
    data: workerResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetWorkersQuery({});

  const [createWorker, { isLoading: isCreating }] =
    useCreateWorkerMutation();

  const [updateWorker, { isLoading: isUpdating }] =
    useUpdateWorkerMutation();

  const [deleteWorker, { isLoading: isDeleting }] =
    useDeleteWorkerMutation();

  const workers = useMemo(
    () => workerResponse?.data ?? [],
    [workerResponse],
  );

  const filteredWorkers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return workers.filter((worker) => {
      const matchesSearch =
        !search ||
        [
          worker.name,
          worker.email,
          worker.phone,
          worker.address || "",
          worker.status,
        ].some((value) =>
          String(value || "").toLowerCase().includes(search),
        );

      const matchesStatus =
        statusFilter === "all" || worker.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [workers, searchTerm, statusFilter]);

  const activeCount = workers.filter(
    (worker) => worker.status === "ACTIVE",
  ).length;

  const inactiveCount = workers.filter(
    (worker) => worker.status === "INACTIVE",
  ).length;

  const openAddForm = () => {
    setSelectedWorker(null);
    setMode("add");
    setActionError("");
    setFormOpen(true);
  };

  const openEditForm = (worker: TWorker) => {
    setSelectedWorker(worker);
    setMode("edit");
    setActionError("");
    setFormOpen(true);
  };

  const openViewForm = (worker: TWorker) => {
    setSelectedWorker(worker);
    setMode("view");
    setActionError("");
    setFormOpen(true);
  };

  const handleFormSubmit = async (payload: TWorkerPayload) => {
    setActionError("");

    try {
      if (mode === "edit" && selectedWorker) {
        await updateWorker({
          id: selectedWorker._id,
          data: payload,
        }).unwrap();
      } else {
        if (!payload.password) {
          throw new Error("Password is required for a new worker.");
        }

        await createWorker(payload).unwrap();
      }

      setFormOpen(false);
      setSelectedWorker(null);
    } catch (error: any) {
      const message = getErrorMessage(error);
      setActionError(message);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedWorker) return;

    setActionError("");

    try {
      await deleteWorker(selectedWorker._id).unwrap();

      setDeleteOpen(false);
      setSelectedWorker(null);
    } catch (error: any) {
      setActionError(getErrorMessage(error));
    }
  };

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Status",
      "Address",
      "Created At",
    ];

    const rows = filteredWorkers.map((worker) => [
      worker.name,
      worker.email,
      worker.phone,
      worker.status,
      worker.address || "",
      formatDate(worker.createdAt),
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
    link.download = "workers.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Worker Management
          </h1>

          <p className="text-sm text-muted-foreground">
            Register workers and manage their account details and access.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={filteredWorkers.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button onClick={openAddForm}>
            <Plus className="mr-2 h-4 w-4" />
            Register Worker
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{workers.length}</p>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-green-600">
                {activeCount}
              </p>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-red-600">
                {inactiveCount}
              </p>
              <UserX className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workers table */}
      <Card>
        <CardHeader>
          <CardTitle>All Workers</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Input
                className="pl-9"
                placeholder="Search name, email, phone..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading workers...
            </div>
          ) : isError ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-sm text-red-600">
                Failed to load workers. Please try again.
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
                    <TableHead>Worker</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredWorkers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No workers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWorkers.map((worker) => (
                      <TableRow key={worker._id}>
                        <TableCell>
                          <div className="font-medium">
                            {worker.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {worker.email}
                          </div>
                        </TableCell>

                        <TableCell>{worker.phone}</TableCell>

                        <TableCell className="max-w-[220px] truncate">
                          {worker.address || "—"}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                              worker.status,
                            )}`}
                          >
                            {worker.status === "ACTIVE"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </TableCell>

                        <TableCell>
                          {formatDate(worker.createdAt)}
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View Worker"
                              onClick={() => openViewForm(worker)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Worker"
                              onClick={() => openEditForm(worker)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Worker"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSelectedWorker(worker);
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
              Refreshing worker data...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit / View */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);

          if (!open) {
            setSelectedWorker(null);
            setActionError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? "Register Worker"
                : mode === "edit"
                  ? "Edit Worker"
                  : "Worker Details"}
            </DialogTitle>

            <DialogDescription>
              {mode === "view"
                ? "View worker account details."
                : "Enter the worker details below."}
            </DialogDescription>
          </DialogHeader>

          <WorkerForm
            key={`${mode}-${selectedWorker?._id || "new"}`}
            initialData={selectedWorker}
            mode={mode}
            loading={isCreating || isUpdating}
            onSubmit={handleFormSubmit}
            onClose={() => {
              setFormOpen(false);
              setSelectedWorker(null);
              setActionError("");
            }}
          />

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
            <DialogTitle>Delete Worker</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedWorker?.name || "this worker"}</strong>?
              This cannot be undone if your backend permanently deletes
              the record.
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
              {isDeleting ? "Deleting..." : "Delete Worker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Worker;
