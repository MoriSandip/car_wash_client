import { useRef, useState } from "react";
import { Camera, Clock3, LogIn, LogOut, RefreshCw } from "lucide-react";
import {
  useGetMyAttendanceQuery,
  usePunchAttendanceMutation,
} from "@/redux/features/worker/workerApi";

const compressSelfie = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      URL.revokeObjectURL(objectUrl);
      if (!context) {
        reject(new Error("Could not process the selfie."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the selected selfie."));
    };
    image.src = objectUrl;
  });

const formatTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const WorkerAttendance = () => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [selfie, setSelfie] = useState("");
  const [error, setError] = useState("");
  const { data: attendance, isLoading, isError, refetch, isFetching } =
    useGetMyAttendanceQuery();
  const [punch, mutation] = usePunchAttendanceMutation();
  const isPunchedIn = Boolean(attendance);
  const isPunchedOut = Boolean(attendance?.punchOutAt);

  const takeSelfie = async (file?: File) => {
    if (!file) return;
    setError("");
    try {
      const compressed = await compressSelfie(file);
      if (compressed.length > 7_000_000) {
        throw new Error("Selfie is too large. Please take another photo.");
      }
      setSelfie(compressed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not process selfie.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const submitPunch = async () => {
    if (!selfie) {
      setError("Take a selfie before punching in or out.");
      return;
    }
    setError("");
    try {
      await punch({ action: isPunchedIn ? "out" : "in", selfie }).unwrap();
      setSelfie("");
      await refetch();
    } catch (cause) {
      const response = cause as { data?: { message?: string }; message?: string };
      setError(response.data?.message || response.message || "Attendance could not be saved.");
    }
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Take a selfie to record today&apos;s punch in and punch out.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Today&apos;s shift</h2>
            <p className="mt-1 text-sm text-slate-500">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Refresh attendance"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-slate-500">Loading attendance…</p>
        ) : isError ? (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Could not load attendance. Refresh and try again.
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Punch in</p>
                <p className="mt-2 flex items-center gap-2 font-semibold text-slate-900">
                  <LogIn className="h-4 w-4 text-emerald-600" />
                  {formatTime(attendance?.punchInAt)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Punch out</p>
                <p className="mt-2 flex items-center gap-2 font-semibold text-slate-900">
                  <LogOut className="h-4 w-4 text-sky-600" />
                  {formatTime(attendance?.punchOutAt)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-4">
              {selfie ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={selfie}
                    alt="Selfie for attendance"
                    className="h-48 w-48 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    className="text-sm font-medium text-sky-700 hover:text-sky-800"
                    onClick={() => fileInput.current?.click()}
                  >
                    Retake selfie
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  <Camera className="h-7 w-7 text-sky-700" />
                  <span className="font-medium">Take a selfie</span>
                  <span className="text-xs text-slate-500">Required for every punch</span>
                </button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(event) => void takeSelfie(event.target.files?.[0])}
              />
            </div>

            {error ? (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {isPunchedOut ? (
              <p className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                <Clock3 className="h-4 w-4" />
                Attendance complete for today.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => void submitPunch()}
                disabled={mutation.isLoading || isLoading || isError}
                className={`mt-5 w-full rounded-lg px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  isPunchedIn ? "bg-orange-600 hover:bg-orange-700" : "bg-sky-700 hover:bg-sky-800"
                }`}
              >
                {mutation.isLoading
                  ? "Saving attendance…"
                  : isPunchedIn
                    ? "Punch out"
                    : "Punch in"}
              </button>
            )}
          </>
        )}
      </section>

    </div>
  );
};

export default WorkerAttendance;
