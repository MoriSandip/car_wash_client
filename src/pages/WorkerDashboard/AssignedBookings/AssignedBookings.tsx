
import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Search,
  ClipboardList,
  MapPin,
  Play,
  Pause,
  CheckCircle2,
  RotateCcw,
  Timer,
  AlertCircle,
} from "lucide-react";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";

import { Button } from "@/components/ui/button";
import ListImage from "@/components/ListImage";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  useGetWorkerAssignedBookingsQuery,
  useUpdateWorkerBookingProgressMutation,
  useUpdateWorkerBookingWorkActionMutation,
} from "@/redux/features/worker/workerApi";

type TWorkStatus = "NotStarted" | "Working" | "Paused" | "Completed";
type TCleaningChecklist = {
  exteriorWash: boolean;
  interiorCleaning: boolean;
  dashboard: boolean;
  tyreDressing: boolean;
  vacuumCleaning: boolean;
};
type TWorkSession = {
  startedAt: string;
  endedAt?: string | null;
  durationSeconds?: number;
};

type TBooking = {
  _id: string;
  bookingId?: string;
  status?: string;
  bookingDate?: string;
  bookingTime?: string;
  amountPayable?: number;
  servicePriceSnapshot?: number;
  paymentType?: "Membership" | "Individual";
  paymentStatus?: string;
  paymentMethod?: "Stripe" | "Cash" | "UPI";
  cashCollectionStatus?: "NotRecorded" | "Received" | "NotReceived";
  membershipId?: { _id?: string } | string;

  workStatus?: TWorkStatus;
  currentWorkStartedAt?: string | null;
  totalWorkingSeconds?: number;
  workCompletedAt?: string | null;
  workSessions?: TWorkSession[];
  beforePhoto?: string;
  afterPhoto?: string;
  cleaningChecklist?: TCleaningChecklist;
  workerNotes?: string;
  remarks?: string;

  societyId?: {
    name?: string;
    societyName?: string;
  } | string;

  flatId?: {
    flatNumber?: string;
    name?: string;
  } | string;

  carId?: {
    brand?: string;
    model?: string;
    carNumber?: string;
    registrationNumber?: string;
    imageUrl?: string;
  } | string;

  serviceId?: {
    name?: string;
    serviceName?: string;
  } | string;
};

const getErrorMessage = (error: any) =>
  error?.data?.message ||
  error?.error ||
  "Unable to process the request. Please try again.";

const getObjectName = (
  value: TBooking["societyId"] | TBooking["serviceId"],
) => {
  if (!value) return "—";
  if (typeof value === "string") return value;

  return (
    value.name ||
    ("societyName" in value ? value.societyName : undefined) ||
    ("serviceName" in value ? value.serviceName : undefined) ||
    "—"
  );
};

const getFlatName = (value: TBooking["flatId"]) => {
  if (!value) return "—";
  if (typeof value === "string") return value;

  return value.flatNumber || value.name || "—";
};

const getCarName = (value: TBooking["carId"]) => {
  if (!value) return "—";
  if (typeof value === "string") return value;

  const name = [value.brand, value.model].filter(Boolean).join(" ");

  return (
    [name, value.carNumber || value.registrationNumber]
      .filter(Boolean)
      .join(" · ") || "—"
  );
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

const formatDateKey = (value?: string | Date) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd");
};

const getIndiaDateKey = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
};

const getScheduledStartTime = (booking: TBooking) => {
  if (!booking.bookingDate || !booking.bookingTime) return null;

  const date = new Date(booking.bookingDate);
  const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(booking.bookingTime);

  if (Number.isNaN(date.getTime()) || !time) return null;

  const scheduledAtUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    Number(time[1]),
    Number(time[2]),
  );

  return scheduledAtUtc - (5 * 60 + 30) * 60_000;
};

