import React, { useEffect, useMemo, useState } from "react";

import {
  type TMembership,
  type TMembershipPayload,
  type TMembershipStatus,
  type TPaymentStatus,
} from "@/redux/features/membership/membershipApi";

import { useGetCarsQuery } from "@/redux/features/car/carApi";
import { useGetSocietiesQuery } from "@/redux/features/society/societyApi";
import {
  useGetFlatsQuery,
  useGetSingleFlatQuery,
} from "@/redux/features/flat/flatApi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetPlansQuery } from "@/redux/features/plan/planApi";
import { useGetOffersQuery, type TOffer } from "@/redux/features/offer/offerApi";

type TMembershipFormProps = {
  initialData?: TMembership | null;
  mode: "add" | "edit" | "view";
  loading?: boolean;
  onSubmit: (data: TMembershipPayload) => Promise<void> | void;
  onClose: () => void;
};

type TOption = {
  _id?: string;
  id?: string;
  name?: string;
  societyId?: any;
  society?: any;
  society_id?: any;
  flatNumber?: string;
  flatNo?: string;
  flatName?: string;
  block?: string;
  floorNumber?: number;
  registrationNumber?: string;
  ownerName?: string;
  make?: string;
  model?: string;
  status?: string;
  price?: number;
  amount?: number;
  duration?: number;
  durationInDays?: number;
  validityDays?: number;
  planName?: string;
  discountType?: "Percentage" | "Fixed";
  discountValue?: number;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
};

const defaultForm: TMembershipPayload = {
  societyId: "",
  flatId: "",
  carId: "",
  planId: "",
  offerId: undefined,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  status: "Pending",
  paymentStatus: "Pending",
  remarks: "",
};

const getId = (value: any): string => {
  if (value == null) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const id = value._id ?? value.id ?? value.$oid;
    return id == null || id === value ? "" : getId(id);
  }

  return "";
};

const getList = (response: any): TOption[] => {
  if (Array.isArray(response)) return response;

  const candidates = [
    response?.data,
    response?.data?.data,
    response?.data?.result,
    response?.data?.results,
    response?.data?.docs,
    response?.data?.items,
    response?.result,
    response?.results,
    response?.docs,
    response?.items,
  ];

  return candidates.find(Array.isArray) ?? [];
};
const getFlatSocietyId = (flat: any): string =>
  getId(
    flat?.societyId ??
      flat?.society ??
      flat?.society_id ??
      flat?.societyID
  );

const getFlatLabel = (flat: TOption) => {
  const label =
    flat.flatNumber ||
    flat.flatNo ||
    flat.flatName ||
    flat.name ||
    getId(flat);

  return `${label}${flat.block ? ` — ${flat.block}` : ""}${
    flat.floorNumber != null ? ` (Floor ${flat.floorNumber})` : ""
  }`;
};

const getCarLabel = (car: TOption) =>
  [
    car.registrationNumber || "No registration",
    [car.make, car.model].filter(Boolean).join(" "),
    car.ownerName ? `— ${car.ownerName}` : "",
  ]
    .filter(Boolean)
    .join(" ");

const getPlanLabel = (plan: TOption) =>
  plan.name || plan.planName || plan.title || getId(plan);

const getPlanAmount = (plan: TOption | undefined): number =>
  Number(plan?.price ?? plan?.amount ?? plan?.charges ?? 0);

const getOffers = (response: any): TOffer[] => {
  const value = response?.data;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.result)) return value.result;
  return [];
};

const getErrorMessage = (error: any) =>
  error?.data?.message ||
  error?.message ||
  "Unable to save Membership. Please try again.";

