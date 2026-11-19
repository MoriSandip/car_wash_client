
import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  CarFront,
  RefreshCw,
  Pencil,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import CCarForm from "./CCarForm";
import ListImage from "@/components/ListImage";

import {
  useGetMyCarsQuery,
  useCreateCarMutation,
  useUpdateCarMutation,
  type TCar,
  type TCarPayload,
} from "@/redux/features/car/carApi";

type TFormMode = "add" | "edit" | "view";

type TRelatedEntity =
  | string
  | {
      _id?: string;
      id?: string;
      name?: string;
      societyName?: string;
      flatNumber?: string;
    };

type TCarItem = TCar & {
  _id?: string;
  id?: string;
  registrationNumber?: string;
  make?: string;
  model?: string;
  color?: string;
  parkingSlot?: string;
  verificationStatus?: string;
  societyId?: TRelatedEntity;
  flatId?: TRelatedEntity;
};

type TCarsApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    result?: TCarItem[];
    total?: number;
  } | TCarItem[];
  result?: TCarItem[];
  total?: number;
};

const getId = (value: unknown): string => {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (typeof value === "object") {
    const item = value as { _id?: string; id?: string };
    return item._id || item.id || "";
  }

  return "";
};

const getName = (value: unknown): string => {
  if (!value) return "-";

  if (typeof value === "string") return value;

  if (typeof value === "object") {
    const item = value as {
      name?: string;
      societyName?: string;
      flatNumber?: string;
      registrationNumber?: string;
    };

    return (
      item.name ||
      item.societyName ||
      item.flatNumber ||
      item.registrationNumber ||
      "-"
    );
  }

  return "-";
};

const getVerificationStatus = (car: TCarItem): string =>
  (car.verificationStatus || "PENDING").toUpperCase();

const getStatusClasses = (status: string) => {
  switch (status.toUpperCase()) {
    case "VERIFIED":
    case "APPROVED":
      return "bg-green-100 text-green-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    case "PENDING":
    default:
      return "bg-amber-100 text-amber-700";
  }
};

/**
 * Supports:
 * { data: { result: [...], total: 1 } }
 * { data: [...] }
 * { result: [...] }
 * [...]
 */
const extractCars = (response: unknown): TCarItem[] => {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response as TCarItem[];
  }

  if (typeof response !== "object") {
    return [];
  }

  const body = response as TCarsApiResponse;

  if (Array.isArray(body.data)) {
    return body.data;
  }

  if (body.data && !Array.isArray(body.data)) {
    if (Array.isArray(body.data.result)) {
      return body.data.result;
    }
  }

  if (Array.isArray(body.result)) {
    return body.result;
  }

  return [];
};

