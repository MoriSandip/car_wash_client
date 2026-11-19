import CarInput from "@/components/form/CarInput";
import CarForm from "@/components/form/CarForm";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FieldValues, SubmitHandler } from "react-hook-form";
import {
  useLoginMutation,
  useWorkerLoginMutation,
  useCustomerLoginMutation,
  useRequestLoginOtpMutation,
  useVerifyLoginOtpMutation,
} from "@/redux/features/auth/authApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch } from "@/redux/hooks";
import { verifyToken } from "@/utils/VeryfiedToken";
import { setUser, TUser } from "@/redux/features/auth/authSlice";
import { toast } from "sonner";
import {
  ShieldCheck,
  UserRound,
  BriefcaseBusiness,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

type TLoginRole = "admin" | "customer" | "worker";
type TOtpChannel = "email" | "phone";

const LoginForm = ({
  onSubmit,
}: {
  onSubmit: SubmitHandler<FieldValues>;
}) => (
  <CarForm
    onSubmit={onSubmit}
    defaultValues={{ email: "", password: "" }}
  >
    <div className="space-y-4">
      <CarInput
        type="email"
        name="email"
        label="Email address"
        placeholder="Enter your email"
      />
      <CarInput
        type="password"
        name="password"
        label="Password"
        placeholder="Enter your password"
        className="text-black"
      />
    </div>

    <Button
      type="submit"
      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-black font-semibold text-white transition"
    >
      Sign in
      <ArrowRight size={17} />
    </Button>
  </CarForm>
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [login] = useLoginMutation();
  const [workerLogin] = useWorkerLoginMutation();
  const [customerLogin] = useCustomerLoginMutation();
  const [requestLoginOtp, requestOtpState] = useRequestLoginOtpMutation();
  const [verifyLoginOtp, verifyOtpState] = useVerifyLoginOtpMutation();
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [otpChannel, setOtpChannel] = useState<TOtpChannel>("email");
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpDestination, setOtpDestination] = useState("");
  const [developmentOtp, setDevelopmentOtp] = useState("");

  const [activeRole, setActiveRole] = useState<TLoginRole>(
    location.pathname === "/customer/login" ? "customer" : "admin",
  );

  const finishLogin = (token: string) => {
    const user = verifyToken(token) as TUser;
    const expectedRole =
      activeRole === "admin"
        ? "admin"
        : activeRole === "worker"
          ? "WORKER"
          : "CUSTOMER";
    if (user.role !== expectedRole) {
      throw new Error(`Invalid ${activeRole} token payload`);
    }
    dispatch(setUser({ user, token }));
    toast.success(`${activeRole[0].toUpperCase()}${activeRole.slice(1)} logged in`);
    const destination =
      location.state?.from ||
      (activeRole === "admin"
        ? "/dashboard"
        : activeRole === "worker"
          ? "/worker"
          : "/customer");
    navigate(destination, { replace: true });
  };

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    try {
      let response;
      if (activeRole === "worker") {
        response = await workerLogin({
          email: String(data.email ?? "").trim(),
          password: String(data.password ?? ""),
        }).unwrap();
      } else if (activeRole === "customer") {
        response = await customerLogin({
          email: String(data.email ?? "").trim(),
          password: String(data.password ?? ""),
        }).unwrap();
      } else {
        response = await login({
          email: String(data.email ?? "").trim(),
          password: String(data.password ?? ""),
        }).unwrap();
      }
      finishLogin(response.data.accessToken);
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(
        response.data?.message || "Login failed. Check your credentials and try again."
      );
    }
  };

  const sendOtp = async () => {
    const identifier = otpIdentifier.trim();
    if (!identifier) {
      toast.error(`Enter your ${otpChannel === "email" ? "email address" : "phone number"}.`);
      return;
    }
    try {
      const response = await requestLoginOtp({
        role: activeRole,
        channel: otpChannel,
        identifier,
      }).unwrap();
      setOtpDestination(response.data.destination);
      setDevelopmentOtp(response.data.developmentOtp ?? "");
      setOtpCode("");
      toast.success(response.message);
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(response.data?.message || "Could not request an OTP.");
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    try {
      const response = await verifyLoginOtp({
        role: activeRole,
        channel: otpChannel,
        identifier: otpIdentifier.trim(),
        code: otpCode,
      }).unwrap();
      finishLogin(response.data.accessToken);
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(response.data?.message || "OTP verification failed.");
    }
  };

  const otpForm = (
    <OtpLoginForm
      channel={otpChannel}
      identifier={otpIdentifier}
      code={otpCode}
      destination={otpDestination}
      developmentOtp={developmentOtp}
      loading={requestOtpState.isLoading || verifyOtpState.isLoading}
      onChannelChange={(channel) => {
        setOtpChannel(channel);
        setOtpDestination("");
        setDevelopmentOtp("");
        setOtpCode("");
      }}
      onIdentifierChange={(identifier) => {
        setOtpIdentifier(identifier);
        setOtpDestination("");
        setDevelopmentOtp("");
        setOtpCode("");
      }}
      onCodeChange={setOtpCode}
      onSend={sendOtp}
      onVerify={verifyOtp}
    />
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Monochrome background decoration */}
    
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-black/10 bg-white md:grid-cols-2">
        {/* Left panel */}
        <section className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-white p-10 text-black md:flex lg:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/15" />
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border border-white/15" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/[0.04]" />

          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/30">
              <ShieldCheck size={26} strokeWidth={1.7} />
            </div>

            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-black/60">
              Car Wash Booking System
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-tight lg:text-5xl">
              Welcome
              <br />
              back.
            </h1>

            <p className="mt-5 max-w-xs text-sm leading-7 text-black/65">
              Sign in to manage your bookings, services, and account from one
              convenient place.
            </p>
          </div>

       
        </section>

        {/* Right panel */}
        <section className="flex min-w-0 flex-col justify-center p-6 sm:p-10 lg:p-12">
          <div className="mb-8 md:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl text-black">
              <ShieldCheck size={24} />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
              Car Wash Booking System
            </p>
          </div>

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/50">
              Your account
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Sign in
            </h2>
            <p className="mt-3 text-sm leading-6 text-black/55">
              Choose your account type and sign in with a password or one-time code.
            </p>
          </div>

          <div className="w-full">
            <Tabs
              value={activeRole}
              onValueChange={(value) => {
                if (value === "admin" || value === "customer" || value === "worker") {
                  setActiveRole(value);
                  setOtpDestination("");
                  setDevelopmentOtp("");
                  setOtpCode("");
                }
              }}
            >
              <TabsList className="mb-6 grid h-12 w-full grid-cols-3 rounded-xl bg-black/5 p-1">
                <TabsTrigger
                  value="admin"
                  className="gap-2 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  <ShieldCheck size={16} />
                  Admin
                </TabsTrigger>
                <TabsTrigger
                  value="customer"
                  className="gap-2 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  <UserRound size={16} />
                  Customer
                </TabsTrigger>
                <TabsTrigger
                  value="worker"
                  className="gap-2 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  <BriefcaseBusiness size={16} />
                  Worker
                </TabsTrigger>
              </TabsList>
              <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-black/5 p-1">
                <button
                  type="button"
                  onClick={() => setLoginMethod("password")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${loginMethod === "password" ? "bg-black text-white" : "text-black/70"}`}
                >
                  Email &amp; password
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod("otp")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${loginMethod === "otp" ? "bg-black text-white" : "text-black/70"}`}
                >
                  Login with OTP
                </button>
              </div>
              <TabsContent value="admin" className="mt-0">
                {loginMethod === "password" ? <LoginForm onSubmit={onSubmit} /> : otpForm}
              </TabsContent>
              <TabsContent value="customer" className="mt-0">
                {loginMethod === "password" ? <LoginForm onSubmit={onSubmit} /> : otpForm}
              </TabsContent>
              <TabsContent value="worker" className="mt-0">
                {loginMethod === "password" ? <LoginForm onSubmit={onSubmit} /> : otpForm}
              </TabsContent>
            </Tabs>
            <div className="mt-4 text-right">
              <Link
                to={`/forgot-password?role=${activeRole.toUpperCase()}`}
                className="text-sm font-semibold text-black underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {activeRole === "customer" && (
            <p className="mt-6 text-center text-sm text-black/60">
              New customer?{" "}
              <Link
                to="/customer/register"
                className="font-semibold text-black underline underline-offset-4"
              >
                Create an account
              </Link>
            </p>
          )}
        </section>
      </div>
    </main>
  );
};

