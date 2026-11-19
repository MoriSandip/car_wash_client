import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Droplets, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetMyCarsQuery, type TCar } from "@/redux/features/car/carApi";
import {
  useCreateBookingMutation,
  useGetBookingsQuery,
  useUpdateBookingMutation,
  useSubmitBookingReviewMutation,
  useStartStripeBookingCheckoutMutation,
  useConfirmStripeBookingPaymentMutation,
  type BookingNew,
} from "@/redux/features/bookingNew/bookingNewApi";
import {
  useGetWashServicesQuery,
  type WashService,
} from "@/redux/features/washService/washServiceApi";
import {
  useGetWashServiceSlotsQuery,
  type TAvailableSlot,
} from "@/redux/features/slots/slots";
import { useGetCustomerMembershipsQuery } from "@/redux/features/membership/membershipApi";
import { useCreateCashReceiptLinkMutation } from "@/redux/features/payment/transactionsApi";

type RelatedValue =
  | string
  | {
      _id?: string;
      id?: string;
      name?: string;
      city?: string;
      flatNumber?: string;
      block?: string;
      registrationNumber?: string;
      make?: string;
      model?: string;
    };

type CustomerCar = TCar & {
  societyId: RelatedValue;
  flatId: RelatedValue;
};

type CustomerBooking = BookingNew;

type ApiEnvelope<T> = {
  data?: T | { data?: T; result?: T; results?: T; docs?: T; items?: T };
  result?: T;
  results?: T;
  docs?: T;
  items?: T;
};

type BookingForm = {
  carId: string;
  serviceId: string;
  paymentType: "Individual" | "Membership";
  paymentMethod: "Stripe" | "Cash";
  membershipId: string;
  startDate: string;
  endDate: string;
  slotSelections: Record<string, string>;
  remarks: string;
};

const emptyForm: BookingForm = {
  carId: "",
  serviceId: "",
  paymentType: "Individual",
  paymentMethod: "Stripe",
  membershipId: "",
  startDate: "",
  endDate: "",
  slotSelections: {},
  remarks: "",
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
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      for (const value of [
        nested.data,
        nested.result,
        nested.results,
        nested.docs,
        nested.items,
      ]) {
        if (Array.isArray(value)) return value;
      }
    }
  }

  return [];
};

const idOf = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const record = value as { _id?: string; id?: string };
  return record._id || record.id || "";
};

