import { Fragment, useEffect, useMemo, useState } from "react";
import { BadgeCheck, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useGetCustomerMembershipsQuery,
  useGetCustomerPlansQuery,
  useGetMembershipOffersQuery,
  usePurchaseCustomerMembershipMutation,
  useStartStripeMembershipCheckoutMutation,
  useConfirmStripeMembershipPaymentMutation,
  type TMembership,
} from "@/redux/features/membership/membershipApi";
import { useGetMyCarsQuery } from "@/redux/features/car/carApi";

type Related =
  | string
  | {
      _id?: string;
      id?: string;
      name?: string;
      registrationNumber?: string;
    };

const nameOf = (value: Related | undefined) =>
  typeof value === "string"
    ? value
    : (value?.registrationNumber ?? value?.name ?? "Car");

const listOf = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const candidate of [
    record.data,
    record.result,
    record.results,
    record.docs,
  ]) {
    if (Array.isArray(candidate)) return candidate as T[];
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      for (const item of [
        nested.data,
        nested.result,
        nested.results,
        nested.docs,
      ]) {
        if (Array.isArray(item)) return item as T[];
      }
    }
  }
  return [];
};

const CustomerMemberships = () => {
  const [searchParams] = useSearchParams();
  const [carId, setCarId] = useState("");
  const [planId, setPlanId] = useState("");
  const [offerId, setOfferId] = useState("");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const carsQuery = useGetMyCarsQuery();
  const membershipsQuery = useGetCustomerMembershipsQuery(undefined, {
    pollingInterval: 30_000,
  });
  const offersQuery = useGetMembershipOffersQuery(planId, { skip: !planId });
  const [purchase, purchaseState] = usePurchaseCustomerMembershipMutation();
  const [startCheckout, checkoutState] =
    useStartStripeMembershipCheckoutMutation();
  const [confirmCheckout] = useConfirmStripeMembershipPaymentMutation();
  const cars = useMemo(
    () =>
      listOf<{
        _id: string;
        societyId: Related;
        registrationNumber: string;
        make?: string;
        model?: string;
        status: string;
        verificationStatus?: string;
      }>(carsQuery.data).filter(
        (car) =>
          car.status === "Active" && car.verificationStatus === "VERIFIED",
      ),
    [carsQuery.data],
  );
  const offers = useMemo(
    () =>
      listOf<{
        _id: string;
        title: string;
        discountType: "Percentage" | "Fixed";
        discountValue: number;
      }>(offersQuery.data),
    [offersQuery.data],
  );
  const plansQuery = useGetCustomerPlansQuery({ carId }, { skip: !carId });
  const plans = useMemo(
    () =>
      listOf<{
        _id: string;
        name: string;
        description?: string;
        societyId: Related;
        price: number;
        includedWashes: number;
        validityDays: number;
        services: string[];
        billingCycle: string;
      }>(plansQuery.data),
    [plansQuery.data],
  );
  const societyPlans = plans;
  const selectedPlan = societyPlans.find((plan) => plan._id === planId);

  useEffect(() => {
    if (planId && !societyPlans.some((plan) => plan._id === planId)) {
      setPlanId("");
      setOfferId("");
    }
  }, [planId, societyPlans]);

  const paymentSessionId = searchParams.get("session_id");
  useEffect(() => {
    if (!paymentSessionId) return;
    confirmCheckout({ sessionId: paymentSessionId })
      .unwrap()
      .then(() => {
        toast.success("Membership payment confirmed.");
        membershipsQuery.refetch();
      })
      .catch(() => {
        toast.error(
          "Payment is not confirmed yet. Refresh your memberships shortly.",
        );
      })
      .finally(() => {
        window.history.replaceState({}, "", window.location.pathname);
      });
  }, [paymentSessionId, confirmCheckout, membershipsQuery]);

  const payForMembership = async (membership: TMembership) => {
    try {
      const checkout = await startCheckout({
        membershipId: membership._id,
      }).unwrap();
      window.location.assign(checkout.url);
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(
        response.data?.message || "Unable to start membership payment.",
      );
    }
  };

  const purchaseMembership = async () => {
    if (!carId || !planId) {
      toast.error("Choose a verified car and an available plan.");
      return;
    }
    try {
      const membership = await purchase({
        carId,
        planId,
        ...(offerId ? { offerId } : {}),
        startDate,
      }).unwrap();
      if (membership.paymentStatus === "Paid") {
        toast.success("Your free membership is active.");
        await membershipsQuery.refetch();
      } else {
        await payForMembership(membership);
      }
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(
        response.data?.message || "Membership purchase could not be started.",
      );
    }
  };

  const memberships = membershipsQuery.data ?? [];
  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Memberships</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose a plan for a verified car. Membership becomes active after
          payment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-600" />
            Purchase a membership
          </CardTitle>
          <CardDescription>
            Plans and eligible offers are based on your car&apos;s society.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Verified car
            <select
              value={carId}
              onChange={(event) => {
                setCarId(event.target.value);
                setPlanId("");
                setOfferId("");
              }}
              className="h-10 w-full rounded-md border bg-background px-3"
            >
              <option value="">Select a car</option>
              {cars.map((car) => (
                <option key={car._id} value={car._id}>
                  {car.registrationNumber} ·{" "}
                  {[car.make, car.model].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            Plan
            <select
              value={planId}
              onChange={(event) => {
                setPlanId(event.target.value);
                setOfferId("");
              }}
              disabled={!carId || plansQuery.isLoading || plansQuery.isError}
              className="h-10 w-full rounded-md border bg-background px-3 disabled:opacity-50"
            >
              <option value="">
                {plansQuery.isLoading
                  ? "Loading plans..."
                  : plansQuery.isError
                    ? "Plans could not be loaded"
                    : !carId
                      ? "Select a car first"
                      : "Select a plan"}
              </option>
              {societyPlans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} · ₹{plan.price} · {plan.validityDays} days
                </option>
              ))}
            </select>
            {plansQuery.isError && carId && (
              <span className="text-xs text-red-600">
                Plans could not be loaded. Please refresh and try again.
              </span>
            )}
            {!plansQuery.isLoading &&
              !plansQuery.isError &&
              carId &&
              societyPlans.length === 0 && (
                <span className="text-xs text-slate-500">
                  No active plans are available for this car&apos;s society.
                </span>
              )}
          </label>
          {selectedPlan && (
            <div className="rounded-md border bg-slate-50 p-4 text-sm md:col-span-2">
              <p className="font-semibold text-slate-900">
                {selectedPlan.name}
              </p>
              {selectedPlan.description && (
                <p className="mt-1 text-slate-600">
                  {selectedPlan.description}
                </p>
              )}
              <p className="mt-2 text-slate-700">
                ₹{selectedPlan.price} · {selectedPlan.includedWashes} washes ·{" "}
                {selectedPlan.validityDays} days · {selectedPlan.billingCycle}
              </p>
              <p className="mt-1 text-slate-700">
                Services:{" "}
                {selectedPlan.services?.join(", ") || "No services listed"}
              </p>
            </div>
          )}
          {offers.length > 0 && (
            <label className="space-y-2 text-sm font-medium">
              Offer (optional)
              <select
                value={offerId}
                onChange={(event) => setOfferId(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3"
              >
                <option value="">No offer</option>
                {offers.map((offer) => (
                  <option key={offer._id} value={offer._id}>
                    {offer.title} · {offer.discountValue}
                    {offer.discountType === "Percentage" ? "%" : " off"}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="space-y-2 text-sm font-medium">
            Start date
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3"
            />
          </label>
          <div className="md:col-span-2">
            <Button
              onClick={purchaseMembership}
              disabled={
                !carId ||
                !planId ||
                purchaseState.isLoading ||
                checkoutState.isLoading
              }
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {purchaseState.isLoading || checkoutState.isLoading
                ? "Opening secure checkout..."
                : "Continue to payment"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your memberships</h2>
        {membershipsQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading memberships...</p>
        ) : membershipsQuery.isError ? (
          <p className="text-sm text-red-600">
            Memberships could not be loaded.
          </p>
        ) : memberships.length === 0 ? (
          <p className="text-sm text-slate-500">No memberships yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan / vehicle</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Wash usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership) => {
                  const completed =
                    membership.completedWashes ?? membership.usedWashes ?? 0;
                  const reserved = membership.reservedWashes ?? 0;
                  const available =
                    membership.remainingWashes ??
                    Math.max(
                      0,
                      (membership.includedWashes ?? 0) -
                        (membership.usedWashes ?? 0) -
                        reserved,
                    );

                  return (
                    <Fragment key={membership._id}>
                      <TableRow>
                        <TableCell className="min-w-[220px]">
                          <p className="font-semibold text-slate-900">
                            {membership.planNameSnapshot || nameOf(membership.planId)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {nameOf(membership.carId)}
                          </p>
                          <p className="mt-1 max-w-[280px] whitespace-normal text-xs text-slate-500">
                            {membership.planServicesSnapshot?.join(", ") ||
                              "Plan services"}
                          </p>
                        </TableCell>
                        <TableCell className="min-w-[190px] whitespace-nowrap">
                          <p>
                            {new Date(membership.startDate).toLocaleDateString()} –{" "}
                            {new Date(membership.endDate).toLocaleDateString()}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Renew by{" "}
                            {new Date(
                              membership.renewalDueDate || membership.endDate,
                            ).toLocaleDateString()}
                            {membership.renewalDueSoon ? " · Due soon" : ""}
                          </p>
                        </TableCell>
                        <TableCell className="min-w-[190px]">
                          <p>{completed} completed · {reserved} scheduled</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {available} available of {membership.includedWashes ?? 0}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{membership.status}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Payment: {membership.paymentStatus}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {membership.status === "Active"
                              ? `${membership.daysRemaining ?? 0} days remaining`
                              : membership.status === "Expired"
                                ? "Membership expired"
                                : membership.status === "Cancelled"
                                  ? "Membership cancelled"
                                  : `Plan validity: ${membership.planValidityDays ?? 0} days`}
                          </p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-semibold">
                          ₹{membership.totalAmount}
                        </TableCell>
                        <TableCell className="text-right">
                          {membership.paymentStatus !== "Paid" &&
                          membership.status === "Pending" ? (
                            <Button
                              variant="outline"
                              onClick={() => payForMembership(membership)}
                              disabled={checkoutState.isLoading}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pay now
                            </Button>
                          ) : membership.paymentStatus === "Paid" &&
                            membership.status === "Active" ? (
                            <BadgeCheck
                              aria-label="Active and paid"
                              className="ml-auto h-5 w-5 text-emerald-600"
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6} className="bg-slate-50/60">
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-slate-700 marker:text-slate-400">
                              Daily wash history ({membership.washHistory?.length ?? 0})
                            </summary>
                            {membership.washHistory?.length ? (
                              <div className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white px-3">
                                {membership.washHistory.map((wash) => (
                                  <div
                                    key={wash._id}
                                    className="flex flex-col justify-between gap-1 py-2 text-sm sm:flex-row"
                                  >
                                    <span>
                                      {new Date(wash.bookingDate).toLocaleDateString()} at{" "}
                                      {wash.bookingTime} · {wash.serviceNameSnapshot}
                                    </span>
                                    <span className="text-slate-500">
                                      {wash.status} / {wash.workStatus || "Not started"}
                                      {wash.workCompletedAt
                                        ? ` · Completed ${new Date(wash.workCompletedAt).toLocaleString()}`
                                        : ""}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-slate-500">
                                No daily washes scheduled yet.
                              </p>
                            )}
                          </details>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerMemberships;
