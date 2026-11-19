import { useMemo, useState } from "react";
import { Activity, CheckCircle2, Clock3, Eye, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ListImage from "@/components/ListImage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetBookingsQuery, type BookingNew } from "@/redux/features/bookingNew/bookingNewApi";

const getBookings = (response: unknown): BookingNew[] => {
  if (!response || typeof response !== "object") return [];
  const record = response as Record<string, unknown>;
  const data = record.data;
  if (Array.isArray(data)) return data as BookingNew[];
  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;
    if (Array.isArray(nested.data)) return nested.data as BookingNew[];
    if (Array.isArray(nested.result)) return nested.result as BookingNew[];
  }
  if (Array.isArray(record.result)) return record.result as BookingNew[];
  return [];
};

const labelOf = (value: BookingNew["carId"]) => {
  if (typeof value === "string") return value;
  return value?.registrationNumber ?? value?.name ?? "—";
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const formatTimestamp = (value?: string | null) => {
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

const formatDuration = (seconds?: number) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};

const workStatusLabel = (booking: BookingNew) => {
  if (booking.workStatus === "Working") return "In progress";
  if (booking.workStatus === "Paused") return "Paused";
  if (booking.workStatus === "Completed" || booking.status === "Completed") {
    return "Completed";
  }
  if (booking.status === "Cancelled") return "Cancelled";
  return "Not started";
};

const statusClass = (booking: BookingNew) => {
  const status = workStatusLabel(booking);
  if (status === "Completed") return "bg-emerald-50 text-emerald-700";
  if (status === "In progress") return "bg-blue-50 text-blue-700";
  if (status === "Paused") return "bg-violet-50 text-violet-700";
  if (status === "Cancelled") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
};

const CustomerWorkStatus = () => {
  const [selectedBooking, setSelectedBooking] = useState<BookingNew | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useGetBookingsQuery(
    { page: 1, limit: 100 },
    { pollingInterval: 30_000 },
  );
  const bookings = useMemo(() => getBookings(data), [data]);
  const activeCount = bookings.filter((booking) =>
    ["Working", "Paused"].includes(booking.workStatus || "") ||
    booking.status === "InProgress",
  ).length;
  const completedCount = bookings.filter(
    (booking) =>
      booking.status === "Completed" || booking.workStatus === "Completed",
  ).length;

  return (
    <div className="space-y-6 px-4 py-4 sm:px-8 lg:px-12">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Cleaning Status</h1>
        <p className="mt-1 text-sm text-slate-600">
          Follow worker progress, cleaning updates, and work start/stop times for your cars.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total wash tasks</CardDescription>
            <CardTitle>{isLoading ? "…" : bookings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In progress / paused</CardDescription>
            <CardTitle>{isLoading ? "…" : activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle>{isLoading ? "…" : completedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-sky-600" />
              Worker task updates
            </CardTitle>
            <CardDescription>
              Status refreshes automatically every 30 seconds.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <LoaderCircle className="h-5 w-5 animate-spin text-slate-500" />
            </div>
          ) : isError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-red-600">
                Cleaning status could not be loaded.
              </p>
              <Button className="mt-3" variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : bookings.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No wash tasks found yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Car</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Worker progress</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(booking.bookingDate)}
                        <div className="text-xs text-muted-foreground">
                          {booking.bookingTime || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {typeof booking.carId !== "string" ? (
                            <ListImage
                              source={booking.carId?.imageUrl}
                              alt={`${labelOf(booking.carId)} car`}
                              className="h-12 w-16"
                            />
                          ) : null}
                          {labelOf(booking.carId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.serviceNameSnapshot || "Car wash"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(booking)}`}>
                          {workStatusLabel(booking)}
                        </span>
                      </TableCell>
                      <TableCell>{booking.status}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Cleaning status and work timeline</DialogTitle>
            <DialogDescription>
              Worker progress and timestamps are shown in India time.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-5">
              {typeof selectedBooking.carId !== "string" &&
              selectedBooking.carId ? (
                <ListImage
                  source={selectedBooking.carId.imageUrl}
                  alt={`${labelOf(selectedBooking.carId)} car`}
                  className="h-52 w-full"
                />
              ) : null}
              <dl className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
                {[
                  ["Service", selectedBooking.serviceNameSnapshot],
                  ["Car", labelOf(selectedBooking.carId)],
                  ["Scheduled", `${formatDate(selectedBooking.bookingDate)} · ${selectedBooking.bookingTime}`],
                  ["Booking status", selectedBooking.status],
                  ["Worker status", workStatusLabel(selectedBooking)],
                  ["Payment", `${selectedBooking.paymentType} · ${selectedBooking.paymentStatus}`],
                  ["Amount", `₹${Number(selectedBooking.amountPayable || 0).toFixed(2)}`],
                  ["Worker notes", selectedBooking.workerNotes || "No notes"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="break-words font-medium text-slate-900">{value || "—"}</dd>
                  </div>
                ))}
              </dl>

              <section>
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <Clock3 className="h-4 w-4" />
                  Work timeline
                </h3>
                {selectedBooking.workSessions?.length ? (
                  <ol className="space-y-3 border-l pl-4 text-sm">
                    {selectedBooking.workSessions.map((session, index) => (
                      <li key={`${session.startedAt}-${index}`}>
                        <p className="font-medium">
                          {index === 0 ? "Work started" : "Work resumed"}
                        </p>
                        <p className="text-slate-500">{formatTimestamp(session.startedAt)}</p>
                        {session.endedAt ? (
                          <p className="text-slate-500">
                            Stopped: {formatTimestamp(session.endedAt)} · Duration{" "}
                            {formatDuration(session.durationSeconds)}
                          </p>
                        ) : (
                          <p className="text-emerald-700">Currently working</p>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-slate-500">
                    Work has not been started yet.
                  </p>
                )}
                {selectedBooking.workCompletedAt && (
                  <p className="mt-2 text-sm font-medium text-emerald-700">
                    Completed at {formatTimestamp(selectedBooking.workCompletedAt)} · Total time{" "}
                    {formatDuration(selectedBooking.totalWorkingSeconds)}
                  </p>
                )}
              </section>

              <section>
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Cleaning checklist
                </h3>
                <ul className="grid gap-2 text-sm sm:grid-cols-2">
                  {[
                    ["Exterior wash", "exteriorWash"],
                    ["Interior cleaning", "interiorCleaning"],
                    ["Dashboard", "dashboard"],
                    ["Tyre dressing", "tyreDressing"],
                    ["Vacuum cleaning", "vacuumCleaning"],
                  ].map(([label, key]) => {
                    const complete =
                      selectedBooking.cleaningChecklist?.[
                        key as keyof NonNullable<BookingNew["cleaningChecklist"]>
                      ] ?? false;
                    return (
                      <li
                        key={key}
                        className="flex justify-between rounded bg-slate-50 px-3 py-2"
                      >
                        <span>{label}</span>
                        <span className={complete ? "font-medium text-emerald-700" : "text-slate-500"}>
                          {complete ? "Done" : "Pending"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section>
                <h3 className="mb-2 font-semibold">Cleaning photos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Before cleaning", selectedBooking.beforePhoto],
                    ["After cleaning", selectedBooking.afterPhoto],
                  ].map(([title, photo]) => (
                    <figure key={title}>
                      <figcaption className="mb-1 text-sm text-slate-500">{title}</figcaption>
                      {photo ? (
                        <img
                          src={photo}
                          alt={title}
                          className="h-40 w-full rounded-md object-cover"
                        />
                      ) : (
                        <p className="flex h-40 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500">
                          Not uploaded
                        </p>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerWorkStatus;
