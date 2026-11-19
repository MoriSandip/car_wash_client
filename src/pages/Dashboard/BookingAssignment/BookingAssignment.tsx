import React, { useMemo, useState } from "react";


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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Users,
  UserRoundCheck,
  UserRoundX,
  RefreshCw,
} from "lucide-react";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { TAssignmentBooking, useAssignWorkerToBookingMutation, useAssignWorkerToMembershipBookingsMutation, useGetBookingsForAssignmentQuery, useGetWorkersForAssignmentQuery, useUnassignWorkerFromBookingMutation, useUnassignWorkerFromMembershipBookingsMutation } from "@/redux/features/bookingNew/bookingAssignmentApi";

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

const getList = (response: any): TAssignmentBooking[] => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const getWorkerName = (worker: any) => {
  if (!worker) return "Unassigned";

  if (typeof worker === "string") {
    return `Worker ID: ${worker.slice(-6)}`;
  }

  return worker.name || worker.email || "Assigned Worker";
};

const getCarName = (booking: TAssignmentBooking) => {
  const car = booking.carId;

  if (!car || typeof car !== "object") return "—";

  return [
    car.registrationNumber || car.carNumber || "",
    [car.make || car.brand, car.model].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" — ") || "—";
};

const getSocietyName = (booking: TAssignmentBooking) => {
  const society = booking.societyId;

  return typeof society === "object" && society
    ? society.name || "—"
    : "—";
};

const getFlatName = (booking: TAssignmentBooking) => {
  const flat = booking.flatId;

  if (!flat || typeof flat !== "object") return "—";

  return (
    flat.flatNumber ||
    flat.flatNo ||
    flat.flatName ||
    flat.name ||
    "—"
  );
};

const getErrorMessage = (error: any) =>
  error?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

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

const getDateKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd");
};

