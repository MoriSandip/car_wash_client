import { useMemo, useState } from "react";
import { CalendarDays, Clock3, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateWashServiceSlotsMutation,
  useGetWashServiceSlotsQuery,
  type TAvailableSlot,
} from "@/redux/features/slots/slots";
import {
  useGetWashServicesQuery,
  type WashService,
} from "@/redux/features/washService/washServiceApi";

type SlotRecord = TAvailableSlot & {
  washServiceId?: string | WashService;
};

type ApiEnvelope<T> = {
  data?: T | { data?: T; result?: T; results?: T; docs?: T; items?: T };
  result?: T;
  results?: T;
  docs?: T;
  items?: T;
};

const getArray = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) return response as T[];
  if (!response || typeof response !== "object") return [];

  const envelope = response as ApiEnvelope<T[]>;
  const candidates = [
    envelope.data,
    envelope.result,
    envelope.results,
    envelope.docs,
    envelope.items,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as T[];
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      for (const value of [
        nested.data,
        nested.result,
        nested.results,
        nested.docs,
        nested.items,
      ]) {
        if (Array.isArray(value)) return value as T[];
      }
    }
  }
  return [];
};

const dateInput = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const today = () => dateInput(new Date());

const getErrorMessage = (error: unknown) => {
  const value = error as {
    data?: { message?: string };
    message?: string;
  };
  return (
    value.data?.message ||
    value.message ||
    "Unable to create slots. Please try again."
  );
};