const MembershipForm: React.FC<TMembershipFormProps> = ({
  initialData,
  mode,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const [form, setForm] = useState<TMembershipPayload>({
    ...defaultForm,
  });
  const [error, setError] = useState("");

  const { data: societyResponse, isLoading: societiesLoading } =
    useGetSocietiesQuery();

  const { data: flatResponse, isLoading: flatsLoading } =
    useGetFlatsQuery();

  const { data: carResponse, isLoading: carsLoading } =
    useGetCarsQuery();

  /*
   * Plan endpoint assumption:
   * GET /plans
   *
   * This form reads the plan list directly through baseApi below.
   * If your existing planApi exports useGetPlansQuery, replace
   * the useGetPlanListQuery call with that existing hook.
   */
  const { data: planResponse, isLoading: plansLoading } =
    useGetPlansQuery();

  const societies = useMemo(
    () => getList(societyResponse),
    [societyResponse]
  );

  const flats = useMemo(
    () => getList(flatResponse),
    [flatResponse]
  );

  const cars = useMemo(
    () => getList(carResponse),
    [carResponse]
  );

  const plans = useMemo(
    () => getList(planResponse),
    [planResponse]
  );

  const isView = mode === "view";

  useEffect(() => {
    if (!initialData) {
      setForm({ ...defaultForm });
      setError("");
      return;
    }

    setForm({
      societyId: getId(initialData.societyId),
      flatId: getId(initialData.flatId),
      carId: getId(initialData.carId),
      planId: getId(initialData.planId),
      offerId: getId(initialData.offerId) || undefined,
      startDate: initialData.startDate
        ? initialData.startDate.slice(0, 10)
        : "",
      endDate: initialData.endDate
        ? initialData.endDate.slice(0, 10)
        : "",
      status: initialData.status || "Pending",
      paymentStatus: initialData.paymentStatus || "Pending",
      remarks: initialData.remarks || "",
    });

    setError("");
  }, [initialData, mode]);

  const societyId = getId(form.societyId);
  const flatId = getId(form.flatId);
  const carId = getId(form.carId);
  const planId = getId(form.planId);
  const offerId = getId(form.offerId);
  const {
    data: offerResponse,
    isLoading: offersLoading,
    isError: offersError,
    refetch: refetchOffers,
  } = useGetOffersQuery(
    planId ? { planId } : undefined,
  );
  const { data: selectedFlatResponse } = useGetSingleFlatQuery(flatId, {
    skip: !flatId || mode === "add",
  });

  const availableFlats = useMemo(() => {
    if (!societyId) return [];

    const matches = new Map<string, TOption>();
    flats
      .filter((flat) => getFlatSocietyId(flat) === societyId)
      .forEach((flat) => {
        const id = getId(flat);
        if (id) matches.set(id, flat);
      });

    const originalSocietyId = getId(initialData?.societyId);
    const originalFlat = initialData?.flatId;
    const originalFlatId = getId(originalFlat);
    const response = selectedFlatResponse as
      | { data?: TOption | { data?: TOption } }
      | undefined;
    const responseData = response?.data;
    const fetchedFlat =
      responseData && "data" in responseData
        ? responseData.data
        : responseData;

    if (
      originalSocietyId === societyId &&
      originalFlatId &&
      !matches.has(originalFlatId)
    ) {
      const savedFlat =
        fetchedFlat && getId(fetchedFlat) === originalFlatId
          ? fetchedFlat
          : originalFlat && typeof originalFlat === "object"
            ? (originalFlat as TOption)
            : undefined;
      const savedSocietyId = savedFlat
        ? getFlatSocietyId(savedFlat)
        : "";

      if (savedFlat && (!savedSocietyId || savedSocietyId === societyId)) {
        matches.set(originalFlatId, { ...savedFlat, _id: originalFlatId });
      }
    }

    return Array.from(matches.values());
  }, [flats, societyId, initialData, selectedFlatResponse]);

 const availableCars = useMemo(() => {
  if (!societyId || !flatId) return [];

  return cars.filter((car) => {
    const carSocietyId = getId(
      car.societyId ?? car.society ?? car.society_id
    );

    const carFlatId = getId(
      car.flatId ?? car.flat ?? car.flat_id
    );

    const isSelectedExistingCar =
      getId(initialData?.carId) === getId(car);

    const isActive = car.status === "Active" || isSelectedExistingCar;

    return (
      carSocietyId === societyId &&
      carFlatId === flatId &&
      isActive
    );
  });
}, [cars, societyId, flatId, initialData]);

  const selectedPlan = plans.find(
    (plan) => getId(plan) === planId
  );
  const planAmount = getPlanAmount(selectedPlan);
  const offers = useMemo(() => getOffers(offerResponse), [offerResponse]);
  const availableOffers = offers.filter((offer) => {
    const activeNow =
      offer.status === "Active" &&
      new Date(offer.startDate) <= new Date() &&
      new Date(offer.endDate) >= new Date();
    return activeNow || getId(initialData?.offerId) === offer._id;
  });
  const selectedOffer = availableOffers.find((offer) => offer._id === offerId);
  const discountAmount = selectedOffer
    ? selectedOffer.discountType === "Percentage"
      ? (planAmount * selectedOffer.discountValue) / 100
      : selectedOffer.discountValue
    : 0;
  const finalPlanAmount = Math.max(0, planAmount - discountAmount);

  const updateField = <K extends keyof TMembershipPayload>(
    key: K,
    value: TMembershipPayload[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSocietyChange = (value: string) => {
    setForm((previous) => ({
      ...previous,
      societyId: value,
      flatId: "",
      carId: "",
    }));
    setError("");
  };

  const handleFlatChange = (value: string) => {
    setForm((previous) => ({
      ...previous,
      flatId: value,
      carId: "",
    }));
    setError("");
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");

    if (!societyId) {
      setError("Please select a Society.");
      return;
    }

    if (!flatId) {
      setError("Please select a Flat.");
      return;
    }

    if (!carId) {
      setError("Please select a Car.");
      return;
    }

    if (!planId) {
      setError("Please select a Plan.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Start Date and End Date are required.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End Date cannot be before Start Date.");
      return;
    }

    const selectedFlat = availableFlats.find(
      (flat) => getId(flat) === flatId
    );

    if (!selectedFlat) {
      setError("Please select a valid Flat for the selected Society.");
      return;
    }

    const selectedCar = availableCars.find(
      (car) => getId(car) === carId
    );

    if (!selectedCar) {
      setError("Please select an active Car for the selected Flat.");
      return;
    }

    if (!selectedPlan) {
      setError("Please select a valid Plan.");
      return;
    }

    const payload: TMembershipPayload = {
      societyId,
      flatId,
      carId,
      planId,
      ...(mode === "edit"
        ? offerId !== getId(initialData?.offerId)
          ? { offerId: offerId || null }
          : {}
        : offerId
          ? { offerId }
          : {}),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      paymentStatus: form.paymentStatus,
      remarks: form.remarks?.trim() || "",
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isView && initialData && (
        <div className="grid gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2">
          {[
            [
              "Society",
              typeof initialData.societyId === "object"
                ? initialData.societyId.name
                : initialData.societyId,
            ],
            [
              "Flat",
              typeof initialData.flatId === "object"
                ? getFlatLabel(initialData.flatId)
                : initialData.flatId,
            ],
            [
              "Car",
              typeof initialData.carId === "object"
                ? getCarLabel(initialData.carId)
                : initialData.carId,
            ],
            [
              "Plan",
              initialData.planNameSnapshot ||
                (typeof initialData.planId === "object"
                  ? initialData.planId.name
                  : initialData.planId),
            ],
            [
              "Offer",
              typeof initialData.offerId === "object"
                ? initialData.offerId.title
                : initialData.offerId,
            ],
            [
              "Validity",
              `${initialData.startDate ? new Date(initialData.startDate).toLocaleDateString("en-IN") : "—"} – ${initialData.endDate ? new Date(initialData.endDate).toLocaleDateString("en-IN") : "—"}`,
            ],
            ["Payment", initialData.paymentStatus],
            ["Status", initialData.status],
            [
              "Amount",
              `₹${Number(initialData.totalAmount ?? 0).toLocaleString("en-IN")}`,
            ],
            ["Remarks", initialData.remarks || "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-muted-foreground">{label}</p>
              <p className="font-medium">{value || "—"}</p>
            </div>
          ))}
        </div>
      )}
      {!isView && (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Society *</Label>
          <Select
            value={societyId}
            onValueChange={handleSocietyChange}
            disabled={isView || societiesLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  societiesLoading
                    ? "Loading Societies..."
                    : "Select Society"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {societies.map((society) => {
                const id = getId(society);
                if (!id) return null;

                return (
                  <SelectItem key={id} value={id}>
                    {society.name || id}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Flat *</Label>
          <Select
            value={flatId}
            onValueChange={handleFlatChange}
            disabled={isView || !societyId || flatsLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !societyId
                    ? "Select Society First"
                    : flatsLoading
                      ? "Loading Flats..."
                      : "Select Flat"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableFlats.map((flat) => {
                const id = getId(flat);
                if (!id) return null;

                return (
                  <SelectItem key={id} value={id}>
                    {getFlatLabel(flat)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Car *</Label>
          <Select
            value={carId}
            onValueChange={(value) => updateField("carId", value)}
            disabled={isView || !flatId || carsLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !flatId
                    ? "Select Flat First"
                    : carsLoading
                      ? "Loading Cars..."
                      : "Select Car"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableCars.map((car) => {
                const id = getId(car);
                if (!id) return null;

                return (
                  <SelectItem key={id} value={id}>
                    {getCarLabel(car)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Plan *</Label>
          <Select
            value={planId}
            onValueChange={(value) =>
              setForm((previous) => ({
                ...previous,
                planId: value,
                offerId: undefined,
              }))
            }
            disabled={isView || plansLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  plansLoading ? "Loading Plans..." : "Select Plan"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => {
                const id = getId(plan);
                if (!id) return null;

                return (
                  <SelectItem key={id} value={id}>
                    {getPlanLabel(plan)} — ₹
                    {getPlanAmount(plan).toLocaleString("en-IN")}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Offer (Optional)</Label>
          <Select
            value={offerId || "none"}
            onValueChange={(value) =>
              updateField("offerId", value === "none" ? undefined : value)
            }
            disabled={isView || !planId || offersLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !planId
                    ? "Select a Plan first"
                    : offersLoading
                      ? "Loading offers..."
                      : "No offer"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No offer</SelectItem>
              {availableOffers.map((offer) => (
                <SelectItem key={offer._id} value={offer._id}>
                  {offer.title} —{" "}
                  {offer.discountType === "Percentage"
                    ? `${offer.discountValue}% off`
                    : `₹${Number(offer.discountValue).toLocaleString("en-IN")} off`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {offersError && (
            <div className="flex items-center justify-between gap-2 text-xs text-destructive">
              <span>Offers could not be loaded.</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void refetchOffers()}
              >
                Retry
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(event) =>
              updateField("startDate", event.target.value)
            }
            disabled={isView}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>End Date *</Label>
          <Input
            type="date"
            value={form.endDate}
            min={form.startDate}
            onChange={(event) =>
              updateField("endDate", event.target.value)
            }
            disabled={isView}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Payment Status *</Label>
          <Select
            value={form.paymentStatus}
            onValueChange={(value) =>
              updateField("paymentStatus", value as TPaymentStatus)
            }
            disabled={isView}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="Refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Membership Status *</Label>
          <Select
            value={form.status}
            onValueChange={(value) =>
              updateField("status", value as TMembershipStatus)
            }
            disabled={isView}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Membership Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Remarks</Label>
          <Textarea
            value={form.remarks || ""}
            onChange={(event) =>
              updateField("remarks", event.target.value)
            }
            placeholder="Enter optional remarks..."
            rows={3}
            disabled={isView}
          />
        </div>
      </div>
      )}

      {!isView && planId && (
        <div className="rounded-md border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            {selectedOffer ? "Discounted Membership Amount" : "Selected Plan Amount"}
          </p>
          <p className="text-2xl font-bold">
            {selectedOffer && (
              <span className="mr-2 text-base font-normal text-muted-foreground line-through">
                ₹{planAmount.toLocaleString("en-IN")}
              </span>
            )}
            ₹{finalPlanAmount.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {selectedOffer
              ? `${selectedOffer.title} applied. Final amount is validated by the server.`
              : "Final membership amount is calculated and validated by the server."}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          {isView ? "Close" : "Cancel"}
        </Button>

        {!isView && (
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : mode === "edit"
                ? "Update Membership"
                : "Create Membership"}
          </Button>
        )}
      </div>
    </form>
  );
};

export default MembershipForm;
