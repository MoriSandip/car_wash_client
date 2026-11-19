import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  CalendarCheck,
  Clock,
  CheckCircle2,
  Eye,
  Plus,
  Search,
  Trash2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import ListImage from "@/components/ListImage";
import ListPagination from "@/components/ListPagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { useGetCarsQuery } from "@/redux/features/car/carApi";
import { useGetFlatsQuery } from "@/redux/features/flat/flatApi";
import { useGetWashServicesQuery } from "@/redux/features/washService/washServiceApi";
import { useGetSocietiesQuery } from "@/redux/features/society/societyApi";
import { useGetMembershipsQuery } from "@/redux/features/membership/membershipApi";

import {
  type BookingStatus,
  useChangeBookingStatusMutation,
  useCreateBookingMutation,
  useDeleteBookingMutation,
  useGetBookingsQuery,
  useUpdateBookingMutation,
  useRecordOfflineBookingPaymentMutation,
} from "@/redux/features/bookingNew/bookingNewApi";
import { useGetWashServiceSlotsQuery } from "@/redux/features/slots/slots";

// Dynamic API responses are normalized throughout this legacy page.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;
type PaymentType = "Membership" | "Individual";
type DialogMode = "add" | "view";

type BookingForm = {
  societyId: string;
  flatId: string;
  carId: string;
  serviceId: string;
  membershipId: string;
  startDate: string;
  endDate: string;
  paymentType: PaymentType;
  remarks: string;
};

const initialForm: BookingForm = {
  societyId: "",
  flatId: "",
  carId: "",
  serviceId: "",
  membershipId: "",
  startDate: "",
  endDate: "",
  paymentType: "Individual",
  remarks: "",
};

const bookingStatuses: BookingStatus[] = [
  "Pending",
  "Confirmed",
  "InProgress",
  "Completed",
  "Cancelled",
];

const getArray = (response: unknown): AnyRecord[] => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  const obj = response as AnyRecord;

  const candidates = [
    obj.data,
    obj.data?.data,
    obj.data?.result,
    obj.data?.results,
    obj.data?.items,
    obj.data?.docs,
    obj.data?.memberships,
    obj.data?.bookings,
    obj.result,
    obj.results,
    obj.items,
    obj.docs,
    obj.memberships,
    obj.bookings,
  ];

  return candidates.find(Array.isArray) ?? [];
};

const idOf = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (!value || typeof value !== "object") return "";

  const obj = value as AnyRecord;
  const id = obj._id ?? obj.id;

  return id == null ? "" : String(id);
};

const relationId = (item: AnyRecord, keys: string[]): string => {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return idOf(value);
    }
  }

  return "";
};

const labelOf = (item: AnyRecord, keys: string[]): string => {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }

  return idOf(item) || "Unnamed";
};

const errorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== "object") return fallback;

  const details = error as {
    data?: { message?: unknown; error?: unknown };
    message?: unknown;
  };
  const message =
    details.data?.message ?? details.data?.error ?? details.message;
  return typeof message === "string" ? message : fallback;
};

const formatDate = (value: unknown): string => {
  if (!value) return "—";

  const date = new Date(String(value));

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString();
};

const formatWorkTimestamp = (value: unknown): string => {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
};

const formatWorkDuration = (value: unknown): string => {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};

const getDateRange = (startDate: string, endDate: string): string[] => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return [];
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end ||
    start.toISOString().slice(0, 10) !== startDate ||
    end.toISOString().slice(0, 10) !== endDate
  ) {
    return [];
  }

  const dates: string[] = [];
  for (let timestamp = start.getTime(); timestamp <= end.getTime(); timestamp += 86400000) {
    dates.push(new Date(timestamp).toISOString().slice(0, 10));
  }
  return dates;
};

const localDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const statusClass = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    case "InProgress":
      return "bg-blue-100 text-blue-700";
    case "Confirmed":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
};