const statusClass = (status: string) => {
  switch (status) {
    case "Confirmed":
    case "Assigned":
      return "bg-blue-100 text-blue-700";

    case "InProgress":
    case "In Progress":
      return "bg-amber-100 text-amber-700";

    case "Completed":
      return "bg-green-100 text-green-700";

    case "Cancelled":
      return "bg-red-100 text-red-700";

    case "Pending":
      return "bg-gray-100 text-gray-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const BookingAssignment: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedWorkers, setSelectedWorkers] = useState<
    Record<string, string>
  >({});
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const monthStart = startOfMonth(selectedMonth);
  const nextMonthStart = addMonths(monthStart, 1);
  const monthDays = useMemo(
    () =>
      Array.from(
        { length: endOfMonth(selectedMonth).getDate() },
        (_, index) =>
          new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth(),
            index + 1
          )
      ),
    [selectedMonth]
  );

  const {
    currentData: bookingResponse,
    isLoading,
    isFetching,
    isError,
    refetch: refetchBookings,
  } = useGetBookingsForAssignmentQuery({
    page: 1,
    limit: 100,
    from: format(monthStart, "yyyy-MM-dd"),
    toExclusive: format(nextMonthStart, "yyyy-MM-dd"),
  });

  const {
    data: workers = [],
    isLoading: workersLoading,
    isError: workersError,
    refetch: refetchWorkers,
  } = useGetWorkersForAssignmentQuery();

  const [assignWorker, { isLoading: isAssigning }] =
    useAssignWorkerToBookingMutation();

  const [assignMembershipBookings, { isLoading: isBulkAssigning }] =
    useAssignWorkerToMembershipBookingsMutation();

  const [unassignMembershipBookings, { isLoading: isBulkUnassigning }] =
    useUnassignWorkerFromMembershipBookingsMutation();

  const [unassignWorker, { isLoading: isUnassigning }] =
    useUnassignWorkerFromBookingMutation();

  const bookings = useMemo(
    () => getList(bookingResponse),
    [bookingResponse]
  );

  const activeWorkers = useMemo(
    () =>
      workers.filter((worker) => {
        const status = String(worker.status || "").toLowerCase();

        return !status || status === "active";
      }),
    [workers]
  );

  const assignedCount = bookings.filter(
    (booking) => Boolean(getId(booking.workerId))
  ).length;

  const unassignedCount = bookings.length - assignedCount;

  const filteredBookings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const assigned = Boolean(getId(booking.workerId));

      const matchesAssignment =
        assignmentFilter === "all" ||
        (assignmentFilter === "assigned" && assigned) ||
        (assignmentFilter === "unassigned" && !assigned);

      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      const searchableValues = [
        booking._id,
        booking.serviceNameSnapshot,
        booking.status,
        booking.paymentStatus,
        booking.paymentType,
        getWorkerName(booking.workerId),
        getCarName(booking),
        getSocietyName(booking),
        getFlatName(booking),
      ];

      const matchesSearch =
        !search ||
        searchableValues.some((value) =>
          String(value || "").toLowerCase().includes(search)
        );

      return matchesAssignment && matchesStatus && matchesSearch;
    });
  }, [bookings, searchTerm, assignmentFilter, statusFilter]);

  const selectedDayBookings = useMemo(
    () =>
      filteredBookings.filter(
        (booking) =>
          getDateKey(booking.bookingDate) === getDateKey(selectedDay)
      ),
    [filteredBookings, selectedDay]
  );

  const changeMonth = (amount: number) => {
    const nextMonth = addMonths(selectedMonth, amount);
    setSelectedMonth(nextMonth);
    setSelectedDay(startOfMonth(nextMonth));
  };

  const handleAssign = async (booking: TAssignmentBooking) => {
    const workerId = selectedWorkers[booking._id];

    if (!workerId) {
      setActionError("Please select a worker first.");
      setActionSuccess("");
      return;
    }

    setActionError("");
    setActionSuccess("");

    try {
      await assignWorker({
        bookingId: booking._id,
        workerId,
      }).unwrap();

      setSelectedWorkers((previous) => {
        const next = { ...previous };
        delete next[booking._id];
        return next;
      });

      setActionSuccess("Worker assigned successfully.");
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const handleAssignMembershipBookings = async (
    booking: TAssignmentBooking,
  ) => {
    const membershipId = getId(booking.membershipId);
    const membershipWorkerId =
      booking.membershipId && typeof booking.membershipId === "object"
        ? getId(booking.membershipId.workerId)
        : "";
    const workerId = selectedWorkers[booking._id] || membershipWorkerId;
    if (!membershipId || !workerId) {
      setActionError("Select a worker for a membership booking first.");
      setActionSuccess("");
      return;
    }

    setActionError("");
    setActionSuccess("");
    try {
      const result = await assignMembershipBookings({
        membershipId,
        workerId,
      }).unwrap();
      setActionSuccess(
        result.data.assignedCount > 0
          ? `${result.data.assignedCount} booked membership wash(es) assigned. Future washes booked on this membership will be assigned to this worker automatically.`
          : "Worker assigned to this membership. Future washes booked on it will be assigned automatically.",
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const handleUnassign = async (booking: TAssignmentBooking) => {
    setActionError("");
    setActionSuccess("");

    try {
      await unassignWorker(booking._id).unwrap();
      setActionSuccess("Worker unassigned successfully.");
    } catch (error: any) {
      setActionError(getErrorMessage(error));
    }
  };

  const handleUnassignMembershipBookings = async (
    booking: TAssignmentBooking,
  ) => {
    const membershipId = getId(booking.membershipId);
    if (!membershipId) return;

    setActionError("");
    setActionSuccess("");
    try {
      const result = await unassignMembershipBookings(membershipId).unwrap();
      setActionSuccess(
        `${result.data.unassignedCount} upcoming booked wash(es) unassigned. Future washes on this membership will no longer be assigned automatically.`,
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const handleRefresh = () => {
    refetchBookings();
    refetchWorkers();
  };

  const exportCSV = () => {
    const headers = [
      "Booking ID",
      "Society",
      "Flat",
      "Car",
      "Service",
      "Booking Date",
      "Booking Time",
      "Amount",
      "Payment Status",
      "Booking Status",
      "Assigned Worker",
    ];

    const rows = filteredBookings.map((booking) => [
      booking._id,
      getSocietyName(booking),
      getFlatName(booking),
      getCarName(booking),
      booking.serviceNameSnapshot,
      formatDate(booking.bookingDate),
      booking.bookingTime,
      booking.amountPayable ?? 0,
      booking.paymentStatus,
      booking.status,
      getWorkerName(booking.workerId),
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
    link.download = "booking-assignments.csv";
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
            Booking Assignment
          </h1>
          <p className="text-sm text-muted-foreground">
            Assign customer car wash bookings to available workers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
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
              <p className="text-2xl font-bold">{bookings.length}</p>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Assigned Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-green-600">
                {assignedCount}
              </p>
              <UserRoundCheck className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Unassigned Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-amber-600">
                {unassignedCount}
              </p>
              <UserRoundX className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Schedule</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold" aria-live="polite">
              {format(monthStart, "MMM d")} –{" "}
              {format(endOfMonth(selectedMonth), "MMM d, yyyy")}
            </h2>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2"
            role="group"
            aria-label={`${format(selectedMonth, "MMMM yyyy")} booking dates`}
          >
            {monthDays.map((day) => {
              const dayCount = bookings.filter(
                (booking) =>
                  getDateKey(booking.bookingDate) === getDateKey(day)
              ).length;
              const selected = getDateKey(day) === getDateKey(selectedDay);

              return (
                <button
                  key={getDateKey(day)}
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search car, service, worker..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <Select
              value={assignmentFilter}
              onValueChange={setAssignmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assignment Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignments</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Booking Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Booking Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="InProgress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {actionError && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {actionError}
            </p>
          )}

          {actionSuccess && (
            <p
              role="status"
              className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700"
            >
              {actionSuccess}
            </p>
          )}

          {workersError && (
            <p className="text-sm text-red-600">
              Failed to load workers. Check the worker API endpoint.
            </p>
          )}

          {isLoading || (isFetching && !bookingResponse) ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading bookings...
            </div>
          ) : isError ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-sm text-red-600">
                Failed to load bookings. Please try again.
              </p>
              <Button variant="outline" onClick={() => refetchBookings()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Society / Flat</TableHead>
                    <TableHead>Car</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead className="min-w-[220px]">
                      Assign Worker
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {selectedDayBookings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No bookings found for {format(selectedDay, "dd MMM yyyy")}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedDayBookings.map((booking) => {
                      const assigned = Boolean(getId(booking.workerId));
                      const membershipWorkerId =
                        booking.membershipId &&
                        typeof booking.membershipId === "object"
                          ? getId(booking.membershipId.workerId)
                          : "";
                      const selectedWorkerId =
                        selectedWorkers[booking._id] || membershipWorkerId;
                      const finalStatus = [
                        "Completed",
                        "Cancelled",
                      ].includes(booking.status);

                      return (
                        <TableRow key={booking._id}>
                          <TableCell className="font-medium">
                            #{booking._id.slice(-8).toUpperCase()}
                          </TableCell>

                          <TableCell>
                            <div>{getSocietyName(booking)}</div>
                            <div className="text-xs text-muted-foreground">
                              {getFlatName(booking)}
                            </div>
                          </TableCell>

                          <TableCell>{getCarName(booking)}</TableCell>

                          <TableCell>
                            {booking.serviceNameSnapshot || "—"}
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            <div>{formatDate(booking.bookingDate)}</div>
                            <div className="text-xs text-muted-foreground">
                              {booking.bookingTime || "—"}
                            </div>
                          </TableCell>

                          <TableCell className="font-semibold">
                            ₹
                            {Number(
                              booking.amountPayable || 0
                            ).toLocaleString("en-IN")}
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                                booking.status
                              )}`}
                            >
                              {booking.status}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {getWorkerName(booking.workerId)}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Select
                              value={
                                selectedWorkerId
                              }
                              onValueChange={(value) =>
                                setSelectedWorkers((previous) => ({
                                  ...previous,
                                  [booking._id]: value,
                                }))
                              }
                              disabled={
                                (finalStatus &&
                                  booking.paymentType !== "Membership") ||
                                workersLoading
                              }
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    workersLoading
                                      ? "Loading workers..."
                                      : "Select Worker"
                                  }
                                />
                              </SelectTrigger>

                              <SelectContent>
                                {activeWorkers.map((worker) => (
                                  <SelectItem
                                    key={worker._id}
                                    value={worker._id}
                                  >
                                    {worker.name ||
                                      worker.email ||
                                      worker._id}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-end gap-2">
                              {booking.paymentType !== "Membership" ? (
                                <Button
                                size="sm"
                                disabled={
                                  !selectedWorkerId ||
                                  isAssigning ||
                                  isBulkAssigning ||
                                  isUnassigning ||
                                  isBulkUnassigning ||
                                  finalStatus
                                }
                                onClick={() => handleAssign(booking)}
                              >
                                {isAssigning
                                  ? "Saving..."
                                  : assigned
                                    ? "Reassign"
                                    : "Assign"}
                                </Button>
                              ) : null}

                              {booking.paymentType === "Membership" &&
                              getId(booking.membershipId) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    !selectedWorkerId ||
                                    isAssigning ||
                                    isBulkAssigning ||
                                    isUnassigning ||
                                    isBulkUnassigning
                                  }
                                  onClick={() =>
                                    handleAssignMembershipBookings(booking)
                                  }
                                >
                                  {isBulkAssigning
                                    ? "Assigning..."
                                    : "Assign membership & all washes"}
                                </Button>
                              ) : null}

                              {booking.paymentType === "Membership" &&
                              getId(booking.membershipId) &&
                              membershipWorkerId ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    isAssigning ||
                                    isBulkAssigning ||
                                    isUnassigning ||
                                    isBulkUnassigning
                                  }
                                  onClick={() =>
                                    handleUnassignMembershipBookings(booking)
                                  }
                                >
                                  {isBulkUnassigning
                                    ? "Removing..."
                                    : "Unassign membership"}
                                </Button>
                              ) : assigned ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    isAssigning ||
                                    isBulkAssigning ||
                                    isUnassigning ||
                                    isBulkUnassigning ||
                                    finalStatus
                                  }
                                  onClick={() => handleUnassign(booking)}
                                >
                                  {booking.paymentType === "Membership"
                                    ? "Unassign this wash"
                                    : "Unassign"}
                                </Button>
                              ) : null}
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
            <p className="text-xs text-muted-foreground">
              Refreshing bookings...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingAssignment;
