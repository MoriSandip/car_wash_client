import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  UserX,
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
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomersQuery,
  useUpdateCustomerMutation,
  type TCustomer,
  type TCustomerPayload,
} from "@/redux/features/customer/customerApi";
import CustomerForm from "./CustomerForm";

type TMode = "add" | "edit" | "view";

const getErrorMessage = (error: unknown) => {
  const response = error as {
    data?: { message?: string };
    message?: string;
  };
  return response.data?.message || response.message || "Something went wrong.";
};

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

const CustomerManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mode, setMode] = useState<TMode>("add");
  const [selectedCustomer, setSelectedCustomer] = useState<TCustomer | null>(
    null,
  );
  const [actionError, setActionError] = useState("");

  const {
    data: customers = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetCustomersQuery();
  const [createCustomer, { isLoading: isCreating }] =
    useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] =
    useUpdateCustomerMutation();
  const [deleteCustomer, { isLoading: isDeleting }] =
    useDeleteCustomerMutation();

  const filteredCustomers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch =
        !search ||
        [
          customer.name,
          customer.email,
          customer.phone,
          customer.address || "",
          customer.status,
        ].some((value) => String(value || "").toLowerCase().includes(search));
      const matchesStatus =
        statusFilter === "all" || customer.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const activeCount = customers.filter(
    (customer) => customer.status === "ACTIVE",
  ).length;
  const inactiveCount = customers.filter(
    (customer) => customer.status === "INACTIVE",
  ).length;

  const openForm = (nextMode: TMode, customer?: TCustomer) => {
    setMode(nextMode);
    setSelectedCustomer(customer ?? null);
    setActionError("");
    setFormOpen(true);
  };

  const handleFormSubmit = async (payload: TCustomerPayload) => {
    setActionError("");
    try {
      if (mode === "edit" && selectedCustomer) {
        await updateCustomer({
          id: selectedCustomer._id,
          data: payload,
        }).unwrap();
      } else {
        const password = payload.password;
        if (!password) {
          throw new Error("Password is required for a new customer.");
        }
        await createCustomer({ ...payload, password }).unwrap();
      }
      setFormOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      setActionError(getErrorMessage(error));
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    setActionError("");
    try {
      await deleteCustomer(selectedCustomer._id).unwrap();
      setDeleteOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Status", "Address", "Created At"];
    const rows = filteredCustomers.map((customer) => [
      customer.name,
      customer.email,
      customer.phone,
      customer.status,
      customer.address || "",
      formatDate(customer.createdAt),
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
    link.download = "customers.csv";
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
            Customer Management
          </h1>
          <p className="text-sm text-muted-foreground">
            View customer accounts and manage their details and access.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={filteredCustomers.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => openForm("add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{customers.length}</p>
            <UserRound className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
            <UserX className="h-5 w-5 text-red-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              Loading customers...
            </div>
          ) : isError ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-sm text-red-600">
                Failed to load customers. Please try again.
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
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No customers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer._id}>
                        <TableCell>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {customer.email}
                          </div>
                        </TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {customer.address || "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              customer.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {customer.status === "ACTIVE" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(customer.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View Customer"
                              onClick={() => openForm("view", customer)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Customer"
                              onClick={() => openForm("edit", customer)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Customer"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSelectedCustomer(customer);
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
              Refreshing customer data...
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelectedCustomer(null);
            setActionError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? "Add Customer"
                : mode === "edit"
                  ? "Edit Customer"
                  : "Customer Details"}
            </DialogTitle>
            <DialogDescription>
              {mode === "view"
                ? "View customer account details."
                : "Enter the customer details below."}
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            key={`${mode}-${selectedCustomer?._id || "new"}`}
            initialData={selectedCustomer}
            mode={mode}
            loading={isCreating || isUpdating}
            onSubmit={handleFormSubmit}
            onClose={() => {
              setFormOpen(false);
              setSelectedCustomer(null);
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

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setActionError("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedCustomer?.name || "this customer"}</strong>?
              This action cannot be undone.
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
              {isDeleting ? "Deleting..." : "Delete Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerManagement;