const BookingPage: React.FC = () => {
  const [form, setForm] = useState<BookingForm>({ ...initialForm });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [offlinePaymentOpen, setOfflinePaymentOpen] = useState(false);
  const [offlinePaymentMethod, setOfflinePaymentMethod] =
    useState<"Cash" | "UPI">("Cash");
  const [offlinePaymentReference, setOfflinePaymentReference] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlotId, setRescheduleSlotId] = useState("");
  const [selectedSlotIds, setSelectedSlotIds] = useState<Record<string, string>>({});
  const [createdBookingDates, setCreatedBookingDates] = useState<string[]>([]);
  const [isCreatingDateRange, setIsCreatingDateRange] = useState(false);
  const [createSummary, setCreateSummary] = useState<{
    created: number;
    skipped: number;
    failed: number;
  } | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>("add");
  const [selectedBooking, setSelectedBooking] =
    useState<AnyRecord | null>(null);
  const [actionError, setActionError] = useState("");

  const {
    data: bookingResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetBookingsQuery({
    searchTerm,
    status: statusFilter === "All" ? undefined : statusFilter,
    page,
    limit: 10,
  });

  const { data: societyResponse, isLoading: societiesLoading } =
    useGetSocietiesQuery();

  const { data: flatResponse, isLoading: flatsLoading } =
    useGetFlatsQuery();

  const { data: carResponse, isLoading: carsLoading } =
    useGetCarsQuery();

  const { data: serviceResponse, isLoading: servicesLoading } =
    useGetWashServicesQuery({
      status: "Active",
      page: 1,
      limit: 100,
    });

  // Load active, paid memberships for the Membership booking dropdown.
  const {
    data: membershipResponse,
    isLoading: membershipsLoading,
    isFetching: membershipsFetching,
    isError: membershipsError,
    refetch: refetchMemberships,
  } = useGetMembershipsQuery({
    status: "Active",
    paymentStatus: "Paid",
    societyId: form.societyId || undefined,
    flatId: form.flatId || undefined,
    carId: form.carId || undefined,
    page: 1,
    limit: 100,
  });

  const [createBooking, createState] = useCreateBookingMutation();
  const bookingDates = useMemo(
    () => getDateRange(form.startDate, form.endDate),
    [form.startDate, form.endDate],
  );
  const {
    data: bookingSlotsResponse,
    isFetching: bookingSlotsLoading,
    isError: bookingSlotsError,
  } = useGetWashServiceSlotsQuery(
    {
      serviceId: form.serviceId,
      from: form.startDate,
      to: form.endDate,
    },
    {
      skip:
        !form.serviceId ||
        !form.startDate ||
        !form.endDate ||
        bookingDates.length === 0,
    },
  );
  const availableSlotsByDate = useMemo(() => {
    const slotsByDate: Record<string, AnyRecord[]> = {};
    for (const slot of getArray(bookingSlotsResponse)) {
      if (slot.isBooked !== "available" || !idOf(slot) || !slot.date) continue;
      const date = String(slot.date).slice(0, 10);
      slotsByDate[date] = [...(slotsByDate[date] ?? []), slot];
    }
    return slotsByDate;
  }, [bookingSlotsResponse]);
  const selectedBookingDates = useMemo(
    () =>
      bookingDates.filter((date) =>
        (availableSlotsByDate[date] ?? []).some(
          (slot) => idOf(slot) === selectedSlotIds[date],
        ),
      ),
    [availableSlotsByDate, bookingDates, selectedSlotIds],
  );
  const availableBookingDates = bookingDates.filter(
    (date) => (availableSlotsByDate[date] ?? []).length > 0,
  );
  const skippedBookingDates = bookingDates.length - availableBookingDates.length;

  const [changeStatus, changeStatusState] =
    useChangeBookingStatusMutation();

  const [deleteBooking, deleteState] = useDeleteBookingMutation();
  const [updateBooking, updateBookingState] = useUpdateBookingMutation();
  const [recordOfflinePayment, offlinePaymentState] =
    useRecordOfflineBookingPaymentMutation();
  const selectedServiceId = selectedBooking
    ? idOf(selectedBooking.serviceId)
    : "";
  const {
    data: rescheduleSlotsResponse,
    isFetching: rescheduleSlotsLoading,
    isError: rescheduleSlotsError,
  } = useGetWashServiceSlotsQuery(
    { serviceId: selectedServiceId, date: rescheduleDate },
    { skip: !rescheduleOpen || !selectedServiceId || !rescheduleDate },
  );
  const rescheduleSlots = useMemo(
    () =>
      getArray(rescheduleSlotsResponse).filter(
        (slot) => slot.isBooked === "available",
      ),
    [rescheduleSlotsResponse],
  );

  const societies = useMemo(
    () => getArray(societyResponse),
    [societyResponse],
  );

  const flats = useMemo(
    () => getArray(flatResponse),
    [flatResponse],
  );

  const cars = useMemo(
    () => getArray(carResponse),
    [carResponse],
  );

  const services = useMemo(
    () => getArray(serviceResponse),
    [serviceResponse],
  );

  const memberships = useMemo(
    () => getArray(membershipResponse),
    [membershipResponse],
  );

  const bookings = useMemo(
    () => getArray(bookingResponse),
    [bookingResponse],
  );

  const meta =
    (bookingResponse as AnyRecord | undefined)?.meta ??
    (bookingResponse as AnyRecord | undefined)?.data?.meta ??
    {};

  const totalPages = Math.max(
    1,
    Number(meta.totalPage ?? meta.totalPages ?? 1),
  );

  const totalRecords = Number(meta.total ?? bookings.length);

  const stats = useMemo(() => {
    return {
      total: totalRecords,
      pending: bookings.filter(
        (item) => item.status === "Pending",
      ).length,
      active: bookings.filter((item) =>
        ["Confirmed", "InProgress"].includes(item.status),
      ).length,
      completed: bookings.filter(
        (item) => item.status === "Completed",
      ).length,
    };
  }, [bookings, totalRecords]);

  const updateForm = <K extends keyof BookingForm>(
    key: K,
    value: BookingForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openAddForm = () => {
    setSelectedBooking(null);
    setForm({ ...initialForm });
    setSelectedSlotIds({});
    setCreatedBookingDates([]);
    setCreateSummary(null);
    setDialogMode("add");
    setActionError("");
    setFormOpen(true);
  };

  const openViewForm = (booking: AnyRecord) => {
    setSelectedBooking(booking);
    setDialogMode("view");
    setActionError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelectedBooking(null);
    setSelectedSlotIds({});
    setCreatedBookingDates([]);
    setCreateSummary(null);
    setActionError("");
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setActionError("");

    if (
      !form.societyId ||
      !form.flatId ||
      !form.carId ||
      !form.serviceId ||
      !form.startDate ||
      !form.endDate
    ) {
      setActionError("Complete all required fields.");
      return;
    }

    if (bookingDates.length === 0) {
      setActionError("Choose a valid date range with the start date on or before the end date.");
      return;
    }

    if (bookingSlotsLoading || bookingSlotsError) {
      setActionError(
        bookingSlotsLoading
          ? "Wait for availability to finish loading."
          : "Unable to load slot availability. Change the date range or try again.",
      );
      return;
    }

    if (
      form.paymentType === "Membership" &&
      !form.membershipId
    ) {
      setActionError("Please select a membership.");
      return;
    }

    if (selectedBookingDates.length < availableBookingDates.length) {
      setActionError(
        "Choose an available time slot for every date that has availability. Dates with no slots will be skipped.",
      );
      return;
    }

    if (selectedBookingDates.length === 0) {
      setCreateSummary({
        created: createdBookingDates.length,
        skipped: skippedBookingDates,
        failed: 0,
      });
      setActionError("No dates in this range have an available slot. No bookings were created.");
      return;
    }

    const datesToBook = selectedBookingDates.filter(
      (date) => !createdBookingDates.includes(date),
    );
    if (datesToBook.length === 0) {
      setActionError("Bookings have already been created for every selected date.");
      return;
    }

    if (form.paymentType === "Membership") {
      const selectedMembership = filteredMemberships.find(
        (membership) => idOf(membership) === form.membershipId,
      );
      const remainingWashes = selectedMembership
        ? Math.max(
            0,
            Number(selectedMembership.includedWashes ?? 0) -
              Number(selectedMembership.usedWashes ?? 0) -
              Number(selectedMembership.reservedWashes ?? 0),
          )
        : 0;
      if (remainingWashes < datesToBook.length) {
        setActionError(
          `This membership has ${remainingWashes} wash${remainingWashes === 1 ? "" : "es"} remaining, but ${datesToBook.length} selected date${datesToBook.length === 1 ? "" : "s"} still need booking. No bookings were created.`,
        );
        return;
      }
    }

    const createdDates = new Set(createdBookingDates);
    const failedDates: { date: string; message: string }[] = [];
    let newlyCreated = 0;

    setIsCreatingDateRange(true);
    try {
      for (const date of datesToBook) {
        const selectedSlot = (availableSlotsByDate[date] ?? []).find(
          (slot) => idOf(slot) === selectedSlotIds[date],
        );
        if (!selectedSlot) continue;

        try {
          await createBooking({
            societyId: form.societyId,
            flatId: form.flatId,
            carId: form.carId,
            serviceId: form.serviceId,
            slotId: idOf(selectedSlot),
            membershipId:
              form.paymentType === "Membership"
                ? form.membershipId
                : undefined,
            bookingDate: date,
            bookingTime: String(selectedSlot.startTime),
            paymentType: form.paymentType,
            remarks: form.remarks.trim(),
          }).unwrap();
          createdDates.add(date);
          newlyCreated += 1;
        } catch (error: unknown) {
          failedDates.push({
            date,
            message: errorMessage(error, "Booking could not be created."),
          });
        }
      }

      setCreatedBookingDates(Array.from(createdDates));
      const summary = {
        created: createdDates.size,
        skipped: skippedBookingDates,
        failed: failedDates.length,
      };
      setCreateSummary(summary);
      refetch();
      refetchMemberships();

      if (failedDates.length > 0) {
        const failures = failedDates
          .map(({ date, message: reason }) => `${formatDate(date)}: ${reason}`)
          .join("; ");
        const message = `Created ${summary.created} booking${summary.created === 1 ? "" : "s"}; skipped ${summary.skipped} date${summary.skipped === 1 ? "" : "s"}; ${summary.failed} booking${summary.failed === 1 ? "" : "s"} failed. Successful dates will not be submitted again. ${failures}`;
        setActionError(message);
        toast.error(message);
      } else {
        setActionError("");
        toast.success(
          `Created ${summary.created} booking${summary.created === 1 ? "" : "s"}; skipped ${summary.skipped} date${summary.skipped === 1 ? "" : "s"}.`,
        );
      }
    } catch (error: unknown) {
      setActionError(
        errorMessage(error, `Created ${newlyCreated} bookings before the request stopped.`),
      );
    } finally {
      setIsCreatingDateRange(false);
    }
  };

  const handleStatusChange = async (
    bookingId: string,
    nextStatus: BookingStatus,
  ) => {
    try {
      await changeStatus({
        id: bookingId,
        body: { status: nextStatus },
      }).unwrap();

      toast.success("Booking status updated.");
      refetch();
    } catch (error: unknown) {
      toast.error(
        errorMessage(error, "Unable to update booking status."),
      );
    }
  };

  const submitOfflinePayment = async () => {
    const bookingId = idOf(selectedBooking);
    if (!bookingId) return;

    try {
      await recordOfflinePayment({
        bookingId,
        body: {
          method: offlinePaymentMethod,
          ...(offlinePaymentReference.trim()
            ? { reference: offlinePaymentReference.trim() }
            : {}),
        },
      }).unwrap();
      toast.success("Offline payment recorded.");
      setOfflinePaymentOpen(false);
      setOfflinePaymentReference("");
      setSelectedBooking(null);
      refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Unable to record offline payment."));
    }
  };

  const submitReschedule = async () => {
    const bookingId = selectedBooking ? idOf(selectedBooking) : "";
    const selectedSlot = rescheduleSlots.find(
      (slot) => idOf(slot) === rescheduleSlotId,
    );
    if (!bookingId || !selectedSlot || !rescheduleDate) {
      toast.error("Choose an available date and time slot.");
      return;
    }
    try {
      await updateBooking({
        id: bookingId,
        body: {
          bookingDate: rescheduleDate,
          bookingTime: String(selectedSlot.startTime),
          slotId: rescheduleSlotId,
        },
      }).unwrap();
      toast.success("Booking rescheduled.");
      setRescheduleOpen(false);
      setRescheduleSlotId("");
      refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Unable to reschedule booking."));
    }
  };

  const handleDelete = async () => {
    if (!selectedBooking) return;

    const bookingId = idOf(selectedBooking);

    if (!bookingId) {
      toast.error("Booking ID is missing.");
      return;
    }

    setActionError("");

    try {
      await deleteBooking(bookingId).unwrap();

      toast.success("Booking deleted successfully.");
      setDeleteOpen(false);
      setSelectedBooking(null);

      if (bookings.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        refetch();
      }
    } catch (error: unknown) {
      setActionError(
        errorMessage(error, "Unable to delete booking."),
      );
    }
  };

  const exportCSV = () => {
    const headers = [
      "Booking ID",
      "Booking Date",
      "Booking Time",
      "Service",
      "Booking Type",
      "Amount",
      "Payment Status",
      "Booking Status",
    ];

    const rows = bookings.map((booking) => [
      idOf(booking),
      booking.bookingDate ?? "",
      booking.bookingTime ?? "",
      booking.serviceNameSnapshot ?? booking.serviceId?.name ?? "",
      booking.paymentType ?? "",
      booking.amountPayable ?? "",
      booking.paymentStatus ?? "",
      booking.status ?? "",
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
    link.download = "bookings.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const filteredFlats = flats.filter((flat) => {
    const societyId = relationId(flat, [
      "societyId",
      "society",
      "society_id",
    ]);

    return !societyId || societyId === form.societyId;
  });

  const filteredCars = cars.filter((car) => {
    const societyId = relationId(car, [
      "societyId",
      "society",
      "society_id",
    ]);

    const flatId = relationId(car, [
      "flatId",
      "flat",
      "flat_id",
    ]);

    return (
      (!societyId || societyId === form.societyId) &&
      (!flatId || flatId === form.flatId)
    );
  });

  // Apply relation filtering on the frontend too.
  // This prevents unrelated memberships from appearing if the API
  // does not apply one of the optional query filters.
  const filteredMemberships = memberships.filter((membership) => {
    const societyId = relationId(membership, ["societyId", "society"]);
    const flatId = relationId(membership, ["flatId", "flat"]);
    const carId = relationId(membership, ["carId", "car"]);

    const isActive = membership.status === "Active";
    const isPaid = membership.paymentStatus === "Paid";
    const hasWashes =
      Number(membership.includedWashes ?? 0) -
        Number(membership.usedWashes ?? 0) -
        Number(membership.reservedWashes ?? 0) >
      0;

    return (
      isActive &&
      isPaid &&
      hasWashes &&
      (!societyId || societyId === form.societyId) &&
      (!flatId || flatId === form.flatId) &&
      (!carId || carId === form.carId)
    );
  });

  const loadingOptions =
    societiesLoading ||
    flatsLoading ||
    carsLoading ||
    servicesLoading;

  const membershipDropdownLoading =
    membershipsLoading || membershipsFetching;

  const membershipLabel = (membership: AnyRecord) => {
    const car = membership.carId;
    const plan = membership.planId;

    const registrationNumber =
      car?.registrationNumber ??
      car?.vehicleNumber ??
      "Car";

    const planName =
      plan?.name ??
      plan?.planName ??
      plan?.title ??
      "Membership Plan";

    const remainingWashes = Math.max(
      0,
      Number(membership.includedWashes ?? 0) -
        Number(membership.usedWashes ?? 0) -
        Number(membership.reservedWashes ?? 0),
    );

    return `${registrationNumber} | ${planName} | ${remainingWashes} washes left`;
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Booking Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage wash bookings, appointments and booking statuses.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={bookings.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Button onClick={openAddForm}>
            <Plus className="mr-2 h-4 w-4" />
            Add Booking
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{stats.total}</p>
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-amber-600">
                {stats.pending}
              </p>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Confirmed / In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {stats.active}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-green-600">
                {stats.completed}
              </p>
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {bookingStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading bookings...
            </div>
          ) : isError ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-sm text-red-600">
                Failed to load bookings.
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Car</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No bookings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((booking, index) => {
                      const bookingId = idOf(booking);

                      return (
                        <TableRow key={bookingId || index}>
                          <TableCell>
                            {formatDate(booking.bookingDate)}
                            <div className="text-xs text-muted-foreground">
                              {booking.bookingTime || "—"}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ListImage
                                source={booking.carId?.imageUrl}
                                alt={`${labelOf(booking.carId, ["registrationNumber", "name"])} car`}
                                className="h-12 w-16"
                              />
                              <span>
                                {typeof booking.carId === "string"
                                  ? booking.carId
                                  : booking.carId
                                  ? labelOf(booking.carId, [
                                      "registrationNumber",
                                      "carNumber",
                                      "name",
                                    ])
                                  : "—"}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-medium">
                              {booking.serviceNameSnapshot ??
                                booking.serviceId?.name ??
                                "—"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {booking.bookingNumber
                                ? `#${booking.bookingNumber}`
                                : bookingId}
                            </div>
                          </TableCell>

                          <TableCell>
                            {booking.paymentType || "—"}
                          </TableCell>

                          <TableCell>
                            ₹
                            {Number(
                              booking.amountPayable ?? 0,
                            ).toFixed(2)}
                          </TableCell>

                          <TableCell>
                            {booking.paymentStatus || "—"}
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                                booking.status || "Pending",
                              )}`}
                            >
                              {booking.status || "Pending"}
                            </span>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Cleaning: {String(booking.workStatus || "NotStarted")
                                .replace("NotStarted", "Not started")
                                .replace("Working", "In progress")}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap justify-end gap-1">
                              {booking.paymentType === "Individual" &&
                                booking.paymentStatus !== "Paid" &&
                                !["Cancelled", "Completed"].includes(
                                  booking.status,
                                ) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={offlinePaymentState.isLoading}
                                    onClick={() => {
                                      setSelectedBooking(booking);
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
                                title="View Booking"
                                onClick={() => openViewForm(booking)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {!["Completed", "Cancelled", "InProgress"].includes(
                                booking.status,
                              ) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setRescheduleDate(
                                      new Date(booking.bookingDate)
                                        .toISOString()
                                        .slice(0, 10),
                                    );
                                    setRescheduleSlotId("");
                                    setRescheduleOpen(true);
                                  }}
                                >
                                  Reschedule
                                </Button>
                              )}

                              <Select
                                value={booking.status || "Pending"}
                                onValueChange={(value: BookingStatus) =>
                                  handleStatusChange(bookingId, value)
                                }
                                disabled={
                                  !bookingId ||
                                  changeStatusState.isLoading ||
                                  ["Completed", "Cancelled"].includes(
                                    booking.status,
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {bookingStatuses.map((status) => (
                                    <SelectItem
                                      key={status}
                                      value={status}
                                    >
                                      {status}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete Booking"
                                className="text-red-600 hover:text-red-700"
                                disabled={!bookingId || deleteState.isLoading}
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setActionError("");
                                  setDeleteOpen(true);
                                }}
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

          <ListPagination
            page={Number(meta.page ?? page)}
            totalPages={totalPages}
            totalItems={totalRecords}
            pageSize={10}
            isLoading={isFetching}
            itemLabel="bookings"
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
          else setFormOpen(true);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add Booking" : "Booking Details"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "add"
                ? "Choose an inclusive date range and an available slot for each booking date."
                : "Review the selected booking information."}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === "add" ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Society *</Label>
                  <Select
                    value={form.societyId}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        societyId: value,
                        flatId: "",
                        carId: "",
                        membershipId: "",
                      }))
                    }
                    disabled={societiesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          societiesLoading
                            ? "Loading societies..."
                            : "Select society"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {societies.map((society, index) => {
                        const id = idOf(society);
                        if (!id) return null;

                        return (
                          <SelectItem key={id || index} value={id}>
                            {labelOf(society, [
                              "name",
                              "societyName",
                              "title",
                            ])}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Flat *</Label>
                  <Select
                    value={form.flatId}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        flatId: value,
                        carId: "",
                        membershipId: "",
                      }))
                    }
                    disabled={!form.societyId || flatsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !form.societyId
                            ? "Select society first"
                            : flatsLoading
                              ? "Loading flats..."
                              : "Select flat"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredFlats.map((flat, index) => {
                        const id = idOf(flat);
                        if (!id) return null;

                        return (
                          <SelectItem key={id || index} value={id}>
                            {labelOf(flat, [
                              "flatNo",
                              "flatNumber",
                              "unitNumber",
                              "name",
                              "title",
                            ])}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Car *</Label>
                  <Select
                    value={form.carId}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        carId: value,
                        membershipId: "",
                      }))
                    }
                    disabled={!form.flatId || carsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !form.flatId
                            ? "Select flat first"
                            : carsLoading
                              ? "Loading cars..."
                              : "Select car"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCars.map((car, index) => {
                        const id = idOf(car);
                        if (!id) return null;

                        return (
                          <SelectItem key={id || index} value={id}>
                            {labelOf(car, [
                              "registrationNumber",
                              "vehicleNumber",
                              "carNumber",
                              "registrationNo",
                              "name",
                              "model",
                            ])}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Wash Service *</Label>
                  <Select
                    value={form.serviceId}
                    onValueChange={(value) => {
                      updateForm("serviceId", value);
                      setSelectedSlotIds({});
                      setCreateSummary(null);
                      setActionError("");
                    }}
                    disabled={servicesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          servicesLoading
                            ? "Loading services..."
                            : "Select wash service"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service, index) => {
                        const id = idOf(service);
                        if (!id) return null;

                        return (
                          <SelectItem key={id || index} value={id}>
                            {labelOf(service, ["name", "title"])} — ₹
                            {Number(service.price ?? 0).toFixed(2)} (
                            {service.durationMinutes ?? "—"} min)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="booking-start-date">Start date *</Label>
                  <Input
                    id="booking-start-date"
                    type="date"
                    value={form.startDate}
                    min={localDateInputValue(new Date())}
                    onChange={(event) => {
                      updateForm("startDate", event.target.value);
                      setSelectedSlotIds({});
                      setCreateSummary(null);
                      setActionError("");
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="booking-end-date">End date *</Label>
                  <Input
                    id="booking-end-date"
                    type="date"
                    value={form.endDate}
                    min={form.startDate || localDateInputValue(new Date())}
                    onChange={(event) => {
                      updateForm("endDate", event.target.value);
                      setSelectedSlotIds({});
                      setCreateSummary(null);
                      setActionError("");
                    }}
                    required
                  />
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <div>
                    <Label>Time slot for each date</Label>
                    <p className="text-sm text-muted-foreground">
                      Every date in the range is included. Dates without an available slot are skipped.
                    </p>
                  </div>

                  {form.startDate &&
                    form.endDate &&
                    bookingDates.length === 0 && (
                      <p role="alert" className="text-sm text-red-600">
                        Choose a valid range with the start date on or before the end date.
                      </p>
                    )}
                  {bookingSlotsLoading && (
                    <p className="text-sm text-muted-foreground">
                      Loading available slots for these dates…
                    </p>
                  )}
                  {bookingSlotsError && (
                    <p role="alert" className="text-sm text-red-600">
                      Could not load slots. Change the range or try again.
                    </p>
                  )}

                  {bookingDates.map((date) => {
                    const slots = availableSlotsByDate[date] ?? [];
                    return (
                      <div
                        key={date}
                        className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            {new Date(`${date}T12:00:00`).toLocaleDateString()}
                          </p>
                          {slots.length === 0 &&
                            !bookingSlotsLoading &&
                            !bookingSlotsError && (
                              <p className="text-sm text-amber-700">
                                Unavailable — this date will be skipped.
                              </p>
                            )}
                        </div>
                        {slots.length > 0 ? (
                          <Select
                            value={selectedSlotIds[date] ?? ""}
                            onValueChange={(slotId) => {
                              setSelectedSlotIds((current) => ({
                                ...current,
                                [date]: slotId,
                              }));
                              setCreateSummary(null);
                              setActionError("");
                            }}
                            disabled={bookingSlotsLoading || bookingSlotsError}
                          >
                            <SelectTrigger className="sm:w-64">
                              <SelectValue placeholder="Choose an available time" />
                            </SelectTrigger>
                            <SelectContent>
                              {slots.map((slot) => (
                                <SelectItem key={idOf(slot)} value={idOf(slot)}>
                                  {slot.startTime} – {slot.endTime}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {bookingSlotsLoading
                              ? "Checking availability…"
                              : bookingSlotsError
                                ? "Availability unavailable"
                                : "No available slots"}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {bookingDates.length > 0 && !bookingSlotsLoading && !bookingSlotsError && (
                    <p className="rounded-md bg-muted p-3 text-sm">
                      Booking summary: {selectedBookingDates.length} of{" "}
                      {availableBookingDates.length} available date
                      {availableBookingDates.length === 1 ? "" : "s"} selected;{" "}
                      {skippedBookingDates} date
                      {skippedBookingDates === 1 ? "" : "s"} skipped.
                    </p>
                  )}
                  {createSummary && (
                    <p
                      role="status"
                      className={`rounded-md p-3 text-sm ${
                        createSummary.failed
                          ? "bg-red-50 text-red-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      Result: {createSummary.created} booking
                      {createSummary.created === 1 ? "" : "s"} created;{" "}
                      {createSummary.skipped} date
                      {createSummary.skipped === 1 ? "" : "s"} skipped;{" "}
                      {createSummary.failed} booking
                      {createSummary.failed === 1 ? "" : "s"} failed.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Booking Type *</Label>
                  <Select
                    value={form.paymentType}
                    onValueChange={(value: PaymentType) =>
                      setForm((current) => ({
                        ...current,
                        paymentType: value,
                        membershipId: "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">
                        Individual paid booking
                      </SelectItem>
                      <SelectItem value="Membership">
                        Membership-included wash
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.paymentType === "Membership" && (
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Membership ID *</Label>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => refetchMemberships()}
                        disabled={membershipDropdownLoading}
                      >
                        <RefreshCw className="mr-2 h-3.5 w-3.5" />
                        Refresh
                      </Button>
                    </div>

                    <Select
                      value={form.membershipId}
                      onValueChange={(value) =>
                        updateForm("membershipId", value)
                      }
                      disabled={
                        !form.societyId ||
                        !form.flatId ||
                        !form.carId ||
                        membershipDropdownLoading ||
                        membershipsError
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !form.societyId
                              ? "Select society first"
                              : !form.flatId
                                ? "Select flat first"
                                : !form.carId
                                  ? "Select car first"
                                  : membershipDropdownLoading
                                    ? "Loading memberships..."
                                    : membershipsError
                                      ? "Unable to load memberships"
                                      : "Select membership"
                          }
                        />
                      </SelectTrigger>

                      <SelectContent>
                        {filteredMemberships.map((membership) => {
                          const id = idOf(membership);

                          if (!id) return null;

                          return (
                            <SelectItem key={id} value={id}>
                              {membershipLabel(membership)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {membershipsError && (
                      <p className="text-sm text-red-600">
                        Failed to load memberships. Click Refresh to retry.
                      </p>
                    )}

                    {!membershipDropdownLoading &&
                      !membershipsError &&
                      form.societyId &&
                      form.flatId &&
                      form.carId &&
                      filteredMemberships.length === 0 && (
                        <p className="text-sm text-amber-600">
                          No eligible paid membership with available washes
                          was found for this car.
                        </p>
                      )}

                    <p className="text-xs text-muted-foreground">
                      Only active, paid memberships with available washes
                      are listed for the selected society, flat and car.
                    </p>
                  </div>
                )}

                <div className="space-y-2 sm:col-span-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={form.remarks}
                    onChange={(event) =>
                      updateForm("remarks", event.target.value)
                    }
                    placeholder="Optional booking remarks"
                    maxLength={1000}
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
                  onClick={closeForm}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    isCreatingDateRange ||
                    createState.isLoading ||
                    bookingSlotsLoading ||
                    loadingOptions ||
                    (form.paymentType === "Membership" &&
                      membershipDropdownLoading)
                  }
                >
                  {isCreatingDateRange || createState.isLoading
                    ? "Creating..."
                    : "Create Selected Bookings"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ["Booking ID", idOf(selectedBooking)],
                  [
                    "Booking Date",
                    formatDate(selectedBooking?.bookingDate),
                  ],
                  ["Booking Time", selectedBooking?.bookingTime],
                  [
                    "Service",
                    selectedBooking?.serviceNameSnapshot ??
                      selectedBooking?.serviceId?.name,
                  ],
                  ["Booking Type", selectedBooking?.paymentType],
                  [
                    "Amount",
                    `₹${Number(
                      selectedBooking?.amountPayable ?? 0,
                    ).toFixed(2)}`,
                  ],
                  ["Payment Status", selectedBooking?.paymentStatus],
                  ["Booking Status", selectedBooking?.status],
                  [
                    "Membership ID",
                    idOf(selectedBooking?.membershipId) || "—",
                  ],
                  ["Remarks", selectedBooking?.remarks || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-1">
                    <Label className="text-muted-foreground">
                      {label}
                    </Label>
                    <p className="break-words text-sm font-medium">
                      {value || "—"}
                    </p>
                  </div>
                ))}
              </div>

              <section className="space-y-4 rounded-lg border p-4">
                <div>
                  <h3 className="font-semibold">Worker cleaning progress</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {String(selectedBooking?.workStatus || "NotStarted")
                      .replace("NotStarted", "Not started")
                      .replace("Working", "In progress")}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    ["Before cleaning", selectedBooking?.beforePhoto],
                    ["After cleaning", selectedBooking?.afterPhoto],
                  ].map(([label, photo]) => (
                    <figure key={label} className="space-y-2">
                      <figcaption className="text-sm font-medium">{label}</figcaption>
                      {typeof photo === "string" && photo ? (
                        <a href={photo} target="_blank" rel="noreferrer">
                          <img
                            src={photo}
                            alt={`${label} vehicle`}
                            className="h-48 w-full rounded-md border object-cover"
                          />
                        </a>
                      ) : (
                        <p className="rounded-md bg-muted px-3 py-6 text-center text-sm text-muted-foreground">
                          Not uploaded
                        </p>
                      )}
                    </figure>
                  ))}
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold">Cleaning checklist</h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      ["Exterior wash", "exteriorWash"],
                      ["Interior cleaning", "interiorCleaning"],
                      ["Dashboard", "dashboard"],
                      ["Tyre dressing", "tyreDressing"],
                      ["Vacuum cleaning", "vacuumCleaning"],
                    ].map(([label, key]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                      >
                        <span>{label}</span>
                        <span className={selectedBooking?.cleaningChecklist?.[key] ? "font-medium text-emerald-700" : "text-muted-foreground"}>
                          {selectedBooking?.cleaningChecklist?.[key] ? "Done" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold">Worker notes</h4>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {selectedBooking?.workerNotes || "No notes"}
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold">Work timeline (India time)</h4>
                  <ol className="space-y-3 border-l pl-4 text-sm">
                    {(selectedBooking?.workSessions || []).map(
                      (session: AnyRecord, index: number) => (
                        <li key={`${session.startedAt}-${index}`}>
                          <p className="font-medium">
                            {index === 0 ? "Work started" : "Work resumed"}
                          </p>
                          <p className="text-muted-foreground">
                            {formatWorkTimestamp(session.startedAt)}
                          </p>
                          {session.endedAt ? (
                            <>
                              <p className="mt-1 font-medium">
                                {selectedBooking?.workStatus === "Completed" &&
                                index ===
                                  (selectedBooking?.workSessions?.length || 0) - 1
                                  ? "Work completed"
                                  : "Work stopped / paused"}
                              </p>
                              <p className="text-muted-foreground">
                                {formatWorkTimestamp(session.endedAt)}
                                {" · "}
                                Session duration:{" "}
                                {formatWorkDuration(session.durationSeconds)}
                              </p>
                            </>
                          ) : (
                            <p className="text-emerald-700">
                              Active since {formatWorkTimestamp(session.startedAt)}
                            </p>
                          )}
                        </li>
                      ),
                    )}
                    {!selectedBooking?.workSessions?.length &&
                    selectedBooking?.workCompletedAt ? (
                      <li>
                        <p className="font-medium">Work completed</p>
                        <p className="text-muted-foreground">
                          {formatWorkTimestamp(selectedBooking.workCompletedAt)}
                        </p>
                      </li>
                    ) : null}
                    {!selectedBooking?.workSessions?.length &&
                    !selectedBooking?.workCompletedAt ? (
                      <li className="text-muted-foreground">
                        No work sessions recorded yet.
                      </li>
                    ) : null}
                  </ol>
                  <p className="mt-3 text-sm font-medium">
                    Total working time:{" "}
                    {formatWorkDuration(selectedBooking?.totalWorkingSeconds)}
                  </p>
                </div>
              </section>

              <DialogFooter>
                <Button variant="outline" onClick={closeForm}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={offlinePaymentOpen}
        onOpenChange={(open) => {
          setOfflinePaymentOpen(open);
          if (!open) setActionError("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record offline payment</DialogTitle>
            <DialogDescription>
              Confirm the received cash or UPI payment for this booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offline-payment-method">Payment method</Label>
              <Select
                value={offlinePaymentMethod}
                onValueChange={(value: "Cash" | "UPI") =>
                  setOfflinePaymentMethod(value)
                }
              >
                <SelectTrigger id="offline-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="offline-payment-reference">
                Reference (optional)
              </Label>
              <Input
                id="offline-payment-reference"
                value={offlinePaymentReference}
                onChange={(event) =>
                  setOfflinePaymentReference(event.target.value)
                }
                placeholder="UPI transaction ID or receipt number"
                maxLength={120}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Booking amount: ₹
              {Number(selectedBooking?.amountPayable ?? 0).toFixed(2)}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOfflinePaymentOpen(false)}
              disabled={offlinePaymentState.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitOfflinePayment}
              disabled={offlinePaymentState.isLoading}
            >
              {offlinePaymentState.isLoading
                ? "Recording…"
                : "Confirm payment received"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rescheduleOpen}
        onOpenChange={(open) => {
          setRescheduleOpen(open);
          if (!open) setRescheduleSlotId("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule booking</DialogTitle>
            <DialogDescription>
              Select an available slot. The current slot stays reserved unless
              the new booking time is saved successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">New date</Label>
              <Input
                id="reschedule-date"
                type="date"
                min={new Date().toLocaleDateString("en-CA")}
                value={rescheduleDate}
                onChange={(event) => {
                  setRescheduleDate(event.target.value);
                  setRescheduleSlotId("");
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Available time</Label>
              <Select
                value={rescheduleSlotId}
                onValueChange={setRescheduleSlotId}
                disabled={
                  rescheduleSlotsLoading ||
                  rescheduleSlotsError ||
                  rescheduleSlots.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      rescheduleSlotsLoading
                        ? "Loading available slots..."
                        : rescheduleSlotsError
                          ? "Unable to load slots"
                          : rescheduleSlots.length
                            ? "Select an available time"
                            : "No available slots"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {rescheduleSlots.map((slot, index) => (
                    <SelectItem key={idOf(slot) || index} value={idOf(slot)}>
                      {slot.startTime} – {slot.endTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {rescheduleSlotsError ? (
                <p className="text-sm text-red-600">
                  Could not load slots. Change the date and retry.
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleOpen(false)}
              disabled={updateBookingState.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReschedule}
              disabled={
                !rescheduleSlotId ||
                updateBookingState.isLoading ||
                rescheduleSlotsLoading
              }
            >
              {updateBookingState.isLoading ? "Saving..." : "Save new schedule"}
            </Button>
          </DialogFooter>
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
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking? This action
              cannot be undone.
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
              disabled={deleteState.isLoading}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteState.isLoading}
            >
              {deleteState.isLoading ? "Deleting..." : "Delete Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingPage;