const SlotManagement = () => {
  const [serviceId, setServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("19:00");
  const [actionError, setActionError] = useState("");

  const monthStart = dateInput(
    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1),
  );
  const monthEnd = dateInput(
    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0),
  );

  const {
    data: servicesResponse,
    isLoading: servicesLoading,
    isError: servicesError,
    refetch: refetchServices,
  } = useGetWashServicesQuery({ status: "Active", page: 1, limit: 100 });
  const services = useMemo(
    () =>
      getArray<WashService>(servicesResponse).filter(
        (service) => service.status === "Active",
      ),
    [servicesResponse],
  );
  const {
    data: slotsResponse,
    isLoading: slotsLoading,
    isFetching: slotsFetching,
    isError: slotsError,
    refetch: refetchSlots,
  } = useGetWashServiceSlotsQuery(
    { serviceId, from: monthStart, to: monthEnd },
    { skip: !serviceId },
  );
  const [createSlots, createState] = useCreateWashServiceSlotsMutation();

  const slots = useMemo(
    () => (slotsResponse?.data ?? []) as SlotRecord[],
    [slotsResponse],
  );
  const availableDates = useMemo(
    () =>
      new Set(
        slots
          .filter((slot) => slot.isBooked === "available")
          .map((slot) => slot.date.slice(0, 10)),
      ),
    [slots],
  );
  const selectedDateString = selectedDate ? dateInput(selectedDate) : "";
  const selectedSlots = useMemo(
    () =>
      slots
        .filter((slot) => slot.date.slice(0, 10) === selectedDateString)
        .sort((first, second) =>
          first.startTime.localeCompare(second.startTime),
        ),
    [slots, selectedDateString],
  );
  const selectedService = services.find((service) => service._id === serviceId);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError("");
    if (!serviceId || !startDate || !endDate) {
      setActionError("Select an active wash service and both dates.");
      return;
    }
    if (endDate < startDate) {
      setActionError("End date must be on or after the start date.");
      return;
    }
    if (endTime <= startTime) {
      setActionError("End time must be after the start time.");
      return;
    }

    try {
      const result = await createSlots({
        washServiceId: serviceId,
        startDate,
        endDate,
        startTime,
        endTime,
      }).unwrap();
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      const days =
        Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
      toast.success(
        `${result.data.length} slots created across ${days} day${days === 1 ? "" : "s"}.`,
      );
      refetchSlots();
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Slot Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Add daily booking slots for active wash services.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            refetchServices();
            if (serviceId) refetchSlots();
          }}
          disabled={slotsFetching || servicesLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              slotsFetching || servicesLoading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-sky-600" />
              Monthly slot calendar
            </CardTitle>
            <CardDescription>
              Choose a service to view its monthly schedule. Green dots mark
              dates with bookable slots.
            </CardDescription>
            <div className="max-w-sm pt-2">
              <Label htmlFor="slot-service">Wash service</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger id="slot-service" className="mt-2">
                  <SelectValue
                    placeholder={
                      servicesLoading
                        ? "Loading services..."
                        : "Choose an active service"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service._id} value={service._id}>
                      {service.name} · {service.durationMinutes} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {servicesError && (
                <p className="mt-2 text-sm text-red-600">
                  Could not load services. Use Refresh to retry.
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onSelect={setSelectedDate}
              disabled={{ before: new Date(`${today()}T00:00:00`) }}
              fromDate={new Date(`${today()}T00:00:00`)}
              showOutsideDays={false}
              modifiers={{
                hasAvailableSlots: (date) =>
                  availableDates.has(dateInput(date)),
              }}
              modifiersClassNames={{
                hasAvailableSlots:
                  "relative after:absolute after:bottom-1 after:right-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-emerald-500 after:content-['']",
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add slots</CardTitle>
              <CardDescription>
                {selectedService
                  ? `${selectedService.name}: ${selectedService.durationMinutes}-minute slots will be generated each day in the selected date range.`
                  : "Choose a service and date range before setting its hours."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="slot-start-date">Start date</Label>
                    <Input
                      id="slot-start-date"
                      type="date"
                      min={today()}
                      value={startDate}
                      onChange={(event) => {
                        const value = event.target.value;
                        setStartDate(value);
                        if (value) {
                          setSelectedDate(new Date(`${value}T12:00:00`));
                          setCalendarMonth(new Date(`${value}T12:00:00`));
                          if (!endDate || endDate < value) setEndDate(value);
                        }
                      }}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slot-end-date">End date</Label>
                    <Input
                      id="slot-end-date"
                      type="date"
                      min={startDate || today()}
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      required
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="slot-start-time">Start time</Label>
                    <Input
                      id="slot-start-time"
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slot-end-time">End time</Label>
                    <Input
                      id="slot-end-time"
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      required
                      className="mt-2"
                    />
                  </div>
                </div>
                {selectedService && endTime > startTime && (
                  <p className="text-xs text-slate-500">
                    {Math.floor(
                      (Number(endTime.slice(0, 2)) * 60 +
                        Number(endTime.slice(3, 5)) -
                        (Number(startTime.slice(0, 2)) * 60 +
                          Number(startTime.slice(3, 5)))) /
                        selectedService.durationMinutes,
                    )}{" "}
                    slots per day will be created
                    {startDate && endDate && endDate >= startDate
                      ? ` for ${
                          Math.floor(
                            (new Date(`${endDate}T00:00:00`).getTime() -
                              new Date(`${startDate}T00:00:00`).getTime()) /
                              86_400_000,
                          ) + 1
                        } day${
                          endDate === startDate ? "" : "s"
                        }`
                      : ""}
                    .
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  If slots already exist for any date in this range, the request
                  is rejected without creating partial slots.
                </p>
                {actionError && (
                  <p role="alert" className="text-sm text-red-600">
                    {actionError}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={
                    createState.isLoading ||
                    servicesLoading ||
                    !serviceId ||
                    !startDate ||
                    !endDate ||
                    endDate < startDate
                  }
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createState.isLoading
                    ? "Creating slots..."
                    : "Create slots for date range"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-sky-600" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                </span>
                <Badge variant="outline">{selectedSlots.length} slots</Badge>
              </CardTitle>
              <CardDescription>
                Existing slots and their current booking status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!serviceId ? (
                <p className="py-5 text-center text-sm text-slate-500">
                  Select a wash service to see its schedule.
                </p>
              ) : slotsLoading ? (
                <p className="py-5 text-center text-sm text-slate-500">
                  Loading slots...
                </p>
              ) : slotsError ? (
                <div className="space-y-3 py-5 text-center">
                  <p className="text-sm text-red-600">
                    Could not load this month&apos;s slots.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => refetchSlots()}
                  >
                    Retry
                  </Button>
                </div>
              ) : selectedSlots.length === 0 ? (
                <div className="py-5 text-center">
                  <p className="text-sm text-slate-500">
                    No slots have been created for this date yet.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Choose working hours above and click Create slots.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSlots.map((slot) => (
                    <div
                      key={slot._id}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          slot.isBooked === "available"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : slot.isBooked === "booked"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                        }
                      >
                        {slot.isBooked}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SlotManagement;
