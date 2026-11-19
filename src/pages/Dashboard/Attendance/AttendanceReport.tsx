import { useMemo, useState } from "react";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useGetDailyAttendanceReportQuery,
  useGetWorkersQuery,
} from "@/redux/features/worker/workerApi";
import ListImage from "@/components/ListImage";

const today = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

const time = (value?: string | null) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const AttendanceReport = () => {
  const [date, setDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(() =>
    startOfMonth(parseDate(today())),
  );
  const [workerId, setWorkerId] = useState("");
  const workersQuery = useGetWorkersQuery({ limit: 1000, status: "ACTIVE" });
  const { data, isLoading, isError, refetch, isFetching } =
    useGetDailyAttendanceReportQuery({ date, workerId: workerId || undefined });
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

  const changeMonth = (amount: number) => {
    const nextMonth = startOfMonth(addMonths(selectedMonth, amount));
    setSelectedMonth(nextMonth);
    setDate(format(nextMonth, "yyyy-MM-dd"));
  };

  const handleDateChange = (nextDate: string) => {
    setDate(nextDate);
    if (nextDate) setSelectedMonth(startOfMonth(parseDate(nextDate)));
  };

  return (
    <main className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Worker Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monthly schedule and daily worker-wise punch-in and punch-out report with selfie verification.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
            className="rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <h2 className="text-base font-semibold text-slate-900">
              Monthly Schedule
            </h2>
            <p className="text-sm text-slate-500" aria-live="polite">
              {format(selectedMonth, "MMM d")} –{" "}
              {format(endOfMonth(selectedMonth), "MMM d, yyyy")}
            </p>
          </div>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
            className="rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2"
          role="group"
          aria-label={`${format(selectedMonth, "MMMM yyyy")} attendance dates`}
        >
          {monthDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const selected = dayKey === date;

            return (
              <button
                key={dayKey}
                type="button"
                aria-pressed={selected}
                aria-label={format(day, "MMMM d, yyyy")}
                onClick={() => setDate(dayKey)}
                className={`flex min-h-16 w-16 shrink-0 flex-col items-center justify-center rounded-md border p-1 text-center transition-colors ${
                  selected
                    ? "border-sky-700 bg-sky-700 text-white"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`text-[10px] font-medium uppercase ${
                    selected ? "text-sky-100" : "text-slate-500"
                  }`}
                >
                  {format(day, "EEE")}
                </span>
                <span className="text-sm">{format(day, "d")}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Attendance date
          <input
            type="date"
            value={date}
            onChange={(event) => handleDateChange(event.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Worker
          <select
            value={workerId}
            onChange={(event) => setWorkerId(event.target.value)}
            className="h-10 min-w-48 rounded-md border border-slate-300 px-3"
          >
            <option value="">All active workers</option>
            {(workersQuery.data?.data ?? []).map((worker) => (
              <option key={worker._id} value={worker._id}>
                {worker.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-10 rounded-md bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </section>

      {workersQuery.isError ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Could not load worker filters.
        </p>
      ) : null}
      {isError ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Could not load the attendance report.
        </p>
      ) : null}

      {data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Workers", data.summary.totalWorkers],
              ["Present", data.summary.present],
              ["Absent", data.summary.absent],
            ].map(([label, count]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{count}</p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                Daily report · {new Date(`${data.date}T00:00:00`).toLocaleDateString("en-IN")}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="list-table">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Worker</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Punch in</th>
                    <th className="px-4 py-3">In selfie</th>
                    <th className="px-4 py-3">Punch out</th>
                    <th className="px-4 py-3">Out selfie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td className="px-4 py-8 text-slate-500" colSpan={6}>Loading report…</td></tr>
                  ) : data.records.length ? (
                    data.records.map(({ worker, attendance, status }) => (
                      <tr key={worker._id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{worker.name}</p>
                          <p className="text-xs text-slate-500">{worker.phone || worker.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}>{status}</span>
                        </td>
                        <td className="px-4 py-3">{time(attendance?.punchInAt)}</td>
                        <td className="px-4 py-3">
                          {attendance?.punchInSelfie ? (
                            <a href={attendance.punchInSelfie} target="_blank" rel="noreferrer">
                              <ListImage
                                source={attendance.punchInSelfie}
                                alt={`${worker.name} punch-in selfie`}
                                className="h-12 w-12"
                              />
                            </a>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">{time(attendance?.punchOutAt)}</td>
                        <td className="px-4 py-3">
                          {attendance?.punchOutSelfie ? (
                            <a href={attendance.punchOutSelfie} target="_blank" rel="noreferrer">
                              <ListImage
                                source={attendance.punchOutSelfie}
                                alt={`${worker.name} punch-out selfie`}
                                className="h-12 w-12"
                              />
                            </a>
                          ) : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="px-4 py-8 text-slate-500" colSpan={6}>No active workers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
};

export default AttendanceReport;
