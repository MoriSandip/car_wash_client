import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  CalendarDays,
  Droplets,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  useCreateWashServiceMutation,
  useDeleteWashServiceMutation,
  useGetWashServicesQuery,
  useUpdateWashServiceMutation,
} from "@/redux/features/washService/washServiceApi";
import { useCreateWashServiceSlotsMutation } from "@/redux/features/slots/slots";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TStatus = "Active" | "Inactive";
type TMode = "add" | "edit" | "view";

type TWashService = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  status: TStatus;
};

type TForm = {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
  status: TStatus;
};

type TApiResponse = {
  data?: unknown;
  result?: unknown;
  results?: unknown;
  docs?: unknown;
  items?: unknown;
};

const initialForm: TForm = {
  name: "",
  description: "",
  price: "0",
  durationMinutes: "30",
  status: "Active",
};

const getServices = (response: unknown): TWashService[] => {
  const value = response as TApiResponse | undefined;

  const candidates = [
    value?.data,
    (value?.data as TApiResponse | undefined)?.data,
    (value?.data as TApiResponse | undefined)?.result,
    (value?.data as TApiResponse | undefined)?.results,
    (value?.data as TApiResponse | undefined)?.docs,
    (value?.data as TApiResponse | undefined)?.items,
    value?.result,
    value?.results,
    value?.docs,
    value?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as TWashService[];
    }
  }

  return [];
};

const getErrorMessage = (error: unknown): string => {
  const value = error as {
    data?: { message?: string };
    message?: string;
  };

  return (
    value?.data?.message ||
    value?.message ||
    "Something went wrong. Please try again."
  );
};

const WashServicePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);
  const [slotService, setSlotService] = useState<TWashService | null>(null);
  const [slotDate, setSlotDate] = useState("");
  const [slotStartTime, setSlotStartTime] = useState("09:00");
  const [slotEndTime, setSlotEndTime] = useState("19:00");
  const [slotError, setSlotError] = useState("");
  const [mode, setMode] = useState<TMode>("add");

  const [selectedService, setSelectedService] =
    useState<TWashService | null>(null);

  const [form, setForm] = useState<TForm>({ ...initialForm });
  const [actionError, setActionError] = useState("");

  const {
    data: serviceResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetWashServicesQuery({
    searchTerm,
    page: 1,
    limit: 100,
  });

  const [createService, { isLoading: isCreating }] =
    useCreateWashServiceMutation();

  const [updateService, { isLoading: isUpdating }] =
    useUpdateWashServiceMutation();

  const [deleteService, { isLoading: isDeleting }] =
    useDeleteWashServiceMutation();
  const [createSlots, { isLoading: slotsCreating }] =
    useCreateWashServiceSlotsMutation();

  const services = useMemo(
    () => getServices(serviceResponse),
    [serviceResponse]
  );

  const filteredServices = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        !search ||
        (service.name || "").toLowerCase().includes(search) ||
        (service.description || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" || service.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [services, searchTerm, statusFilter]);

  const activeCount = services.filter(
    (service) => service.status === "Active"
  ).length;

  const inactiveCount = services.filter(
    (service) => service.status === "Inactive"
  ).length;

  const totalValue = services.reduce(
    (sum, service) => sum + Number(service.price || 0),
    0
  );

  const openAddForm = () => {
    setSelectedService(null);
    setForm({ ...initialForm });
    setMode("add");
    setActionError("");
    setFormOpen(true);
  };

  const openEditForm = (service: TWashService) => {
    setSelectedService(service);
    setForm({
      name: service.name || "",
      description: service.description || "",
      price: String(service.price ?? 0),
      durationMinutes: String(service.durationMinutes ?? 30),
      status: service.status,
    });
    setMode("edit");
    setActionError("");
    setFormOpen(true);
  };

  const openViewForm = (service: TWashService) => {
    setSelectedService(service);
    setForm({
      name: service.name || "",
      description: service.description || "",
      price: String(service.price ?? 0),
      durationMinutes: String(service.durationMinutes ?? 30),
      status: service.status,
    });
    setMode("view");
    setActionError("");
    setFormOpen(true);
  };

  const handleFormSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setActionError("");

    const price = Number(form.price);
    const durationMinutes = Number(form.durationMinutes);

    if (!form.name.trim()) {
      setActionError("Service name is required.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setActionError("Enter a valid service price.");
      return;
    }

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1
    ) {
      setActionError("Duration must be at least one minute.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      durationMinutes,
      status: form.status,
    };

    try {
      if (mode === "edit" && selectedService) {
        await updateService({
          id: selectedService._id,
          body: payload,
        }).unwrap();

        toast.success("Wash service updated successfully.");
      } else {
        await createService(payload).unwrap();

        toast.success("Wash service created successfully.");
      }

      setFormOpen(false);
      setSelectedService(null);
      setForm({ ...initialForm });
      setActionError("");
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;

    setActionError("");

    try {
      await deleteService(selectedService._id).unwrap();

      toast.success("Wash service deleted successfully.");
      setDeleteOpen(false);
      setFormOpen(false);
      setSelectedService(null);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const openSlotForm = (service: TWashService) => {
    setSlotService(service);
    setSlotDate("");
    setSlotStartTime("09:00");
    setSlotEndTime("19:00");
    setSlotError("");
    setSlotOpen(true);
  };

  const handleSlotSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!slotService) return;
    setSlotError("");

    try {
      const result = await createSlots({
        washServiceId: slotService._id,
        date: slotDate,
        startTime: slotStartTime,
        endTime: slotEndTime,
      }).unwrap();
      toast.success(
        `${result.data.length} time slot${result.data.length === 1 ? "" : "s"} created.`,
      );
      setSlotOpen(false);
      setSlotService(null);
    } catch (error) {
      setSlotError(getErrorMessage(error));
    }
  };

  const exportCSV = () => {
    const headers = [
      "Service Name",
      "Description",
      "Price",
      "Duration Minutes",
      "Status",
    ];

    const rows = filteredServices.map((service) => [
      service.name,
      service.description || "",
      service.price,
      service.durationMinutes,
      service.status,
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
    link.download = "wash-services.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const statusClass = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Inactive":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Wash Service Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage wash service types, prices, and estimated durations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button onClick={openAddForm}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{services.length}</p>
              <Droplets className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {activeCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">
              {inactiveCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Combined Service Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{totalValue.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              Sum of catalog prices, not revenue.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Listing */}
      <Card>
        <CardHeader>
          <CardTitle>All Wash Services</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search service name or description..."
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading wash services...
            </div>
          ) : isError ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-sm text-red-600">
                Failed to load wash services.
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
                    <TableHead>Service</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredServices.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No wash services found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredServices.map((service) => (
                      <TableRow key={service._id}>
                        <TableCell>
                          <div className="font-medium">
                            {service.name}
                          </div>
                          <div className="max-w-md truncate text-xs text-muted-foreground">
                            {service.description || "—"}
                          </div>
                        </TableCell>

                        <TableCell className="font-medium">
                          ₹{Number(service.price).toFixed(2)}
                        </TableCell>

                        <TableCell>
                          {service.durationMinutes} min
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                              service.status
                            )}`}
                          >
                            {service.status}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Create day slots"
                              aria-label={`Create time slots for ${service.name}`}
                              disabled={service.status !== "Active"}
                              onClick={() => openSlotForm(service)}
                            >
                              <CalendarDays className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              title="View Service"
                              onClick={() => openViewForm(service)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Service"
                              onClick={() => openEditForm(service)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Service"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSelectedService(service);
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
            setSelectedService(null);
            setActionError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? "Add Wash Service"
                : mode === "edit"
                  ? "Edit Wash Service"
                  : "View Wash Service"}
            </DialogTitle>
            <DialogDescription>
              {mode === "view"
                ? "Wash service details."
                : "Enter the service information below."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="serviceName">Service Name *</Label>
                <Input
                  id="serviceName"
                  value={form.name}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Exterior Wash"
                  maxLength={120}
                  required
                  disabled={mode === "view"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="servicePrice">Price (₹) *</Label>
                <Input
                  id="servicePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      price: event.target.value,
                    }))
                  }
                  required
                  disabled={mode === "view"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceDuration">
                  Duration (minutes) *
                </Label>
                <Input
                  id="serviceDuration"
                  type="number"
                  min="1"
                  step="1"
                  value={form.durationMinutes}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      durationMinutes: event.target.value,
                    }))
                  }
                  required
                  disabled={mode === "view"}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="serviceStatus">Status *</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: TStatus) =>
                    setForm((previous) => ({
                      ...previous,
                      status: value,
                    }))
                  }
                  disabled={mode === "view"}
                >
                  <SelectTrigger id="serviceStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="serviceDescription">Description</Label>
                <Textarea
                  id="serviceDescription"
                  value={form.description}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Enter service details..."
                  maxLength={1000}
                  rows={4}
                  disabled={mode === "view"}
                />
              </div>
            </div>

            {actionError && (
              <p role="alert" className="text-sm text-red-600">
                {actionError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormOpen(false);
                  setSelectedService(null);
                  setActionError("");
                }}
              >
                {mode === "view" ? "Close" : "Cancel"}
              </Button>

              {mode !== "view" && (
                <Button
                  type="submit"
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating
                    ? "Saving..."
                    : mode === "edit"
                      ? "Update Service"
                      : "Create Service"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={slotOpen}
        onOpenChange={(open) => {
          setSlotOpen(open);
          if (!open) {
            setSlotService(null);
            setSlotError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create daily time slots</DialogTitle>
            <DialogDescription>
              {slotService
                ? `${slotService.name} — each slot is ${slotService.durationMinutes} minutes.`
                : "Choose a date and service hours."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSlotSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slot-date">Date *</Label>
              <Input
                id="slot-date"
                type="date"
                min={new Date().toLocaleDateString("en-CA")}
                value={slotDate}
                onChange={(event) => setSlotDate(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slot-start">Start time *</Label>
                <Input
                  id="slot-start"
                  type="time"
                  value={slotStartTime}
                  onChange={(event) => setSlotStartTime(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-end">End time *</Label>
                <Input
                  id="slot-end"
                  type="time"
                  value={slotEndTime}
                  onChange={(event) => setSlotEndTime(event.target.value)}
                  required
                />
              </div>
            </div>
            {slotError && (
              <p role="alert" className="text-sm text-red-600">
                {slotError}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSlotOpen(false)}
                disabled={slotsCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={slotsCreating}>
                {slotsCreating ? "Creating..." : "Create time slots"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);

          if (!open) {
            setActionError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Wash Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedService?.name}</strong>? Existing bookings
              may reference this service.
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
              {isDeleting ? "Deleting..." : "Delete Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WashServicePage;