const CCar: React.FC = () => {
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<TFormMode>("add");
  const [selectedCar, setSelectedCar] = useState<TCar | undefined>();

  const {
    data: carsResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMyCarsQuery();

  const [createCar, { isLoading: isCreating }] = useCreateCarMutation();
  const [updateCar, { isLoading: isUpdating }] = useUpdateCarMutation();

  // FIX: Backend cars are inside response.data.result.
  const cars = useMemo<TCarItem[]>(
    () => extractCars(carsResponse),
    [carsResponse],
  );

  const filteredCars = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return cars.filter((car) => {
      const matchesSearch =
        !keyword ||
        [
          car.registrationNumber,
          car.make,
          car.model,
          car.color,
          car.parkingSlot,
          getName(car.societyId),
          getName(car.flatId),
        ].some((value) =>
          String(value || "").toLowerCase().includes(keyword),
        );

      const status = getVerificationStatus(car);

      const matchesStatus =
        verificationFilter === "ALL" ||
        status === verificationFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cars, search, verificationFilter]);

  const counts = useMemo(
    () => ({
      total: cars.length,
      pending: cars.filter(
        (car) => getVerificationStatus(car) === "PENDING",
      ).length,
      verified: cars.filter((car) =>
        ["VERIFIED", "APPROVED"].includes(
          getVerificationStatus(car),
        ),
      ).length,
      rejected: cars.filter(
        (car) => getVerificationStatus(car) === "REJECTED",
      ).length,
    }),
    [cars],
  );

  const openCreateDialog = () => {
    setSelectedCar(undefined);
    setMode("add");
    setDialogOpen(true);
  };

  const openEditDialog = (car: TCarItem) => {
    setSelectedCar(car);
    setMode("edit");
    setDialogOpen(true);
  };

  const openViewDialog = (car: TCarItem) => {
    setSelectedCar(car);
    setMode("view");
    setDialogOpen(true);
  };

  const handleSubmit = async (payload: TCarPayload) => {
    try {
      if (mode === "edit" && selectedCar) {
        const id = getId(
          (selectedCar as TCarItem)._id ||
            (selectedCar as TCarItem).id,
        );

        if (!id) {
          throw new Error("Car ID is missing");
        }

        await updateCar({
          id,
          data: payload,
        }).unwrap();
      } else {
        await createCar(payload).unwrap();
      }

      setDialogOpen(false);
      setSelectedCar(undefined);

      // Fetch the latest cars after saving.
      await refetch();
    } catch {
      toast.error("Failed to save car. Please try again.");
    }
  };

  const renderStatus = (car: TCarItem) => {
    const status = getVerificationStatus(car);

    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
          status,
        )}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <CarFront className="h-7 w-7" />
            My Cars
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Add your cars and track their verification status.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>

          <Button type="button" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Car
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">Total Cars</p>
              <p className="mt-1 text-2xl font-bold">{counts.total}</p>
            </div>
            <CarFront className="h-8 w-8 text-gray-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="mt-1 text-2xl font-bold">{counts.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">Verified</p>
              <p className="mt-1 text-2xl font-bold">{counts.verified}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="mt-1 text-2xl font-bold">{counts.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Cars list */}
      <Card>
        <CardHeader>
          <CardTitle>My Car List</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search registration, make, model, society..."
                className="pl-9"
              />
            </div>

            <Select
              value={verificationFilter}
              onValueChange={setVerificationFilter}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Verification status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-gray-500">
              Loading your cars...
            </div>
          ) : isError ? (
            <div className="py-12 text-center">
              <p className="font-medium text-red-600">
                Failed to load your cars.
              </p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => refetch()}
              >
                Try Again
              </Button>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CarFront className="mb-3 h-12 w-12 text-gray-300" />

              <h3 className="text-lg font-semibold">
                {cars.length > 0 ? "No matching cars found" : "No cars found"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {cars.length > 0
                  ? "Try changing your search or verification filter."
                  : "Add your first car to get started."}
              </p>

              {cars.length === 0 && (
                <Button className="mt-4" onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Car
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
                <table className="list-table">
                  <thead>
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Image</th>
                      <th className="px-4 py-3">Registration</th>
                      <th className="px-4 py-3">Car</th>
                      <th className="px-4 py-3">Society</th>
                      <th className="px-4 py-3">Flat</th>
                      <th className="px-4 py-3">Verification</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCars.map((car, index) => (
                      <tr
                        key={car._id || car.id || car.registrationNumber}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3">
                          <ListImage
                            source={car.imageUrl}
                            alt={`${car.registrationNumber || "Car"} image`}
                            className="h-12 w-16"
                          />
                        </td>

                        <td className="px-4 py-3 font-medium">
                          {car.registrationNumber || "-"}
                        </td>

                        <td className="px-4 py-3">
                          {[car.make, car.model]
                            .filter(Boolean)
                            .join(" ") || "-"}
                        </td>

                        <td className="px-4 py-3">
                          {getName(car.societyId)}
                        </td>

                        <td className="px-4 py-3">
                          {getName(car.flatId)}
                        </td>

                        <td className="px-4 py-3">
                          {renderStatus(car)}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openViewDialog(car)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>

                              {!["VERIFIED", "APPROVED"].includes(
                                getVerificationStatus(car),
                              ) && (
                                <DropdownMenuItem
                                  onClick={() => openEditDialog(car)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {filteredCars.map((car) => (
                  <div
                    key={car._id || car.id || car.registrationNumber}
                    className="rounded-lg border p-4"
                  >
                    <ListImage
                      source={car.imageUrl}
                      alt={`${car.registrationNumber || "Car"} image`}
                      className="mb-3 h-40 w-full"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {car.registrationNumber || "No registration"}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {[car.make, car.model]
                            .filter(Boolean)
                            .join(" ") || "Car details"}
                        </p>
                      </div>

                      {renderStatus(car)}
                    </div>

                    <p className="mt-3 text-sm text-gray-600">
                      Society: {getName(car.societyId)}
                    </p>

                    <p className="text-sm text-gray-600">
                      Flat: {getName(car.flatId)}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewDialog(car)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>

                      {!["VERIFIED", "APPROVED"].includes(
                        getVerificationStatus(car),
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(car)}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit / View dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? "Add Car"
                : mode === "edit"
                  ? "Edit Car"
                  : "Car Details"}
            </DialogTitle>
          </DialogHeader>

          <CCarForm
            mode={mode}
            initialData={selectedCar}
            loading={isCreating || isUpdating}
            onClose={() => setDialogOpen(false)}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CCar;
