import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from "@/redux/features/auth/authApi";

type ResetRole = "ADMIN" | "CUSTOMER" | "WORKER";

const errorMessage = (error: unknown) => {
  const response = error as {
    data?: { message?: string };
    message?: string;
  };
  return response.data?.message || response.message || "Password reset failed.";
};

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get("role")?.toUpperCase();
  const [role, setRole] = useState<ResetRole>(
    initialRole === "CUSTOMER" || initialRole === "WORKER"
      ? initialRole
      : "ADMIN",
  );
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [requestCode, requestState] = useForgotPasswordMutation();
  const [resetPassword, resetState] = useResetPasswordMutation();
  const busy = requestState.isLoading || resetState.isLoading;

  const sendCode = async () => {
    const result = await requestCode({
      email: email.trim().toLowerCase(),
      role,
    }).unwrap();
    toast.success(result.message);
    setCodeSent(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!codeSent) {
        await sendCode();
        return;
      }

      const result = await resetPassword({
        email: email.trim().toLowerCase(),
        role,
        code: code.trim(),
        newPassword,
      }).unwrap();
      toast.success(result.message);
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-black/10 p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/50">
          Car Wash Booking System
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          {codeSent ? "Set a new password" : "Forgot your password?"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-black/60">
          {codeSent
            ? `Enter the 6-digit code sent to ${email}, then choose a new password.`
            : "Enter your account email and type. We'll email you a one-time reset code."}
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm font-medium">
            Account type
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as ResetRole)}
              disabled={codeSent}
              className="h-12 w-full rounded-xl border border-black/15 bg-white px-3"
            >
              <option value="ADMIN">Admin</option>
              <option value="CUSTOMER">Customer</option>
              <option value="WORKER">Worker</option>
            </select>
          </label>

          <label className="block space-y-2 text-sm font-medium">
            Email address
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={codeSent}
              placeholder="you@example.com"
              className="h-12 w-full rounded-xl border border-black/15 px-3"
            />
          </label>

          {codeSent && (
            <>
              <label className="block space-y-2 text-sm font-medium">
                Reset code
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="6-digit code"
                  className="h-12 w-full rounded-xl border border-black/15 px-3"
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                New password
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="h-12 w-full rounded-xl border border-black/15 px-3"
                />
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl bg-black font-semibold text-white disabled:opacity-60"
          >
            {busy
              ? "Please wait..."
              : codeSent
                ? "Reset password"
                : "Send reset code"}
          </button>
        </form>

        {codeSent && (
          <div className="mt-4 flex justify-center gap-5 text-sm font-semibold">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setCodeSent(false);
                setCode("");
                setNewPassword("");
              }}
              className="underline underline-offset-4"
            >
              Change account
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void sendCode().catch((error: unknown) =>
                  toast.error(errorMessage(error)),
                );
              }}
              className="underline underline-offset-4"
            >
              Resend code
            </button>
          </div>
        )}
        <Link
          to="/login"
          className="mt-6 block text-center text-sm font-semibold underline underline-offset-4"
        >
          Return to sign in
        </Link>
      </section>
    </main>
  );
};

export default ForgotPassword;