const labelOf = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "—";

  const record = value as Record<string, unknown>;
  if (typeof record.registrationNumber === "string") {
    return record.registrationNumber;
  }
  if (typeof record.name === "string") return record.name;
  if (typeof record.flatNumber === "string") {
    return `${record.block ? `${record.block} · ` : ""}${record.flatNumber}`;
  }
  if (typeof record.make === "string" || typeof record.model === "string") {
    return [record.make, record.model].filter(Boolean).join(" ");
  }
  return "—";
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const formatWorkTimestamp = (value?: string | null) => {
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

const formatWorkDuration = (value?: number) => {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};

const statusClass = (status: string) => {
  switch (status) {
    case "Confirmed":
    case "Completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "InProgress":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
};

const today = () => {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 10);
};

const toLocalDateInput = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const getDateRange = (startDate: string, endDate: string) => {
  if (!startDate || !endDate || startDate > endDate) return [];

  const dates: string[] = [];
  const current = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  while (current <= end) {
    dates.push(toLocalDateInput(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const BookingReview = ({ booking }: { booking: BookingNew }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitReview, reviewState] = useSubmitBookingReviewMutation();
  const save = async () => {
    if (!rating) {
      toast.error("Choose a rating from 1 to 5.");
      return;
    }
    try {
      await submitReview({
        id: booking._id,
        rating,
        ...(review.trim() ? { review: review.trim() } : {}),
      }).unwrap();
      toast.success("Thank you for your review.");
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(response.data?.message || "Unable to submit your review.");
    }
  };

  if (booking.customerRating) {
    return (
      <p className="mt-3 text-sm text-slate-600">
        Your rating: {"★".repeat(booking.customerRating)}
        {"☆".repeat(5 - booking.customerRating)}
        {booking.customerReview ? ` · ${booking.customerReview}` : ""}
      </p>
    );
  }

  return (
    <div className="mt-3 max-w-lg space-y-2">
      <p className="text-sm font-medium text-slate-700">Rate this cleaning</p>
      <div className="flex items-center gap-1" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className="text-2xl text-amber-500"
            aria-label={`${value} stars`}
            onClick={() => setRating(value)}
          >
            {value <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <Textarea
        value={review}
        onChange={(event) => setReview(event.target.value)}
        maxLength={1000}
        placeholder="Write an optional review"
      />
      <Button size="sm" onClick={save} disabled={reviewState.isLoading}>
        {reviewState.isLoading ? "Submitting…" : "Submit review"}
      </Button>
    </div>
  );
};

type CustomerBookingsProps = {
  openBookingOnLoad?: boolean;
};

const CustomerBookings = ({
  openBookingOnLoad = false,
}: CustomerBookingsProps) => {
  const [searchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<BookingForm>({ ...emptyForm });
  const [formError, setFormError] = useState("");
  const [rescheduleBooking, setRescheduleBooking] =
    useState<CustomerBooking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlotId, setRescheduleSlotId] = useState("");
  const [detailBooking, setDetailBooking] = useState<CustomerBooking | null>(
    null,
  );
  const [historyCarId, setHistoryCarId] = useState("all");

  useEffect(() => {
    if (openBookingOnLoad) setDialogOpen(true);
  }, [openBookingOnLoad]);

  const {
    data: bookingsResponse,
    isLoading: bookingsLoading,
    isFetching: bookingsFetching,
    isError: bookingsError,
    refetch: refetchBookings,
  } = useGetBookingsQuery({ page: 1, limit: 100 }, { pollingInterval: 30_000 });
  const [startCheckout, checkoutState] =
    useStartStripeBookingCheckoutMutation();
  const [createReceiptLink, receiptState] =
    useCreateCashReceiptLinkMutation();
  const [confirmCheckout] = useConfirmStripeBookingPaymentMutation();
  const {
    data: carsResponse,
    isLoading: carsLoading,
    isError: carsError,
    refetch: refetchCars,
  } = useGetMyCarsQuery();
  const {
    data: memberships = [],
    isLoading: membershipsLoading,
    isError: membershipsError,
    refetch: refetchMemberships,
  } = useGetCustomerMembershipsQuery();
  const {
    data: servicesResponse,
    isLoading: servicesLoading,
    isError: servicesError,
    refetch: refetchServices,
  } = useGetWashServicesQuery({ status: "Active", page: 1, limit: 100 });
  const {
    data: slotsResponse,
    isFetching: slotsFetching,
    isError: slotsError,
    refetch: refetchSlots,
  } = useGetWashServiceSlotsQuery(
    { serviceId: form.serviceId, from: form.startDate, to: form.endDate },
    {
      skip:
        !form.serviceId ||
        !form.startDate ||
        !form.endDate ||
        form.startDate > form.endDate,
    },
  );
  const [createBooking, createState] = useCreateBookingMutation();
  const [updateBooking, updateBookingState] = useUpdateBookingMutation();
  const slots = useMemo(() => slotsResponse?.data ?? [], [slotsResponse]);
  const {
    data: rescheduleSlotsResponse,
    isFetching: rescheduleSlotsFetching,
    isError: rescheduleSlotsError,
  } = useGetWashServiceSlotsQuery(
    {
      serviceId: idOf(rescheduleBooking?.serviceId),
      from: rescheduleDate,
      to: rescheduleDate,
    },
    {
      skip: !rescheduleBooking || !rescheduleDate,
    },
  );
  const rescheduleSlots = useMemo(
    () =>
      (rescheduleSlotsResponse?.data ?? []).filter(
        (slot: TAvailableSlot) => slot.isBooked === "available",
      ),
    [rescheduleSlotsResponse],
  );
  const paymentSessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!paymentSessionId) return;

    confirmCheckout({ sessionId: paymentSessionId })
      .unwrap()
      .then(() => {
        toast.success("Payment confirmed.");
        refetchBookings();
        window.history.replaceState({}, "", window.location.pathname);
      })
      .catch(() => {
        toast.error(
          "Payment is not confirmed yet. Refresh your bookings shortly.",
        );
        refetchBookings();
        window.history.replaceState({}, "", window.location.pathname);
      });
  }, [paymentSessionId, confirmCheckout, refetchBookings]);

  const startBookingPayment = async (bookingId: string) => {
    try {
      const checkout = await startCheckout({ bookingId }).unwrap();
      window.location.assign(checkout.data.url);
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(response.data?.message || "Unable to start online payment.");
    }
  };

  const downloadCashReceipt = async (bookingId: string) => {
    try {
      const result = await createReceiptLink(bookingId).unwrap();
      window.location.assign(result.url);
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(response.data?.message || "Cash receipt could not be opened.");
    }
  };

  const saveReschedule = async () => {
    if (!rescheduleBooking || !rescheduleDate || !rescheduleSlotId) {
      toast.error("Choose an available date and time.");
      return;
    }
    const slot = rescheduleSlots.find(
      (candidate: TAvailableSlot) => candidate._id === rescheduleSlotId,
    );
    if (!slot) {
      toast.error("That time slot is no longer available.");
      return;
    }
    try {
      await updateBooking({
        id: rescheduleBooking._id,
        body: {
          bookingDate: rescheduleDate,
          bookingTime: slot.startTime,
          slotId: slot._id,
        },
      }).unwrap();
      toast.success("Booking rescheduled.");
      setRescheduleBooking(null);
      setRescheduleSlotId("");
      refetchBookings();
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(response.data?.message || "Unable to reschedule booking.");
    }
  };

  const bookings = useMemo(
    () => getArray<CustomerBooking>(bookingsResponse),
    [bookingsResponse],
  );
  const totalBookings = bookingsResponse?.data?.meta?.total ?? bookings.length;
  const verifiedCars = useMemo(
    () =>
      getArray<CustomerCar>(carsResponse).filter(
        (car) =>
          car.verificationStatus === "VERIFIED" && car.status === "Active",
      ),
    [carsResponse],
  );
  const customerCars = useMemo(
    () => getArray<CustomerCar>(carsResponse),
    [carsResponse],
  );
  const historyBookings = useMemo(
    () =>
      historyCarId === "all"
        ? bookings
        : bookings.filter((booking) => idOf(booking.carId) === historyCarId),
    [bookings, historyCarId],
  );
  const selectedHistoryCar = customerCars.find(
    (car) => car._id === historyCarId,
  );
  const selectedCar = useMemo(
    () => verifiedCars.find((car) => car._id === form.carId),
    [verifiedCars, form.carId],
  );
  const rangeDates = useMemo(
    () => getDateRange(form.startDate, form.endDate),
    [form.startDate, form.endDate],
  );
  const availableSlotsByDate = useMemo(() => {
    const slotsByDate = new Map<string, TAvailableSlot[]>();
    for (const slot of slots) {
      const date = slot.date.slice(0, 10);
      const dateSlots = slotsByDate.get(date) ?? [];
      dateSlots.push(slot);
      slotsByDate.set(date, dateSlots);
    }
    return slotsByDate;
  }, [slots]);
  const selectedBookings = useMemo(
    () =>
      rangeDates.flatMap((date) => {
        const slot = (availableSlotsByDate.get(date) ?? []).find(
          (candidate) =>
            candidate.isBooked === "available" &&
            candidate._id === form.slotSelections[date],
        );
        return slot ? [{ date, slot }] : [];
      }),
    [availableSlotsByDate, form.slotSelections, rangeDates],
  );
  const datesWithAvailableSlots = useMemo(
    () =>
      rangeDates.filter((date) =>
        (availableSlotsByDate.get(date) ?? []).some(
          (slot) => slot.isBooked === "available",
        ),
      ),
    [availableSlotsByDate, rangeDates],
  );
  const eligibleMemberships = useMemo(() => {
    if (!selectedCar || selectedBookings.length === 0) return [];

    return memberships.filter((membership) => {
      const startDate = new Date(membership.startDate).getTime();
      const endDate = new Date(membership.endDate).getTime();
      const includedWashes = Math.max(
        0,
        Number(membership.includedWashes ?? 0),
      );
      const usedWashes = Math.max(0, Number(membership.usedWashes ?? 0));
      const reservedWashes = Math.max(
        0,
        Number(membership.reservedWashes ?? 0),
      );

      return (
        !membership.isDeleted &&
        membership.status === "Active" &&
        membership.paymentStatus === "Paid" &&
        idOf(membership.carId) === selectedCar._id &&
        idOf(membership.societyId) === idOf(selectedCar.societyId) &&
        idOf(membership.flatId) === idOf(selectedCar.flatId) &&
        Number.isFinite(startDate) &&
        Number.isFinite(endDate) &&
        selectedBookings.every(({ date }) => {
          const bookingDate = new Date(date).getTime();
          return (
            Number.isFinite(bookingDate) &&
            startDate <= bookingDate &&
            endDate >= bookingDate
          );
        }) &&
        includedWashes - usedWashes - reservedWashes > 0
      );
    });
  }, [memberships, selectedBookings, selectedCar]);
  const selectedMembership = eligibleMemberships.find(
    (membership) => membership._id === form.membershipId,
  );
  const isMembershipPayment =
    form.paymentType === "Membership" && Boolean(selectedMembership);
  const services = useMemo(
    () =>
      getArray<WashService>(servicesResponse).filter(
        (service) => service.status === "Active",
      ),
    [servicesResponse],
  );
  const openForm = () => {
    setForm({ ...emptyForm });
    setFormError("");
    setDialogOpen(true);
  };

  const closeForm = () => {
    if (createState.isLoading) return;
    setDialogOpen(false);
    setFormError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (
      !selectedCar ||
      !idOf(selectedCar.societyId) ||
      !idOf(selectedCar.flatId)
    ) {
      setFormError(
        "Choose one of your verified cars with its flat and society.",
      );
      return;
    }
    if (!form.serviceId || !form.startDate || !form.endDate) {
      setFormError("Select a service and a valid start and end date.");
      return;
    }
    if (form.startDate > form.endDate) {
      setFormError("The end date must be on or after the start date.");
      return;
    }
    if (slotsFetching || slotsError) {
      setFormError(
        slotsFetching
          ? "Wait for available time slots to finish loading."
          : "Unable to load available time slots. Please retry.",
      );
      return;
    }
    if (datesWithAvailableSlots.some((date) => !form.slotSelections[date])) {
      setFormError("Choose an available time slot for each available date.");
      return;
    }
    if (selectedBookings.length === 0) {
      setFormError("No dates in this range have an available time slot.");
      return;
    }
    if (form.paymentType === "Membership" && !selectedMembership) {
      setFormError(
        "Choose an eligible purchased membership for this car and date range.",
      );
      return;
    }

    if (form.paymentType === "Membership" && selectedMembership) {
      const remainingWashes =
        Number(selectedMembership.includedWashes ?? 0) -
        Number(selectedMembership.usedWashes ?? 0) -
        Number(selectedMembership.reservedWashes ?? 0);
      if (remainingWashes < selectedBookings.length) {
        setFormError(
          `This membership has ${remainingWashes} washes remaining, but ${selectedBookings.length} dates are selected. No bookings were sent.`,
        );
        return;
      }
    }

    const createdBookings: BookingNew[] = [];
    const failures: {
      date: string;
      message: string;
      kind: "booking" | "checkout";
    }[] = [];
    for (const { date, slot } of selectedBookings) {
      try {
        const created = await createBooking({
          societyId: idOf(selectedCar.societyId),
          flatId: idOf(selectedCar.flatId),
          carId: selectedCar._id,
          serviceId: form.serviceId,
          slotId: slot._id,
          bookingDate: date,
          bookingTime: slot.startTime,
          paymentType: form.paymentType,
          ...(form.paymentType === "Individual"
            ? { paymentMethod: form.paymentMethod }
            : {}),
          ...(form.paymentType === "Membership" && selectedMembership
            ? { membershipId: selectedMembership._id }
            : {}),
          remarks: form.remarks.trim(),
        }).unwrap();
        createdBookings.push(created.data);
      } catch (error) {
        const response = error as {
          data?: { message?: string; error?: { message?: string } };
        };
        failures.push({
          date,
          message:
            response.data?.message ||
            response.data?.error?.message ||
            "Booking could not be created.",
          kind: "booking",
        });
      }
    }

    refetchBookings();
    if (form.paymentType === "Membership") refetchMemberships();

    if (form.paymentType === "Individual") {
      for (const booking of createdBookings) {
        if (booking.amountPayable > 0 && form.paymentMethod === "Stripe") {
          try {
            const checkout = await startCheckout({
              bookingId: booking._id,
            }).unwrap();
            window.open(checkout.data.url, "_blank", "noopener,noreferrer");
          } catch {
            failures.push({
              date: booking.bookingDate.slice(0, 10),
              message: "Booking created, but checkout could not be opened.",
              kind: "checkout",
            });
          }
        }
      }
    }

    if (createdBookings.length > 0) {
      setDialogOpen(false);
      setForm({ ...emptyForm });
    } else {
      setFormError(
        (failures[0]
          ? `${formatDate(failures[0].date)}: ${failures[0].message}`
          : "") || "Unable to create your bookings. Please try again.",
      );
      return;
    }

    const skippedCount = rangeDates.length - datesWithAvailableSlots.length;
    if (failures.length > 0) {
      const bookingFailureCount = failures.filter(
        (failure) => failure.kind === "booking",
      ).length;
      const checkoutFailureCount = failures.filter(
        (failure) => failure.kind === "checkout",
      ).length;
      const failureDetails = failures
        .map((failure) => `${formatDate(failure.date)}: ${failure.message}`)
        .join(" · ");
      toast.error(
        `Created ${createdBookings.length}; ${bookingFailureCount} booking(s) failed; ${checkoutFailureCount} checkout(s) could not be opened; ${skippedCount} date(s) skipped with no available slot. ${failureDetails}`,
      );
    } else {
      toast.success(
        `Created ${createdBookings.length} booking(s); skipped ${skippedCount} date(s) with no available slot.`,
      );
    }
  };

  const retryLoad = () => {
    refetchBookings();
    refetchCars();
    refetchMemberships();
    refetchServices();
    if (form.serviceId && form.startDate && form.endDate) refetchSlots();
  };

  const loading = bookingsLoading || carsLoading || servicesLoading;
  const hasLoadError = bookingsError || carsError || servicesError;

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Book a wash for your verified car and follow its progress.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={retryLoad}
            disabled={bookingsFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${bookingsFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button type="button" onClick={openForm}>
            <Droplets className="mr-2 h-4 w-4" />
            Book a Wash
          </Button>
        </div>
      </div>

      {hasLoadError && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-red-800">
              Unable to load your booking information
            </p>
            <p className="mt-1 text-sm text-red-700">
              Please check your connection and try again.
            </p>
          </div>
          <Button variant="outline" onClick={retryLoad}>
            Try again
          </Button>
        </div>
      )}

      {verifiedCars.length === 0 && !carsLoading && !carsError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Add a car and wait for it to be verified before booking a wash.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total bookings", totalBookings],
          [
            "Pending",
            bookings.filter((booking) => booking.status === "Pending").length,
          ],
          [
            "In progress",
            bookings.filter((booking) =>
              ["Confirmed", "InProgress"].includes(booking.status),
            ).length,
          ],
          [
            "Completed",
            bookings.filter((booking) => booking.status === "Completed").length,
          ],
        ].map(([title, count]) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <CardDescription>{title}</CardDescription>
              <CardTitle className="text-2xl">
                {loading ? "…" : count}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking history</CardTitle>
          <CardDescription>
            Select a car to see its cleaning status, photos and wash history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 space-y-3">
            <div className="max-w-md space-y-2">
              <Label htmlFor="history-car-filter">Car history</Label>
              <Select value={historyCarId} onValueChange={setHistoryCarId}>
                <SelectTrigger id="history-car-filter">
                  <SelectValue placeholder="Select a car" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cars</SelectItem>
                  {customerCars.map((car) => (
                    <SelectItem key={car._id} value={car._id}>
                      {labelOf(car)}
                      {car.make || car.model
                        ? ` · ${[car.make, car.model].filter(Boolean).join(" ")}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedHistoryCar ? (
              <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-4">
                <p>
                  <span className="text-slate-500">Car:</span>{" "}
                  <strong>{labelOf(selectedHistoryCar)}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Total washes:</span>{" "}
                  <strong>{historyBookings.length}</strong>
                </p>
                <p>
                  <span className="text-slate-500">In progress:</span>{" "}
                  <strong>
                    {
                      historyBookings.filter(
                        (booking) =>
                          ["Working", "Paused"].includes(
                            booking.workStatus || "",
                          ) || booking.status === "InProgress",
                      ).length
                    }
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Completed:</span>{" "}
                  <strong>
                    {
                      historyBookings.filter(
                        (booking) =>
                          booking.status === "Completed" ||
                          booking.workStatus === "Completed",
                      ).length
                    }
                  </strong>
                </p>
              </div>
            ) : null}
          </div>
          {bookingsLoading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Loading your bookings…
            </p>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CalendarDays className="h-10 w-10 text-slate-300" />
              <h2 className="mt-3 font-semibold text-slate-800">
                No bookings yet
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Schedule your first car wash to see it here.
              </p>
              <Button
                className="mt-4"
                onClick={openForm}
                disabled={verifiedCars.length === 0}
              >
                Book a Wash
              </Button>
            </div>
          ) : historyBookings.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No wash history found for this car yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Car / Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyBookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(booking.bookingDate)}
                        <div className="text-xs text-muted-foreground">
                          {booking.bookingTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {booking.serviceNameSnapshot ||
                            labelOf(booking.serviceId)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Cleaning:{" "}
                          {
                            {
                              NotStarted: "Not started",
                              Working: "In progress",
                              Paused: "Paused",
                              Completed: "Completed",
                            }[booking.workStatus || "NotStarted"]
                          }
                        </div>
                        {booking.status === "Completed" && (
                          <BookingReview booking={booking} />
                        )}
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
                          <div>
                            <div className="font-medium">
                              {labelOf(booking.carId)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {labelOf(booking.societyId)} ·{" "}
                              {labelOf(booking.flatId)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{booking.paymentType}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {booking.amountPayable === 0
                          ? "Covered by membership"
                          : `₹${booking.amountPayable}`}
                      </TableCell>
                      <TableCell>
                        <div>{booking.paymentStatus}</div>
                        {booking.paymentMethod === "Cash" && (
                          <div className="text-xs text-muted-foreground">
                            Cash: {booking.cashCollectionStatus ||
                              (booking.paymentStatus === "Paid"
                                ? "Received"
                                : "NotRecorded")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                            booking.status,
                          )}`}
                        >
                          {booking.status === "InProgress"
                            ? "In progress"
                            : booking.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-40 flex-wrap justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailBooking(booking)}
                          >
                            Details
                          </Button>
                          {booking.paymentType === "Individual" &&
                            booking.paymentStatus !== "Paid" &&
                            booking.paymentMethod !== "Cash" &&
                            !["Cancelled", "Completed"].includes(
                              booking.status,
                            ) && (
                              <Button
                                size="sm"
                                disabled={checkoutState.isLoading}
                                onClick={() => startBookingPayment(booking._id)}
                              >
                                {checkoutState.isLoading ? "Opening…" : "Pay"}
                              </Button>
                            )}
                          {booking.paymentMethod === "Cash" &&
                            booking.paymentStatus === "Paid" &&
                            (booking.cashCollectionStatus === "Received" ||
                              (!booking.cashCollectionStatus &&
                                booking.paymentStatus === "Paid")) && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={receiptState.isLoading}
                                onClick={() => downloadCashReceipt(booking._id)}
                              >
                                {receiptState.isLoading ? "Preparing…" : "Receipt PDF"}
                              </Button>
                            )}
                          {!["Cancelled", "Completed", "InProgress"].includes(
                            booking.status,
                          ) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRescheduleBooking(booking);
                                setRescheduleDate(today());
                                setRescheduleSlotId("");
                              }}
                            >
                              Reschedule
                            </Button>
                          )}
                        </div>
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
        open={Boolean(detailBooking)}
        onOpenChange={(open) => {
          if (!open) setDetailBooking(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking details & work timeline</DialogTitle>
            <DialogDescription>
              Worker updates and session start/stop times are shown in India
              time.
            </DialogDescription>
          </DialogHeader>
          {detailBooking ? (
            <div className="space-y-5">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Booking ID", detailBooking._id],
                  [
                    "Service",
                    detailBooking.serviceNameSnapshot ||
                      labelOf(detailBooking.serviceId),
                  ],
                  [
                    "Scheduled",
                    `${formatDate(detailBooking.bookingDate)} · ${detailBooking.bookingTime}`,
                  ],
                  ["Vehicle", labelOf(detailBooking.carId)],
                  [
                    "Location",
                    `${labelOf(detailBooking.societyId)} · ${labelOf(detailBooking.flatId)}`,
                  ],
                  ["Booking status", detailBooking.status],
                  ["Work status", detailBooking.workStatus || "Not started"],
                  [
                    "Payment",
                    `${detailBooking.paymentType} · ${detailBooking.paymentStatus}`,
                  ],
                  ...(detailBooking.paymentMethod === "Cash"
                    ? [[
                        "Cash collection",
                        detailBooking.cashCollectionStatus ||
                          (detailBooking.paymentStatus === "Paid"
                            ? "Received"
                            : "NotRecorded"),
                      ]]
                    : []),
                  [
                    "Amount",
                    `₹${Number(detailBooking.amountPayable || 0).toFixed(2)}`,
                  ],
                  ["Booking note", detailBooking.remarks || "No booking note"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="break-words font-medium text-slate-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <section>
                <h3 className="mb-2 font-semibold">Cleaning photos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Before cleaning", detailBooking.beforePhoto],
                    ["After cleaning", detailBooking.afterPhoto],
                  ].map(([label, photo]) => (
                    <figure key={label}>
                      <figcaption className="mb-1 text-sm text-slate-500">
                        {label}
                      </figcaption>
                      {photo ? (
                        <img
                          src={photo}
                          alt={label}
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
              <section>
                <h3 className="mb-2 font-semibold">Cleaning checklist</h3>
                <ul className="grid gap-2 text-sm sm:grid-cols-2">
                  {[
                    ["Exterior wash", "exteriorWash"],
                    ["Interior cleaning", "interiorCleaning"],
                    ["Dashboard", "dashboard"],
                    ["Tyre dressing", "tyreDressing"],
                    ["Vacuum cleaning", "vacuumCleaning"],
                  ].map(([label, key]) => {
                    const checked =
                      detailBooking.cleaningChecklist?.[
                        key as keyof NonNullable<
                          BookingNew["cleaningChecklist"]
                        >
                      ] ?? false;
                    return (
                      <li
                        key={key}
                        className="flex justify-between rounded bg-slate-50 px-3 py-2"
                      >
                        <span>{label}</span>
                        <span
                          className={
                            checked
                              ? "font-medium text-emerald-700"
                              : "text-slate-500"
                          }
                        >
                          {checked ? "Done" : "Pending"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <section>
                <h3 className="mb-2 font-semibold">Worker notes</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-600">
                  {detailBooking.workerNotes || "No worker notes"}
                </p>
              </section>
              <section>
                <h3 className="mb-2 font-semibold">
                  Work timeline (India time)
                </h3>
                <ol className="space-y-3 border-l pl-4 text-sm">
                  {(detailBooking.workSessions || []).map((session, index) => (
                    <li key={`${session.startedAt}-${index}`}>
                      <p className="font-medium">
                        {index === 0 ? "Work started" : "Work resumed"}
                      </p>
                      <p className="text-slate-500">
                        {formatWorkTimestamp(session.startedAt)}
                      </p>
                      {session.endedAt ? (
                        <>
                          <p className="mt-1 font-medium">
                            {detailBooking.workStatus === "Completed" &&
                            index ===
                              (detailBooking.workSessions?.length || 0) - 1
                              ? "Work completed"
                              : "Work stopped / paused"}
                          </p>
                          <p className="text-slate-500">
                            {formatWorkTimestamp(session.endedAt)} · Session
                            duration:{" "}
                            {formatWorkDuration(session.durationSeconds)}
                          </p>
                        </>
                      ) : (
                        <p className="text-emerald-700">
                          Active since {formatWorkTimestamp(session.startedAt)}
                        </p>
                      )}
                    </li>
                  ))}
                  {!detailBooking.workSessions?.length &&
                  detailBooking.workCompletedAt ? (
                    <li>
                      <p className="font-medium">Work completed</p>
                      <p className="text-slate-500">
                        {formatWorkTimestamp(detailBooking.workCompletedAt)}
                      </p>
                    </li>
                  ) : null}
                  {!detailBooking.workSessions?.length &&
                  !detailBooking.workCompletedAt ? (
                    <li className="text-slate-500">
                      No work sessions recorded yet.
                    </li>
                  ) : null}
                </ol>
                <p className="mt-3 text-sm font-medium">
                  Total working time:{" "}
                  {formatWorkDuration(detailBooking.totalWorkingSeconds)}
                </p>
              </section>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailBooking(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rescheduleBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setRescheduleBooking(null);
            setRescheduleSlotId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule your wash</DialogTitle>
            <DialogDescription>
              Pick a new available slot. Your current slot remains held until
              the new schedule is saved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-reschedule-date">New date</Label>
              <input
                id="customer-reschedule-date"
                type="date"
                min={today()}
                value={rescheduleDate}
                onChange={(event) => {
                  setRescheduleDate(event.target.value);
                  setRescheduleSlotId("");
                }}
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-reschedule-slot">Available time</Label>
              <Select
                value={rescheduleSlotId}
                onValueChange={setRescheduleSlotId}
                disabled={
                  rescheduleSlotsFetching ||
                  rescheduleSlotsError ||
                  !rescheduleSlots.length
                }
              >
                <SelectTrigger id="customer-reschedule-slot">
                  <SelectValue
                    placeholder={
                      rescheduleSlotsFetching
                        ? "Loading available times..."
                        : rescheduleSlotsError
                          ? "Unable to load times"
                          : rescheduleSlots.length
                            ? "Select a time"
                            : "No available times"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {rescheduleSlots.map((slot: TAvailableSlot) => (
                    <SelectItem key={slot._id} value={slot._id}>
                      {slot.startTime} – {slot.endTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleBooking(null)}
              disabled={updateBookingState.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={saveReschedule}
              disabled={
                !rescheduleSlotId ||
                updateBookingState.isLoading ||
                rescheduleSlotsFetching
              }
            >
              {updateBookingState.isLoading ? "Saving..." : "Save schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) setDialogOpen(true);
          else closeForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Book a car wash</DialogTitle>
              <DialogDescription>
                Select a verified car and an active service to schedule your
                wash.
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="booking-car">Car *</Label>
              <Select
                value={form.carId}
                onValueChange={(carId) =>
                  setForm((current) => ({
                    ...current,
                    carId,
                    paymentType: "Individual",
                    membershipId: "",
                  }))
                }
              >
                <SelectTrigger id="booking-car">
                  <SelectValue placeholder="Choose your verified car" />
                </SelectTrigger>
                <SelectContent>
                  {verifiedCars.map((car) => (
                    <SelectItem key={car._id} value={car._id}>
                      {[car.registrationNumber, car.make, car.model]
                        .filter(Boolean)
                        .join(" · ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.carId && (
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {selectedCar?.imageUrl ? (
                    <img
                      src={selectedCar.imageUrl}
                      alt={`${selectedCar.registrationNumber} car`}
                      className="h-16 w-24 rounded object-cover"
                    />
                  ) : null}
                  <span>
                    {labelOf(selectedCar?.societyId)} ·{" "}
                    {labelOf(selectedCar?.flatId)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-service">Wash service *</Label>
              <Select
                value={form.serviceId}
                onValueChange={(serviceId) =>
                  setForm((current) => ({
                    ...current,
                    serviceId,
                    slotSelections: {},
                    paymentType: "Individual",
                    membershipId: "",
                  }))
                }
              >
                <SelectTrigger id="booking-service">
                  <SelectValue placeholder="Choose a wash service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service._id} value={service._id}>
                      {service.name} · ₹{service.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.serviceId && (
                <p className="text-xs text-slate-500">
                  {
                    services.find((service) => service._id === form.serviceId)
                      ?.description
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-payment-type">Booking type *</Label>
              <Select
                value={form.paymentType}
                onValueChange={(paymentType: "Individual" | "Membership") =>
                  setForm((current) => ({
                    ...current,
                    paymentType,
                    membershipId:
                      paymentType === "Membership" ? current.membershipId : "",
                  }))
                }
              >
                <SelectTrigger id="booking-payment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Pay individually</SelectItem>
                  {eligibleMemberships.length > 0 && (
                    <SelectItem value="Membership">
                      Use purchased membership
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {eligibleMemberships.length > 0 ? (
                form.paymentType === "Membership" && (
                  <div className="space-y-2">
                    <Label htmlFor="booking-membership">
                      Eligible membership *
                    </Label>
                    <Select
                      value={form.membershipId}
                      onValueChange={(membershipId) =>
                        setForm((current) => ({ ...current, membershipId }))
                      }
                    >
                      <SelectTrigger id="booking-membership">
                        <SelectValue placeholder="Choose a purchased membership" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleMemberships.map((membership) => {
                          const plan = membership.planId;
                          const planName =
                            typeof plan === "object" && plan.name
                              ? plan.name
                              : "Purchased membership";
                          const remainingWashes =
                            Number(membership.includedWashes ?? 0) -
                            Number(membership.usedWashes ?? 0) -
                            Number(membership.reservedWashes ?? 0);

                          return (
                            <SelectItem
                              key={membership._id}
                              value={membership._id}
                            >
                              {planName} · {remainingWashes} washes remaining
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )
              ) : (
                <p className="text-xs text-slate-500">
                  {membershipsLoading
                    ? "Loading your purchased memberships…"
                    : membershipsError
                      ? "Could not load memberships. Try refreshing before booking."
                      : selectedBookings.length === 0
                        ? "Choose available time slots first to check membership eligibility."
                        : "No active, paid membership with enough washes for the selected dates matches this car."}
                </p>
              )}
            </div>
            {form.paymentType === "Individual" && (
              <div className="space-y-2">
                <Label htmlFor="booking-individual-payment">
                  Payment method *
                </Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(paymentMethod: "Stripe" | "Cash") =>
                    setForm((current) => ({ ...current, paymentMethod }))
                  }
                >
                  <SelectTrigger id="booking-individual-payment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stripe">Pay online</SelectItem>
                    <SelectItem value="Cash">Pay cash to worker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label>Date range and time slots *</Label>
                <p className="mt-1 text-xs text-slate-500">
                  Choose a start and end date, inclusive, then choose a slot for
                  each date with availability. Dates without an available slot
                  are skipped.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="booking-start-date">Start date *</Label>
                  <input
                    id="booking-start-date"
                    type="date"
                    min={today()}
                    value={form.startDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        startDate: event.target.value,
                        endDate:
                          current.endDate &&
                          current.endDate < event.target.value
                            ? event.target.value
                            : current.endDate,
                        slotSelections: {},
                        paymentType: "Individual",
                        membershipId: "",
                      }))
                    }
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking-end-date">End date *</Label>
                  <input
                    id="booking-end-date"
                    type="date"
                    min={form.startDate || today()}
                    value={form.endDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        endDate: event.target.value,
                        slotSelections: {},
                        paymentType: "Individual",
                        membershipId: "",
                      }))
                    }
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
              </div>
              {!form.serviceId || !form.startDate || !form.endDate ? (
                <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">
                  Select a service and date range to see available times.
                </p>
              ) : slotsFetching ? (
                <p className="p-3 text-sm text-slate-500">
                  Loading time slots…
                </p>
              ) : slotsError ? (
                <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">
                    Could not load slots for this date range.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => refetchSlots()}
                  >
                    Retry
                  </Button>
                </div>
              ) : form.startDate > form.endDate ? (
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                  The end date must be on or after the start date.
                </p>
              ) : datesWithAvailableSlots.length === 0 ? (
                <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">
                  No dates in this range have an available time slot; 0 bookings
                  will be created and {rangeDates.length} date(s) will be
                  skipped.
                </p>
              ) : (
                <div className="space-y-3">
                  {datesWithAvailableSlots.map((date) => {
                    const dateSlots = availableSlotsByDate.get(date) ?? [];
                    const selectedSlotId = form.slotSelections[date] ?? "";
                    return (
                      <div
                        key={date}
                        className="space-y-2 rounded-lg border border-slate-200 p-3"
                      >
                        <Label htmlFor={`booking-slot-${date}`}>
                          {new Date(`${date}T12:00:00`).toLocaleDateString(
                            undefined,
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </Label>
                        <Select
                          value={selectedSlotId}
                          onValueChange={(slotId) =>
                            setForm((current) => ({
                              ...current,
                              slotSelections: {
                                ...current.slotSelections,
                                [date]: slotId,
                              },
                            }))
                          }
                        >
                          <SelectTrigger id={`booking-slot-${date}`}>
                            <SelectValue placeholder="Choose an available time" />
                          </SelectTrigger>
                          <SelectContent>
                            {dateSlots
                              .filter((slot) => slot.isBooked === "available")
                              .map((slot) => (
                                <SelectItem key={slot._id} value={slot._id}>
                                  {slot.startTime} – {slot.endTime}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                  {rangeDates.length > datesWithAvailableSlots.length && (
                    <p className="text-xs text-slate-500">
                      {rangeDates.length - datesWithAvailableSlots.length}{" "}
                      date(s) have no available slot and will be skipped.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-remarks">Instructions (optional)</Label>
              <Textarea
                id="booking-remarks"
                maxLength={1000}
                placeholder="Anything the wash team should know?"
                value={form.remarks}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    remarks: event.target.value,
                  }))
                }
              />
            </div>

            {services.find((service) => service._id === form.serviceId) && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <span className="text-slate-500">
                  {isMembershipPayment ? "Covered by membership" : "Amount due"}
                </span>
                <span className="float-right font-semibold text-slate-900">
                  {isMembershipPayment
                    ? "₹0"
                    : `₹${services.find((service) => service._id === form.serviceId)?.price}`}
                </span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={createState.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createState.isLoading ||
                  verifiedCars.length === 0 ||
                  services.length === 0
                }
              >
                {createState.isLoading ? "Booking…" : "Confirm booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerBookings;