const formatWorkingTime = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(remainingSeconds).padStart(2, "0")}`;
};

const formatTimelineTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
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

const getWorkStatus = (booking: TBooking): TWorkStatus => {
  if (booking.workStatus) return booking.workStatus;

  if (booking.status === "Completed") return "Completed";

  return "NotStarted";
};

const statusClass = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "inprogress":
      return "bg-blue-100 text-blue-700";
    case "confirmed":
      return "bg-blue-100 text-blue-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const workStatusClass = (status: TWorkStatus) => {
  switch (status) {
    case "Working":
      return "bg-emerald-100 text-emerald-700";
    case "Paused":
      return "bg-amber-100 text-amber-700";
    case "Completed":
      return "bg-green-100 text-green-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const AssignedBookings: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [now, setNow] = useState(Date.now());
  const [actionError, setActionError] = useState("");
  const [processingBookingId, setProcessingBookingId] = useState("");
  const [detailBooking, setDetailBooking] = useState<TBooking | null>(null);
  const [cashCloseoutBooking, setCashCloseoutBooking] =
    useState<TBooking | null>(null);
  const monthStart = startOfMonth(selectedMonth);
  const monthDays = useMemo(
    () =>
      Array.from(
        { length: endOfMonth(selectedMonth).getDate() },
        (_, index) =>
          new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth(),
            index + 1,
          ),
      ),
    [selectedMonth],
  );

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetWorkerAssignedBookingsQuery({
    page: 1,
    limit: 100,
    from: format(monthStart, "yyyy-MM-dd"),
    toExclusive: format(addMonths(monthStart, 1), "yyyy-MM-dd"),
  });

  const [updateWorkAction, { isLoading: isUpdating }] =
    useUpdateWorkerBookingWorkActionMutation();
  const [updateProgress, { isLoading: isSavingProgress }] =
    useUpdateWorkerBookingProgressMutation();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, []);

  const bookings: TBooking[] = useMemo(() => {
    const result = response as any;

    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.data?.data)) return result.data.data;

    return [];
  }, [response]);

  const filteredBookings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const values = [
        booking.bookingId,
        booking._id,
        booking.status,
        booking.workStatus,
        getObjectName(booking.societyId),
        getFlatName(booking.flatId),
        getCarName(booking.carId),
        getObjectName(booking.serviceId),
      ];

      const matchesSearch =
        !search ||
        values.some((value) =>
          String(value || "").toLowerCase().includes(search),
        );

      const matchesStatus =
        statusFilter === "all" ||
        (booking.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    }).sort((left, right) => {
      const byDate = (left.bookingDate || "").localeCompare(
        right.bookingDate || "",
      );
      return byDate || (left.bookingTime || "").localeCompare(right.bookingTime || "");
    });
  }, [bookings, searchTerm, statusFilter]);

  const selectedDayBookings = useMemo(
    () =>
      filteredBookings.filter(
        (booking) =>
          formatDateKey(booking.bookingDate) === formatDateKey(selectedDay),
      ),
    [filteredBookings, selectedDay],
  );

  const changeMonth = (amount: number) => {
    const nextMonth = startOfMonth(addMonths(selectedMonth, amount));
    setSelectedMonth(nextMonth);
    setSelectedDay(nextMonth);
  };

  const pendingCount = bookings.filter((booking) =>
    ["pending", "confirmed"].includes(
      (booking.status || "").toLowerCase(),
    ),
  ).length;

  const completedCount = bookings.filter(
    (booking) => booking.status === "Completed",
  ).length;

  const cancelledCount = bookings.filter(
    (booking) => booking.status === "Cancelled",
  ).length;

  const getElapsedSeconds = (booking: TBooking) => {
    const accumulated = booking.totalWorkingSeconds || 0;

    if (
      getWorkStatus(booking) !== "Working" ||
      !booking.currentWorkStartedAt
    ) {
      return accumulated;
    }

    const startedAt = new Date(booking.currentWorkStartedAt).getTime();

    if (Number.isNaN(startedAt)) return accumulated;

    return accumulated + Math.max(0, Math.floor((now - startedAt) / 1000));
  };

  const handleWorkAction = async (
    booking: TBooking,
    action: "start" | "stop" | "resume" | "done",
    cashReceived?: boolean,
  ) => {
    setActionError("");
    setProcessingBookingId(booking._id);

    try {
      await updateWorkAction({
        id: booking._id,
        action,
        ...(cashReceived === undefined ? {} : { cashReceived }),
      }).unwrap();

      await refetch();
    } catch (err: any) {
      setActionError(
        err?.data?.message ||
          err?.data?.error ||
          err?.error ||
          `Unable to ${action} work. Please try again.`,
      );
    } finally {
      setProcessingBookingId("");
    }
  };

  const handleProgressUpdate = async (
    booking: TBooking,
    body: {
      beforePhoto?: string;
      afterPhoto?: string;
      cleaningChecklist?: TCleaningChecklist;
      workerNotes?: string;
    },
  ) => {
    setActionError("");
    setProcessingBookingId(booking._id);
    try {
      await updateProgress({id: booking._id, body}).unwrap();
      await refetch();
    } catch (err: unknown) {
      setActionError(getErrorMessage(err));
    } finally {
      setProcessingBookingId("");
    }
  };

  const handlePhotoChange = async (
    booking: TBooking,
    kind: "beforePhoto" | "afterPhoto",
    file?: File,
  ) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setActionError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 2_000_000) {
      setActionError("Photo must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setActionError("Could not read the selected photo.");
        return;
      }
      void handleProgressUpdate(booking, {[kind]: reader.result});
    };
    reader.onerror = () => setActionError("Could not read the selected photo.");
    reader.readAsDataURL(file);
  };

  const renderWorkActions = (booking: TBooking) => {
    const workStatus = getWorkStatus(booking);
    const busy = isUpdating && processingBookingId === booking._id;

    if (booking.status === "Cancelled" || booking.status === "Completed") {
      return (
        <span className="text-xs text-muted-foreground">
          No actions available
        </span>
      );
    }

    if (workStatus === "Completed") {
      return (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Work Done
        </span>
      );
    }

    const scheduledStartTime = getScheduledStartTime(booking);
    const isBookingDateToday =
      scheduledStartTime !== null &&
      getIndiaDateKey(new Date(scheduledStartTime)) ===
        getIndiaDateKey(new Date(now));

    if (!isBookingDateToday) {
      return (
        <span className="text-xs text-muted-foreground">
          Work actions are only available on the booking date
        </span>
      );
    }

    const checklist: TCleaningChecklist = booking.cleaningChecklist || {
      exteriorWash: false,
      interiorCleaning: false,
      dashboard: false,
      tyreDressing: false,
      vacuumCleaning: false,
    };
    const checklistItems: Array<[keyof TCleaningChecklist, string]> = [
      ["exteriorWash", "Exterior wash"],
      ["interiorCleaning", "Interior cleaning"],
      ["dashboard", "Dashboard"],
      ["tyreDressing", "Tyre dressing"],
      ["vacuumCleaning", "Vacuum cleaning"],
    ];
    const canComplete =
      Boolean(booking.afterPhoto) && Object.values(checklist).every(Boolean);
    const photoInput = (kind: "beforePhoto" | "afterPhoto", title: string) => (
      <label className="block cursor-pointer text-xs text-primary underline">
        {title}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          disabled={busy || isSavingProgress}
          onChange={(event) => {
            void handlePhotoChange(booking, kind, event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </label>
    );
    const cleaningDetails =
      workStatus === "NotStarted" ? (
        <div className="space-y-2">
          {booking.beforePhoto ? (
            <img
              src={booking.beforePhoto}
              alt="Before cleaning"
              className="h-20 w-28 rounded object-cover"
            />
          ) : null}
          {photoInput("beforePhoto", "Add before-cleaning photo")}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="space-y-1">
            {checklistItems.map(([key, title]) => (
              <label key={key} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={checklist[key]}
                  disabled={busy || isSavingProgress}
                  onChange={(event) =>
                    void handleProgressUpdate(booking, {
                      cleaningChecklist: {
                        ...checklist,
                        [key]: event.target.checked,
                      },
                    })
                  }
                />
                {title}
              </label>
            ))}
          </div>
          {booking.afterPhoto ? (
            <img
              src={booking.afterPhoto}
              alt="After cleaning"
              className="h-20 w-28 rounded object-cover"
            />
          ) : null}
          {photoInput("afterPhoto", "Add after-cleaning photo")}
          <textarea
            className="w-full rounded border p-2 text-xs"
            placeholder="Cleaning notes (optional)"
            defaultValue={booking.workerNotes || ""}
            maxLength={1000}
            onBlur={(event) => {
              if (event.target.value !== (booking.workerNotes || "")) {
                void handleProgressUpdate(booking, {
                  workerNotes: event.target.value,
                });
              }
            }}
          />
          {!canComplete && (
            <span className="block text-xs text-muted-foreground">
              Complete all checklist items and add an after photo to finish.
            </span>
          )}
        </div>
      );

    if (workStatus === "NotStarted") {
      const canStartWork =
        scheduledStartTime !== null && scheduledStartTime <= now;

      return (
        <div className="space-y-2">
          {cleaningDetails}
          <Button
            size="sm"
            disabled={
              busy ||
              isUpdating ||
              isSavingProgress ||
              booking.status !== "Confirmed" ||
              !canStartWork ||
              !booking.beforePhoto
            }
            onClick={() => handleWorkAction(booking, "start")}
          >
            <Play className="mr-1 h-4 w-4" />
            Start Work
          </Button>
          {!canStartWork && (
            <span className="block text-xs text-muted-foreground">
              Available at the scheduled booking time
            </span>
          )}
        </div>
      );
    }

    if (workStatus === "Working") {
      return (
        <div className="flex flex-wrap gap-2">
          <div className="w-full">{cleaningDetails}</div>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || isUpdating || isSavingProgress}
            onClick={() => handleWorkAction(booking, "stop")}
          >
            <Pause className="mr-1 h-4 w-4" />
            Stop Work
          </Button>

          <Button
            size="sm"
            disabled={busy || isUpdating || isSavingProgress || !canComplete}
            onClick={() =>
              booking.paymentType === "Individual" &&
              booking.paymentMethod === "Cash" &&
              booking.paymentStatus !== "Paid"
                ? setCashCloseoutBooking(booking)
                : void handleWorkAction(booking, "done")
            }
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Done Work
          </Button>
        </div>
      );
    }

    if (workStatus === "Paused") {
      return (
        <div className="flex flex-wrap gap-2">
          <div className="w-full">{cleaningDetails}</div>
          <Button
            size="sm"
            disabled={busy || isUpdating || isSavingProgress}
            onClick={() => handleWorkAction(booking, "resume")}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Resume
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={busy || isUpdating || isSavingProgress || !canComplete}
            onClick={() =>
              booking.paymentType === "Individual" &&
              booking.paymentMethod === "Cash" &&
              booking.paymentStatus !== "Paid"
                ? setCashCloseoutBooking(booking)
                : void handleWorkAction(booking, "done")
            }
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Done Work
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Monthly Schedule
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View all assigned jobs for the selected month and track your working hours.
          </p>
        </div>

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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assigned
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{bookings.length}</span>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending / Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-amber-600">
              {pendingCount}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              {completedCount}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-red-600">
              {cancelledCount}
            </span>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(actionError)}
        onOpenChange={(open) => {
          if (!open) setActionError("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Unable to update work
            </DialogTitle>
            <DialogDescription>{actionError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setActionError("")}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(cashCloseoutBooking)}
        onOpenChange={(open) => {
          if (!open) setCashCloseoutBooking(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cash collection status</DialogTitle>
            <DialogDescription>
              Was ₹{Number(cashCloseoutBooking?.amountPayable || 0).toFixed(2)}{" "}
              collected from this customer? Select one option to complete the job.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCashCloseoutBooking(null)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={isUpdating}
              onClick={() => {
                if (cashCloseoutBooking) {
                  void handleWorkAction(cashCloseoutBooking, "done", false);
                }
                setCashCloseoutBooking(null);
              }}
            >
              Not received
            </Button>
            <Button
              disabled={isUpdating}
              onClick={() => {
                if (cashCloseoutBooking) {
                  void handleWorkAction(cashCloseoutBooking, "done", true);
                }
                setCashCloseoutBooking(null);
              }}
            >
              Received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span aria-live="polite">
              {format(monthStart, "MMM d")} –{" "}
              {format(endOfMonth(selectedMonth), "MMM d, yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2"
            role="group"
            aria-label={`${format(selectedMonth, "MMMM yyyy")} booking dates`}
          >
            {monthDays.map((day) => {
              const dayCount = bookings.filter(
                (booking) =>
                  formatDateKey(booking.bookingDate) === formatDateKey(day),
              ).length;
              const selected =
                formatDateKey(day) === formatDateKey(selectedDay);

              return (
                <button
                  key={formatDateKey(day)}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${format(day, "MMMM d")}, ${dayCount} bookings`}
                  onClick={() => setSelectedDay(day)}
                  className={`flex min-h-16 w-16 shrink-0 flex-col items-center justify-center rounded-md border p-1 text-center transition-colors ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">
                    {format(day, "EEE")}
                  </span>
                  <span className="text-sm">{format(day, "d")}</span>
                  <span
                    className={`text-[10px] ${
                      selected
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {dayCount > 0
                      ? `${dayCount} ${dayCount === 1 ? "job" : "jobs"}`
                      : "—"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search booking, car, society, service..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="inprogress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading assigned bookings...
            </div>
          ) : isError ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-sm text-red-600">
                {getErrorMessage(error)}
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
                    <TableHead>Booking</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Society / Flat</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Booking Status</TableHead>
                    <TableHead>Work Status</TableHead>
                    <TableHead>Working Hours</TableHead>
                    <TableHead>Work Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {selectedDayBookings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="h-28 text-center text-muted-foreground"
                      >
                        {bookings.length === 0
                          ? `No bookings are assigned to you for ${format(selectedMonth, "MMMM yyyy")}.`
                          : filteredBookings.length === 0
                            ? "No bookings match your search or status filter."
                            : `No matching assigned bookings for ${format(selectedDay, "MMMM d, yyyy")}.`}
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedDayBookings.map((booking) => {
                      const workStatus = getWorkStatus(booking);

                      return (
                        <TableRow key={booking._id}>
                          <TableCell>
                            <div className="font-medium">
                              {booking.bookingId || booking._id.slice(-8)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {booking._id}
                            </div>
                          </TableCell>

                          <TableCell>
                            {getObjectName(booking.serviceId)}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              {typeof booking.carId !== "string" &&
                              booking.carId ? (
                                <ListImage
                                  source={booking.carId.imageUrl}
                                  alt={`${getCarName(booking.carId)} car`}
                                  className="h-12 w-16"
                                />
                              ) : (
                                <CarFront className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span>{getCarName(booking.carId)}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-medium">
                              {getObjectName(booking.societyId)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              Flat: {getFlatName(booking.flatId)}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-muted-foreground" />
                              {formatDate(booking.bookingDate)}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock3 className="h-3 w-3" />
                              {booking.bookingTime || "—"}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                                booking.status,
                              )}`}
                            >
                              {booking.status || "Unknown"}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${workStatusClass(
                                workStatus,
                              )}`}
                            >
                              {workStatus}
                            </span>
                            <div className="mt-2">
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => setDetailBooking(booking)}
                              >
                                View full task details
                              </Button>
                              <Dialog
                                open={detailBooking?._id === booking._id}
                                onOpenChange={(open) => {
                                  if (!open) setDetailBooking(null);
                                }}
                              >
                                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Task details & work timeline</DialogTitle>
                                    <DialogDescription>
                                      Work session times are shown in India time.
                                    </DialogDescription>
                                  </DialogHeader>
                              <div className="mt-3 space-y-4 rounded-md border bg-background p-3">
                                {typeof booking.carId !== "string" &&
                                booking.carId?.imageUrl ? (
                                  <img
                                    src={booking.carId.imageUrl}
                                    alt={`${getCarName(booking.carId)} car`}
                                    className="h-52 w-full rounded-md object-cover"
                                  />
                                ) : null}
                                <div>
                                  <p className="font-semibold">
                                    {getObjectName(booking.serviceId)}
                                  </p>
                                  <p className="text-muted-foreground">
                                    Booking #{booking.bookingId || booking._id}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {formatDate(booking.bookingDate)} ·{" "}
                                    {booking.bookingTime || "—"}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {getCarName(booking.carId)} ·{" "}
                                    {getObjectName(booking.societyId)} · Flat{" "}
                                    {getFlatName(booking.flatId)}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="font-medium">Booking status</p>
                                    <p className="text-muted-foreground">
                                      {booking.status || "Unknown"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Work status</p>
                                    <p className="text-muted-foreground">{workStatus}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Payment type</p>
                                    <p className="text-muted-foreground">
                                      {booking.paymentType || "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Payment status</p>
                                    <p className="text-muted-foreground">
                                      {booking.paymentStatus || "—"}
                                    </p>
                                  </div>
                                  {booking.paymentMethod === "Cash" && (
                                    <div>
                                      <p className="font-medium">Cash collection</p>
                                      <p className="text-muted-foreground">
                                        {booking.cashCollectionStatus ||
                                          (booking.paymentStatus === "Paid"
                                            ? "Received"
                                            : "NotRecorded")}
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium">Amount</p>
                                    <p className="text-muted-foreground">
                                      {typeof booking.amountPayable === "number"
                                        ? `₹${booking.amountPayable.toFixed(2)}`
                                        : "—"}
                                    </p>
                                  </div>
                                  {booking.membershipId ? (
                                    <div>
                                      <p className="font-medium">Membership</p>
                                      <p className="break-all text-muted-foreground">
                                        {typeof booking.membershipId === "string"
                                          ? booking.membershipId
                                          : booking.membershipId._id || "—"}
                                      </p>
                                    </div>
                                  ) : null}
                                </div>

                                <div>
                                  <p className="mb-2 font-medium">Cleaning photos</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {[
                                      ["Before cleaning", booking.beforePhoto],
                                      ["After cleaning", booking.afterPhoto],
                                    ].map(([label, photo]) => (
                                      <figure key={label} className="min-w-0">
                                        <figcaption className="mb-1 text-muted-foreground">
                                          {label}
                                        </figcaption>
                                        {photo ? (
                                          <a href={photo} target="_blank" rel="noreferrer">
                                            <img
                                              src={photo}
                                              alt={label}
                                              className="h-24 w-full rounded object-cover"
                                            />
                                          </a>
                                        ) : (
                                          <p className="flex h-24 items-center justify-center rounded bg-muted text-muted-foreground">
                                            Not uploaded
                                          </p>
                                        )}
                                      </figure>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <p className="mb-2 font-medium">Cleaning checklist</p>
                                  <ul className="space-y-1">
                                    {[
                                      ["Exterior wash", "exteriorWash"],
                                      ["Interior cleaning", "interiorCleaning"],
                                      ["Dashboard", "dashboard"],
                                      ["Tyre dressing", "tyreDressing"],
                                      ["Vacuum cleaning", "vacuumCleaning"],
                                    ].map(([label, key]) => (
                                      <li key={key} className="flex justify-between gap-2">
                                        <span>{label}</span>
                                        <span className={
                                          booking.cleaningChecklist?.[
                                            key as keyof TCleaningChecklist
                                          ]
                                            ? "font-medium text-emerald-700"
                                            : "text-muted-foreground"
                                        }>
                                          {booking.cleaningChecklist?.[
                                            key as keyof TCleaningChecklist
                                          ]
                                            ? "Done"
                                            : "Pending"}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <p className="font-medium">Worker notes</p>
                                  <p className="whitespace-pre-wrap text-muted-foreground">
                                    {booking.workerNotes || "No notes"}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium">Booking note</p>
                                  <p className="whitespace-pre-wrap text-muted-foreground">
                                    {booking.remarks || "No booking note"}
                                  </p>
                                </div>

                                <div>
                                  <p className="mb-2 font-medium">Work timeline</p>
                                  <ol className="space-y-2 border-l pl-3">
                                    {(booking.workSessions || []).map(
                                      (session, index) => (
                                        <li key={`${session.startedAt}-${index}`}>
                                          <p className="font-medium">
                                            {index === 0 ? "Started" : "Resumed"}
                                          </p>
                                          <p className="text-muted-foreground">
                                            {formatTimelineTime(session.startedAt)}
                                          </p>
                                          {session.endedAt ? (
                                            <>
                                              <p className="mt-1 font-medium">
                                                {workStatus === "Completed" &&
                                                index ===
                                                  (booking.workSessions?.length || 0) - 1
                                                  ? "Work completed"
                                                  : "Paused"}
                                              </p>
                                              <p className="text-muted-foreground">
                                                {formatTimelineTime(session.endedAt)}
                                                {typeof session.durationSeconds ===
                                                "number"
                                                  ? ` · ${formatWorkingTime(session.durationSeconds)}`
                                                  : ""}
                                              </p>
                                            </>
                                          ) : (
                                            <p className="text-emerald-700">
                                              Session active
                                            </p>
                                          )}
                                        </li>
                                      ),
                                    )}
                                    {booking.workCompletedAt &&
                                    !booking.workSessions?.length ? (
                                      <li>
                                        <p className="font-medium">Job finished</p>
                                        <p className="text-muted-foreground">
                                          {formatTimelineTime(booking.workCompletedAt)}
                                        </p>
                                      </li>
                                    ) : null}
                                    {!booking.workSessions?.length ? (
                                      <li className="text-muted-foreground">
                                        No work sessions recorded yet.
                                      </li>
                                    ) : null}
                                  </ol>
                                  <p className="mt-2 font-medium">
                                    Total working time:{" "}
                                    {formatWorkingTime(getElapsedSeconds(booking))}
                                  </p>
                                </div>
                              </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => setDetailBooking(null)}
                                    >
                                      Close
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2 font-mono text-sm font-semibold">
                              <Timer className="h-4 w-4 text-muted-foreground" />
                              {formatWorkingTime(getElapsedSeconds(booking))}
                            </div>
                            {workStatus === "Working" && (
                              <span className="mt-1 block text-xs text-emerald-600">
                                Timer running
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="min-w-[220px]">
                            {renderWorkActions(booking)}
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
            <p className="text-xs text-muted-foreground">
              Refreshing bookings...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignedBookings;
