import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useGetWorkerDashboardQuery } from "@/redux/features/worker/workerApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ListImage from "@/components/ListImage";

const WorkerDashboard = () => {
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetWorkerDashboardQuery(undefined);

  const dashboard = response?.data;

  const stats = [
    {
      title: "Assigned Bookings",
      value: dashboard?.assignedBookings ?? 0,
      description: "Total active jobs assigned to you",
      icon: ClipboardList,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      title: "Pending Jobs",
      value: dashboard?.pendingJobs ?? 0,
      description: "Jobs waiting to start",
      icon: Clock3,
      iconClass: "bg-amber-50 text-amber-600",
    },
    {
      title: "Completed Jobs",
      value: dashboard?.completedJobs ?? 0,
      description: "Successfully completed",
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Today's Jobs",
      value: dashboard?.todayJobs ?? 0,
      description: "Scheduled for today",
      icon: CalendarDays,
      iconClass: "bg-purple-50 text-purple-600",
    },
  ];

  const recentBookings = dashboard?.recentBookings ?? [];

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* Page heading */}
     

      {/* API error */}
      {isError && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-red-800">
              Unable to load dashboard
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
                    {isLoading ? "..." : isError ? "—" : item.value}
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

      {/* Recent assigned jobs */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              My Assigned Jobs
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your recently assigned bookings.
            </p>
          </div>

          <Link
            to="/bookings"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            View All Bookings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading your assigned jobs...
            </div>
          ) : isError ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Unable to load assigned jobs.
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <ClipboardList className="h-7 w-7 text-slate-400" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No assigned jobs yet
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                New bookings assigned to you will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking: any) => {
              const society =
                typeof booking.societyId === "object"
                  ? booking.societyId
                  : null;

              const flat =
                typeof booking.flatId === "object"
                  ? booking.flatId
                  : null;

              const car =
                typeof booking.carId === "object"
                  ? booking.carId
                  : null;

              const service =
                typeof booking.serviceId === "object"
                  ? booking.serviceId
                  : null;

              const bookingDate = booking.bookingDate
                ? new Date(booking.bookingDate).toLocaleDateString()
                : "—";

              const statusClass: Record<string, string> = {
                Pending: "bg-amber-50 text-amber-700",
                Confirmed: "bg-blue-50 text-blue-700",
                InProgress: "bg-purple-50 text-purple-700",
                Completed: "bg-emerald-50 text-emerald-700",
                Cancelled: "bg-red-50 text-red-700",
              };

              return (
                  <TableRow key={booking._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ListImage
                          source={car?.imageUrl}
                          alt={`${car?.registrationNumber || "Car"} image`}
                          className="h-10 w-14"
                        />
                        <div>
                          <p className="font-medium text-slate-900">
                            {booking.serviceNameSnapshot || service?.name || "Car Wash"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {car?.carNumber || car?.registrationNumber || car?.vehicleNumber || "Car"}
                            {" · "}{bookingDate} · {booking.bookingTime || "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {society?.name || society?.societyName || "Society"}
                      {" · "}{flat?.flatNumber || flat?.name || "Flat"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          statusClass[booking.status] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {booking.status || "Pending"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                      ₹{Number(booking.amountPayable ?? 0).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
              );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {!isLoading && !isError && recentBookings.length > 0 && (
          <div className="border-t border-slate-100 p-4 text-center">
            <Link
              to="/bookings"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-800"
            >
              See all bookings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
