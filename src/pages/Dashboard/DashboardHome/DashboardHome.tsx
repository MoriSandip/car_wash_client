import { useMemo } from "react";
import {
  Activity,
  Building2,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  Droplets,
  House,
  RefreshCw,
  Users,
  UserRound,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type BookingStats,
  useGetBookingStatsQuery,
  useGetBookingsQuery,
} from "@/redux/features/bookingNew/bookingNewApi";
import { useGetCarStatsQuery } from "@/redux/features/car/carApi";
import { useGetCustomersQuery } from "@/redux/features/customer/customerApi";
import { useGetFlatsQuery } from "@/redux/features/flat/flatApi";
import { useGetMembershipStatsQuery } from "@/redux/features/membership/membershipApi";
import { useGetPlansQuery } from "@/redux/features/plan/planApi";
import { useGetSocietiesQuery } from "@/redux/features/society/societyApi";
import { useGetWashServiceStatsQuery } from "@/redux/features/washService/washServiceApi";
import { useGetWorkerStatsQuery } from "@/redux/features/worker/workerApi";

type Booking = {
  _id: string;
  bookingDate: string;
  bookingTime: string;
  serviceNameSnapshot: string;
  status: string;
  paymentStatus: string;
  paymentType: string;
  amountPayable: number;
  carId?: string | { registrationNumber?: string };
};

type Stats = {
  total?: number;
  active?: number;
  inactive?: number;
  pending?: number;
  verified?: number;
  rejected?: number;
  expired?: number;
  cancelled?: number;
};

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const bookingStatusColors: Record<string, string> = {
  Pending: chartColors[0],
  Confirmed: chartColors[1],
  InProgress: chartColors[2],
  Completed: chartColors[3],
  Cancelled: "hsl(var(--muted-foreground))",
};

function extractArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "object" || value === null) return [];

  const record = value as Record<string, unknown>;
  for (const key of ["data", "result", "results", "docs", "items"]) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = extractArray(candidate);
      if (nested.length) return nested;
    }
  }

  return [];
}

function dateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatBookingStatus(status: string) {
  return status === "InProgress" ? "In progress" : status;
}