export default Login;

const OtpLoginForm = ({
  channel,
  identifier,
  code,
  destination,
  developmentOtp,
  loading,
  onChannelChange,
  onIdentifierChange,
  onCodeChange,
  onSend,
  onVerify,
}: {
  channel: TOtpChannel;
  identifier: string;
  code: string;
  destination: string;
  developmentOtp: string;
  loading: boolean;
  onChannelChange: (channel: TOtpChannel) => void;
  onIdentifierChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSend: () => void;
  onVerify: () => void;
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-2">
      {(["email", "phone"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChannelChange(option)}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold capitalize ${channel === option ? "border-black bg-black text-white" : "border-black/15 bg-white"}`}
        >
          {option}
        </button>
      ))}
    </div>
    <label className="block space-y-2 text-sm font-medium">
      <span>{channel === "email" ? "Registered email address" : "Registered phone number"}</span>
      <input
        type={channel === "email" ? "email" : "tel"}
        autoComplete={channel === "email" ? "email" : "tel"}
        value={identifier}
        onChange={(event) => onIdentifierChange(event.target.value)}
        placeholder={channel === "email" ? "Enter your registered email" : "Enter your registered phone"}
        className="h-11 w-full rounded-md border border-black/15 px-3 text-black"
      />
    </label>
    {destination ? (
      <>
        <p className="text-sm text-black/60">
          OTP destination: {destination}
          {developmentOtp ? ` - Development OTP: ${developmentOtp}` : ""}
        </p>
        <label className="block space-y-2 text-sm font-medium">
          <span>6-digit OTP</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter OTP"
            className="h-11 w-full rounded-md border border-black/15 px-3 text-black"
          />
        </label>
        <Button
          type="button"
          onClick={onVerify}
          disabled={loading}
          className="h-12 w-full rounded-xl font-semibold text-white"
        >
          {loading ? "Please wait..." : "Verify OTP & sign in"}
        </Button>
        <button
          type="button"
          onClick={onSend}
          disabled={loading}
          className="w-full text-center text-sm font-semibold text-black underline underline-offset-4 disabled:opacity-50"
        >
          Resend OTP
        </button>
      </>
    ) : (
      <Button
        type="button"
        onClick={onSend}
        disabled={loading}
        className="h-12 w-full rounded-xl font-semibold text-white"
      >
        {loading ? "Please wait..." : "Send OTP"}
      </Button>
    )}
  </div>
);
