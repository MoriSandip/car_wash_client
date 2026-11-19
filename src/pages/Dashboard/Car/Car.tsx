import React, { useMemo, useState } from "react";
import {
  useCreateCarMutation,
  useDeleteCarMutation,
  useGetCarsQuery,
  useUpdateCarMutation,
  useVerifyCarMutation,
  useRejectCarMutation,
  type TCar,
  type TCarPayload,
  type TCarVerificationStatus,
} from "@/redux/features/car/carApi";

import CarForm from "./CarForm";
import ListImage from "@/components/ListImage";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  CarFront,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

type TMode = "add" | "edit" | "view";

type TRelatedItem = {
  _id: string;
  name?: string;
  societyName?: string;
  flatNumber?: string;
  block?: string;
  floorNumber?: number;
};

type TCarWithVerification = TCar & {
  verificationStatus?: TCarVerificationStatus;
  verificationNote?: string;
  createdByRole?: string;
  verifiedAt?: string;
};

const getList = (response: unknown): TCarWithVerification[] => {
  if (!response || typeof response !== "object") return [];

  const value = response as any;
  const candidates = [
    value.data,
    value.data?.result,
    value.data?.data,
    value.data?.results,
    value.data?.docs,
    value.result,
    value.results,
    value.docs,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

const getId = (
  value: string | TRelatedItem | null | undefined,
): string => {
  if (typeof value === "string") return value;
  return value?._id || "";
};

const getSocietyName = (car: TCar): string => {
  const society = car.societyId;

  if (society && typeof society === "object") {
    return society.name || society.societyName || "—";
  }

  return "—";
};

const getFlatName = (car: TCar): string => {
  const flat = car.flatId;

  if (flat && typeof flat === "object") {
    const number = flat.flatNumber || "—";
    const block = flat.block ? ` (${flat.block})` : "";
    return `${number}${block}`;
  }

  return "—";
};

const getErrorMessage = (error: any): string =>
  error?.data?.message ||
  error?.data?.errorMessages?.[0]?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const getVerification = (
  car: TCarWithVerification,
): TCarVerificationStatus =>
  car.verificationStatus || "VERIFIED";

const verificationLabel = (status: TCarVerificationStatus) => {
  switch (status) {
    case "VERIFIED":
      return "Verified";
    case "REJECTED":
      return "Rejected";
    default:
      return "Pending";
  }
};

const verificationClass = (status: TCarVerificationStatus) => {
  switch (status) {
    case "VERIFIED":
      return "border border-green-200 bg-green-50 text-green-700";
    case "REJECTED":
      return "border border-red-200 bg-red-50 text-red-700";
    default:
      return "border border-amber-200 bg-amber-50 text-amber-700";
  }
};

const carStatusClass = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700";
    case "Inactive":
      return "bg-gray-100 text-gray-700";
    case "Maintenance":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const Car: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [societyFilter, setSocietyFilter] = useState("all");
  const [flatFilter, setFlatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const [mode, setMode] = useState<TMode>("add");
  const [selectedCar, setSelectedCar] =
    useState<TCarWithVerification | null>(null);
  const [carToReject, setCarToReject] =
    useState<TCarWithVerification | null>(null);

  const [rejectionNote, setRejectionNote] = useState("");
  const [actionError, setActionError] = useState("");

  const {
    data: carResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetCarsQuery();

  const [createCar, { isLoading: isCreating }] = useCreateCarMutation();
  const [updateCar, { isLoading: isUpdating }] = useUpdateCarMutation();
  const [deleteCar, { isLoading: isDeleting }] = useDeleteCarMutation();
  const [verifyCar, { isLoading: isVerifying }] = useVerifyCarMutation();
  const [rejectCar, { isLoading: isRejecting }] = useRejectCarMutation();

  const cars = useMemo(
    () => getList(carResponse),
    [carResponse],
  );

  const societyOptions = useMemo(() => {
    const unique = new Map<string, TRelatedItem>();

    cars.forEach((car) => {
      if (car.societyId && typeof car.societyId === "object") {
        const society = car.societyId as TRelatedItem;
        if (society._id) unique.set(society._id, society);
      }
    });

    return Array.from(unique.values());
  }, [cars]);

  const flatOptions = useMemo(() => {
    const unique = new Map<string, TRelatedItem>();

    cars.forEach((car) => {
      if (car.flatId && typeof car.flatId === "object") {
        const flat = car.flatId as TRelatedItem;
        if (flat._id) unique.set(flat._id, flat);
      }
    });

    return Array.from(unique.values());
  }, [cars]);

  const filteredCars = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return cars.filter((car) => {
      const verification = getVerification(car);

      const matchesSearch =
        !search ||
        (car.ownerName || "").toLowerCase().includes(search) ||
        (car.ownerPhone || "").toLowerCase().includes(search) ||
        (car.ownerEmail || "").toLowerCase().includes(search) ||
        (car.registrationNumber || "").toLowerCase().includes(search) ||
        (car.make || "").toLowerCase().includes(search) ||
        (car.model || "").toLowerCase().includes(search) ||
        getSocietyName(car).toLowerCase().includes(search) ||
        getFlatName(car).toLowerCase().includes(search);

      const matchesSociety =
        societyFilter === "all" ||
        getId(car.societyId) === societyFilter;

      const matchesFlat =
        flatFilter === "all" ||
        getId(car.flatId) === flatFilter;

      const matchesStatus =
        statusFilter === "all" || car.status === statusFilter;

      const matchesVerification =
        verificationFilter === "all" ||
        verification === verificationFilter;

      return (
        matchesSearch &&
        matchesSociety &&
        matchesFlat &&
        matchesStatus &&
        matchesVerification
      );
    });
  }, [
    cars,
    searchTerm,
    societyFilter,
    flatFilter,
    statusFilter,
    verificationFilter,
  ]);

  const openAddForm = () => {
    setSelectedCar(null);
    setMode("add");
    setActionError("");
    setFormOpen(true);
  };

  const openEditForm = (car: TCarWithVerification) => {
    setSelectedCar(car);
    setMode("edit");
    setActionError("");
    setFormOpen(true);
  };

  const openViewForm = (car: TCarWithVerification) => {
    setSelectedCar(car);
    setMode("view");
    setActionError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelectedCar(null);
    setActionError("");
  };

  const handleFormSubmit = async (payload: TCarPayload) => {
    try {
      setActionError("");

      if (mode === "edit" && selectedCar) {
        await updateCar({
          id: selectedCar._id,
          data: payload,
        }).unwrap();
      } else {
        await createCar(payload).unwrap();
      }

      closeForm();
    } catch (error) {
      const message = getErrorMessage(error);
      setActionError(message);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedCar) return;

    try {
      setActionError("");
      await deleteCar(selectedCar._id).unwrap();
      setDeleteOpen(false);
      setSelectedCar(null);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const handleVerifyCar = async (car: TCarWithVerification) => {
    try {
      setActionError("");
      await verifyCar(car._id).unwrap();
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const openRejectDialog = (car: TCarWithVerification) => {
    setCarToReject(car);
    setRejectionNote("");
    setActionError("");
    setRejectOpen(true);
  };

  const handleRejectCar = async () => {
    if (!carToReject) return;

    if (!rejectionNote.trim()) {
      setActionError("Please enter a reason for rejecting this car.");
      return;
    }

    try {
      setActionError("");

      await rejectCar({
        id: carToReject._id,
        data: { verificationNote: rejectionNote.trim() },
      }).unwrap();

      setRejectOpen(false);
      setCarToReject(null);
      setRejectionNote("");
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const exportCSV = () => {
    const headers = [
      "Society",
      "Flat",
      "Owner Name",
      "Owner Phone",
      "Owner Email",
      "Registration Number",
      "Make",
      "Model",
      "Color",
      "Car Type",
      "Parking Slot",
      "Car Status",
      "Verification Status",
      "Verification Note",
      "Description",
    ];

    const rows = filteredCars.map((car) => [
      getSocietyName(car),
      getFlatName(car),
      car.ownerName,
      car.ownerPhone,
      car.ownerEmail || "",
      car.registrationNumber,
      car.make,
      car.model,
      car.color,
      car.carType,
      car.parkingSlot || "",
      car.status,
      verificationLabel(getVerification(car)),
      car.verificationNote || "",
      car.description || "",
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
    link.download = "cars.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const pendingCount = cars.filter(
    (car) => getVerification(car) === "PENDING",
  ).length;

  const verifiedCount = cars.filter(
    (car) => getVerification(car) === "VERIFIED",
  ).length;

  const rejectedCount = cars.filter(
    (car) => getVerification(car) === "REJECTED",
  ).length;

  const activeCount = cars.filter(
    (car) => car.status === "Active",
  ).length;
 
  return (
   <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Car Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage cars and review customer-submitted car registrations.
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
            Add Car
          </Button>
        </div>
      </div>

      {actionError && !formOpen && !deleteOpen && !rejectOpen && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cars</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{cars.length}</p>
            <CarFront className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <Clock3 className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            <XCircle className="h-5 w-5 text-red-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Cars</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{activeCount}</p>
            <CarFront className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Cars</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search car, owner or registration..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <Select
              value={societyFilter}
              onValueChange={(value) => {
                setSocietyFilter(value);
                setFlatFilter("all");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Society" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Societies</SelectItem>
                {societyOptions.map((society) => (
                  <SelectItem key={society._id} value={society._id}>
                    {society.name || society.societyName || society._id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={flatFilter} onValueChange={setFlatFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Flat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flats</SelectItem>
                {flatOptions
                  .filter((flat) => {
                    if (societyFilter === "all") return true;

                    const relatedCar = cars.find(
                      (car) => getId(car.flatId) === flat._id,
                    );

                    return (
                      relatedCar &&
                      getId(relatedCar.societyId) === societyFilter
                    );
                  })
                  .map((flat) => (
                    <SelectItem key={flat._id} value={flat._id}>
                      {flat.flatNumber || flat._id}
                      {flat.block ? ` (${flat.block})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Car Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Car Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={verificationFilter}
              onValueChange={setVerificationFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading cars...
            </div>
          ) : isError ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-sm text-red-600">
                Failed to load cars. Please try again.
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
                    <TableHead>Image</TableHead>
                    <TableHead>Registration No.</TableHead>
                    <TableHead>Car</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Car Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredCars.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No cars found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCars.map((car) => {
                      const verification = getVerification(car);

                      return (
                        <TableRow key={car._id}>
                          <TableCell className="font-medium">
                            {getSocietyName(car)}
                          </TableCell>
                          <TableCell>{getFlatName(car)}</TableCell>
                          <TableCell>
                            <ListImage
                              source={car.imageUrl}
                              alt={`${car.registrationNumber || "Car"} image`}
                              className="h-12 w-16"
                            />
                          </TableCell>
                          <TableCell className="font-semibold">
                            {car.registrationNumber}
                          </TableCell>
                          <TableCell>
                            {car.make} {car.model}
                            <div className="text-xs text-muted-foreground">
                              {car.color} · {car.carType}
                            </div>
                          </TableCell>
                          <TableCell>{car.ownerName}</TableCell>
                          <TableCell>{car.ownerPhone}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${carStatusClass(car.status)}`}
                            >
                              {car.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${verificationClass(verification)}`}
                              >
                                {verificationLabel(verification)}
                              </span>
                              {verification === "REJECTED" &&
                                car.verificationNote && (
                                  <p className="max-w-48 text-xs text-red-600">
                                    {car.verificationNote}
                                  </p>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View Car"
                                onClick={() => openViewForm(car)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit Car"
                                onClick={() => openEditForm(car)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete Car"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedCar(car);
                                  setActionError("");
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>

                              {verification === "PENDING" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Approve Car"
                                    className="text-green-600 hover:text-green-700"
                                    disabled={isVerifying}
                                    onClick={() => handleVerifyCar(car)}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Reject Car"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => openRejectDialog(car)}
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
          )}

          <p className="text-sm text-muted-foreground">
            Showing {filteredCars.length} of {cars.length} cars.
          </p>

          {isFetching && !isLoading && (
            <p className="text-xs text-muted-foreground">
              Refreshing data...
            </p>
          )}
        </CardContent>
      </Card>

      <CarForm
        open={formOpen}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        initialData={selectedCar}
        mode={mode}
        loading={isCreating || isUpdating}
      />

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setActionError("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Car</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete car{" "}
              <strong>{selectedCar?.registrationNumber}</strong>? This action
              will soft-delete the record.
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
              {isDeleting ? "Deleting..." : "Delete Car"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) {
            setCarToReject(null);
            setRejectionNote("");
            setActionError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject Car Registration</DialogTitle>
            <DialogDescription>
              Enter the reason for rejecting{" "}
              <strong>{carToReject?.registrationNumber}</strong>. The customer
              can see this reason in their car details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Rejection Reason *
            </label>
            <Textarea
              value={rejectionNote}
              onChange={(event) => {
                setRejectionNote(event.target.value);
                setActionError("");
              }}
              placeholder="Explain why this car registration is being rejected..."
              rows={4}
            />
          </div>

          {actionError && (
            <p role="alert" className="text-sm text-red-600">
              {actionError}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectCar}
              disabled={isRejecting || !rejectionNote.trim()}
            >
              {isRejecting ? "Rejecting..." : "Reject Car"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Car;