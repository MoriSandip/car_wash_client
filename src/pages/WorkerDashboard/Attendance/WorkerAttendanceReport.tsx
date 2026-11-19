import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useGetMyAttendanceHistoryQuery } from "@/redux/features/worker/workerApi";

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const WorkerAttendanceReport = () => {
  const [historyLimit, setHistoryLimit] = useState(10);
  const {
    data: history,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetMyAttendanceHistoryQuery({ page: 1, limit: historyLimit });

  return (
    <main className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Attendance Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review your daily punch-in and punch-out history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh attendance report"
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </button>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-5 text-sm text-slate-500">
            Loading attendance report…
          </p>
        ) : isError ? (
          <p role="alert" className="p-5 text-sm text-red-700">
            Could not load your attendance report.
          </p>
        ) : history?.records.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="list-table">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Punch in</th>
                    <th className="px-5 py-3">Punch out</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.records.map((record) => (
                    <tr key={record._id}>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {formatDate(record.dateKey)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {formatTime(record.punchInAt)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {formatTime(record.punchOutAt)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            record.punchOutAt
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {record.punchOutAt ? "Complete" : "In progress"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {history.meta.total > history.records.length ? (
              <div className="border-t border-slate-100 p-4 text-center">
                <button
                  type="button"
                  disabled={isFetching}
                  onClick={() => setHistoryLimit((limit) => limit + 10)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {isFetching ? "Loading…" : "Load older attendance"}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="p-5 text-sm text-slate-500">
            No attendance records yet.
          </p>
        )}
      </section>
    </main>
  );
};

export default WorkerAttendanceReport;