function MetricCard({
  title,
  value,
  caption,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  caption: string;
  icon: typeof Activity;
  color: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {loading ? "…" : value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
        </div>
        <span className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

export function DashboardHome() {
  const { rangeStart, rangeEnd } = useMemo(() => {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 6);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    return { rangeStart: start, rangeEnd: end };
  }, []);

  const bookingsQuery = useGetBookingsQuery({
    from: rangeStart.toISOString(),
    to: rangeEnd.toISOString(),
    page: 1,
    limit: 100,
  });
  const bookingStatsQuery = useGetBookingStatsQuery();
  const carStatsQuery = useGetCarStatsQuery();
  const customerQuery = useGetCustomersQuery();
  const flatQuery = useGetFlatsQuery();
  const membershipQuery = useGetMembershipStatsQuery();
  const planQuery = useGetPlansQuery();
  const societyQuery = useGetSocietiesQuery();
  const serviceQuery = useGetWashServiceStatsQuery();
  const workerQuery = useGetWorkerStatsQuery();

  const bookingList = (bookingsQuery.data?.data?.data ?? []) as Booking[];
  const stats = (value: unknown): Stats => {
    if (typeof value !== "object" || value === null) return {};
    return value as Stats;
  };
  const bookingCounts: BookingStats = bookingStatsQuery.data?.data ?? {};
  const dailyBookingCounts = new Map(
    (bookingCounts.dailyBookings ?? []).map(({ date, bookings }) => [
      date,
      bookings,
    ]),
  );
  const weeklyTotals = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(rangeStart);
    date.setUTCDate(rangeStart.getUTCDate() + index);
    const key = dateKey(date);
    return {
      date: key,
      label: date.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }),
      bookings: dailyBookingCounts.get(key) ?? 0,
    };
  });
  const carStats = stats(carStatsQuery.data?.data);
  const membershipStats = stats(membershipQuery.data);
  const serviceStats = stats(serviceQuery.data?.data);
  const workerStats = stats(workerQuery.data);
  const customers = (customerQuery.data ?? []);
  const societyCount = extractArray(societyQuery.data).length;
  const flatCount = extractArray(flatQuery.data).length;
  const planCount = extractArray(planQuery.data).length;

  const bookingStatusData = [
    { name: "Pending", value: bookingCounts.pending ?? 0 },
    { name: "Confirmed", value: bookingCounts.confirmed ?? 0 },
    { name: "In progress", value: bookingCounts.inProgress ?? 0 },
    { name: "Completed", value: bookingCounts.completed ?? 0 },
    { name: "Cancelled", value: bookingCounts.cancelled ?? 0 },
  ];

  const membershipStatusData = [
    { name: "Active", value: membershipStats.active ?? 0 },
    { name: "Pending", value: membershipStats.pending ?? 0 },
    { name: "Expired", value: membershipStats.expired ?? 0 },
    { name: "Cancelled", value: membershipStats.cancelled ?? 0 },
  ];

  const queries = [
    { name: "Bookings", query: bookingsQuery },
    { name: "Booking statistics", query: bookingStatsQuery },
    { name: "Cars", query: carStatsQuery },
    { name: "Customers", query: customerQuery },
    { name: "Flats", query: flatQuery },
    { name: "Memberships", query: membershipQuery },
    { name: "Plans", query: planQuery },
    { name: "Societies", query: societyQuery },
    { name: "Wash services", query: serviceQuery },
    { name: "Workers", query: workerQuery },
  ];
  const errors = queries.filter(({ query }) => query.isError);
  const loading = queries.some(({ query }) => query.isLoading);
  const refresh = () => {
    void Promise.all(queries.map(({ query }) => query.refetch()));
  };

  return (
    <main className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      

      {errors.length > 0 && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Could not load {errors.map(({ name }) => name.toLowerCase()).join(", ")}{" "}
          data. Use Refresh to try again.
        </div>
      )}

      <section
        aria-label="Business summary"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          title="Total bookings"
          value={bookingCounts.total ?? 0}
          caption="All-time bookings"
          icon={CalendarDays}
          color="bg-blue-500/10 text-blue-600"
          loading={loading}
        />
        <MetricCard
          title="Pending bookings"
          value={bookingCounts.pending ?? 0}
          caption="Awaiting confirmation"
          icon={Clock3}
          color="bg-amber-500/10 text-amber-600"
          loading={loading}
        />
        <MetricCard
          title="Completed washes"
          value={bookingCounts.completed ?? 0}
          caption="Successfully completed"
          icon={CheckCircle2}
          color="bg-green-500/10 text-green-600"
          loading={loading}
        />
        <MetricCard
          title="Individual revenue"
          value={formatCurrency(bookingCounts.individualPaidRevenue ?? 0)}
          caption="Paid individual bookings"
          icon={CreditCard}
          color="bg-violet-500/10 text-violet-600"
          loading={loading}
        />
        <MetricCard
          title="Registered cars"
          value={carStats.total ?? 0}
          caption={`${carStats.pending ?? 0} pending verification`}
          icon={CarFront}
          color="bg-cyan-500/10 text-cyan-600"
          loading={loading}
        />
        <MetricCard
          title="Customers"
          value={customers.length}
          caption={`${customers.filter((customer) => customer.status === "ACTIVE").length} active accounts`}
          icon={Users}
          color="bg-pink-500/10 text-pink-600"
          loading={loading}
        />
        <MetricCard
          title="Workers"
          value={workerStats.total ?? 0}
          caption={`${workerStats.active ?? 0} active workers`}
          icon={UserRound}
          color="bg-orange-500/10 text-orange-600"
          loading={loading}
        />
        <MetricCard
          title="Active wash services"
          value={serviceStats.active ?? 0}
          caption={`${serviceStats.total ?? 0} services configured`}
          icon={Droplets}
          color="bg-teal-500/10 text-teal-600"
          loading={loading}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking activity</CardTitle>
            <CardDescription>Bookings for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTotals} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.45 }}
                    formatter={(value) => [value, "Bookings"]}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.date
                        ? new Date(
                            `${payload[0].payload.date}T12:00:00Z`,
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              timeZone: "UTC",
                            },
                          )
                        : label
                    }
                  />
                  <Bar
                    dataKey="bookings"
                    name="Bookings"
                    fill={chartColors[0]}
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking status</CardTitle>
            <CardDescription>All bookings grouped by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    innerRadius={62}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {bookingStatusData.map((item) => (
                      <Cell
                        key={item.name}
                        fill={
                          bookingStatusColors[
                            item.name.replace("In progress", "InProgress")
                          ] ?? chartColors[4]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={32} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Memberships</CardTitle>
            <CardDescription>Membership status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={membershipStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    innerRadius={54}
                    outerRadius={88}
                    paddingAngle={3}
                  >
                    {membershipStatusData.map((item, index) => (
                      <Cell key={item.name} fill={chartColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={32} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {membershipStats.total ?? 0} memberships total
            </p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Platform overview</CardTitle>
            <CardDescription>Current totals across your management modules</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ResourceCount
              icon={Building2}
              label="Societies"
              value={societyCount}
              detail="Registered communities"
            />
            <ResourceCount
              icon={House}
              label="Flats"
              value={flatCount}
              detail="Registered residential units"
            />
            <ResourceCount
              icon={Activity}
              label="Cars awaiting approval"
              value={carStats.pending ?? 0}
              detail={`${carStats.verified ?? 0} verified cars`}
            />
            <ResourceCount
              icon={Droplets}
              label="Wash services"
              value={serviceStats.total ?? 0}
              detail={`${serviceStats.inactive ?? 0} inactive services`}
            />
            <ResourceCount
              icon={CreditCard}
              label="Membership plans"
              value={planCount}
              detail="Plans available to customers"
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent bookings</CardTitle>
          <CardDescription>Latest bookings received during the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {bookingList.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {loading ? "Loading recent bookings…" : "No bookings found for this period."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="list-table">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Service</th>
                    <th className="px-3 py-3 font-medium">Car</th>
                    <th className="px-3 py-3 font-medium">Payment</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingList.slice(0, 8).map((booking) => (
                    <tr key={booking._id} className="border-b last:border-0">
                      <td className="px-3 py-3">
                        <div>
                          {new Date(booking.bookingDate).toLocaleDateString("en-IN")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {booking.bookingTime}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium">
                        {booking.serviceNameSnapshot || "Wash service"}
                      </td>
                      <td className="px-3 py-3">
                        {typeof booking.carId === "object"
                          ? booking.carId?.registrationNumber ?? "—"
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div>{booking.paymentType}</div>
                        <div className="text-xs text-muted-foreground">
                          {booking.paymentStatus}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                          {formatBookingStatus(booking.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums">
                        {formatCurrency(Number(booking.amountPayable) || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function ResourceCount({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <span className="rounded-md bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}
