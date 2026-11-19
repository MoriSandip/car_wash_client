import { useGetMyCustomerProfileQuery } from "@/redux/features/customer/customerApi";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  CarFront,
  Droplets,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useGetBookingsQuery,
  type BookingNew,
} from "@/redux/features/bookingNew/bookingNewApi";
import { useGetMyCarsQuery } from "@/redux/features/car/carApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ListImage from "@/components/ListImage";

type CustomerBookingSummary = BookingNew;

const getArray = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) return response as T[];
  if (!response || typeof response !== "object") return [];

  const body = response as {
    data?: unknown;
    result?: unknown;
    results?: unknown;
    docs?: unknown;
    items?: unknown;
  };
  const candidates = [
    body.data,
    body.result,
    body.results,
    body.docs,
    body.items,
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

const CustomerDashboard = () => {
  const {
    data: profileResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMyCustomerProfileQuery();
  const { data: bookingsResponse, isLoading: bookingsLoading, isError: bookingsError } =
    useGetBookingsQuery({ page: 1, limit: 100 });
  const { data: carsResponse, isLoading: carsLoading } = useGetMyCarsQuery();

  const bookings = getArray<CustomerBookingSummary>(bookingsResponse);
  const cars = getArray<{ _id: string }>(carsResponse);

  const payload = profileResponse?.data as
    | {
        name?: string;
        email?: string;
      }
    | undefined;

  const stats = [
    {
      title: "My Bookings",
      value: bookingsLoading || bookingsError
        ? "—"
        : String(bookingsResponse?.data?.meta?.total ?? bookings.length),
      description: "Your total car wash bookings",
      icon: ClipboardList,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      title: "Pending",
      value: bookingsLoading || bookingsError
        ? "—"
        : String(bookings.filter((booking) => booking.status === "Pending").length),
      description: "Bookings awaiting service",
      icon: Clock3,
      iconClass: "bg-amber-50 text-amber-600",
    },
    {
      title: "Completed",
      value: bookingsLoading || bookingsError
        ? "—"
        : String(bookings.filter((booking) => booking.status === "Completed").length),
      description: "Successfully completed washes",
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "My Cars",
      value: carsLoading ? "…" : String(cars.length),
      description: "Your registered vehicles",
      icon: CarFront,
      iconClass: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* Page heading */}
    

      {/* Profile greeting */}
    

      {/* API error */}
      {isError && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-red-800">
              Unable to load your dashboard
            </p>
            <p className="mt-1 text-sm text-red-600">
              Please check your connection and try again.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>
                  <h2 className="mt-3 text-3xl font-bold text-slate-900">
                    {isLoading ? "..." : item.value}
                  </h2>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            to="/customer/book-service"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Droplets className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              Book a Car Wash
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose a service and schedule your wash.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              Book Now <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/customer/bookings"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              My Bookings
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Check your booking details and service status.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              View Bookings <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/customer/car"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <CarFront className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              My Cars
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              View and manage your registered vehicles.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              Manage Cars <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Bookings
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your latest car wash appointments.
            </p>
          </div>

          <Link
            to="/customer/bookings"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            View All Bookings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {bookingsError ? (
          <p className="px-5 py-10 text-center text-sm text-red-600">
            Unable to load your bookings. Open My Bookings to retry.
          </p>
        ) : bookingsLoading ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Loading your bookings…
          </p>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <ClipboardList className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-800">
              No bookings yet
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Book your first wash and track its status here.
            </p>
            <Link
              to="/customer/book-service"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Make Your First Booking
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & time</TableHead>
                  <TableHead>Service / car</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.slice(0, 5).map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(booking.bookingDate).toLocaleDateString()}{" "}
                      <span className="text-slate-500">· {booking.bookingTime}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {typeof booking.carId !== "string" ? (
                          <ListImage
                            source={booking.carId?.imageUrl}
                            alt={`${booking.carId?.registrationNumber || "Car"} image`}
                            className="h-10 w-14"
                          />
                        ) : null}
                        <div>
                          <p className="font-medium text-slate-900">
                            {booking.serviceNameSnapshot || "Car wash"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {typeof booking.carId === "string"
                              ? "Car"
                              : booking.carId?.registrationNumber || "Car"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p>{booking.paymentType}</p>
                      <p className="text-xs text-slate-500">
                        {booking.paymentStatus}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {booking.status === "InProgress"
                          ? "In progress"
                          : booking.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
