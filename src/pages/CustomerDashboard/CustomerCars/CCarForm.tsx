import React, { useEffect, useMemo, useState } from "react";
import {
  CarFront,
  MapPin,
  FileText,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  UserRound,
  Mail,
  Phone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import imageUpload from "@/utils/ImageUp";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGetMySocietiesQuery } from "@/redux/features/society/societyApi";
import { useGetMyFlatsQuery } from "@/redux/features/flat/flatApi";
import { useGetMyCustomerProfileQuery } from "@/redux/features/customer/customerApi";

import type {
  TCar,
  TCarPayload,
  TCarStatus,
  TCarType,
  TCarVerificationStatus,
} from "@/redux/features/car/carApi";

interface CCarFormProps {
  initialData?: TCar | null;
  mode: "add" | "edit" | "view";
  loading?: boolean;
  onSubmit: (data: TCarPayload) => void | Promise<void>;
  onClose: () => void;
}

interface TCustomerProfile {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
}

interface TSociety {
  _id: string;
  name?: string;
  societyName?: string;
  status?: string;
  isDeleted?: boolean;
  verificationStatus?: string;
}

interface TFlatOption {
  _id: string;
  societyId: string | { _id: string };
  flatNumber: string;
  block?: string;
  status?: string;
  isDeleted?: boolean;
  verificationStatus?: string;
}

interface TFormData {
  societyId: string;
  flatId: string;
  registrationNumber: string;
  make: string;
  model: string;
  color: string;
  carType: TCarType;
  parkingSlot: string;
  status: TCarStatus;
  description: string;
  imageUrl: string;
}

const emptyForm: TFormData = {
  societyId: "",
  flatId: "",
  registrationNumber: "",
  make: "",
  model: "",
  color: "",
  carType: "Sedan",
  parkingSlot: "",
  status: "Active",
  description: "",
  imageUrl: "",
};

const carTypes: TCarType[] = [
  "Hatchback",
  "Sedan",
  "SUV",
  "MUV",
  "Luxury",
  "Other",
];

const carStatuses: TCarStatus[] = [
  "Active",
  "Inactive",
  "Maintenance",
];

const statusConfig: Record<
  TCarVerificationStatus,
  {
    label: string;
    className: string;
    icon: React.ReactNode;
  }
> = {
  PENDING: {
    label: "Pending Verification",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: <Clock className="mr-1 h-4 w-4" />,
  },
  VERIFIED: {
    label: "Verified",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 className="mr-1 h-4 w-4" />,
  },
  REJECTED: {
    label: "Rejected",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: <XCircle className="mr-1 h-4 w-4" />,
  },
};

const getVerificationStatus = (
  status?: string,
): TCarVerificationStatus => {
  const value = status?.toUpperCase();

  if (
    value === "VERIFIED" ||
    value === "REJECTED" ||
    value === "PENDING"
  ) {
    return value;
  }

  return "PENDING";
};

const getCustomerProfile = (
  response: unknown,
): TCustomerProfile | undefined => {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const root = response as Record<string, unknown>;
  let payload: unknown = root.data ?? root;

  // Supports:
  // { data: customer }
  // { data: { data: customer } }
  if (payload && typeof payload === "object") {
    const nested = payload as Record<string, unknown>;

    if (
      nested.data &&
      typeof nested.data === "object"
    ) {
      payload = nested.data;
    }
  }

  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  return payload as TCustomerProfile;
};

const getSocieties = (response: unknown): TSociety[] => {
  if (Array.isArray(response)) {
    return response as TSociety[];
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const obj = response as {
    data?: unknown;
    result?: unknown;
    societies?: unknown;
  };

  if (Array.isArray(obj.data)) {
    return obj.data as TSociety[];
  }

  if (Array.isArray(obj.result)) {
    return obj.result as TSociety[];
  }

  if (Array.isArray(obj.societies)) {
    return obj.societies as TSociety[];
  }

  if (obj.data && typeof obj.data === "object") {
    const nested = obj.data as {
      data?: unknown;
      result?: unknown;
      societies?: unknown;
    };

    if (Array.isArray(nested.result)) {
      return nested.result as TSociety[];
    }

    if (Array.isArray(nested.data)) {
      return nested.data as TSociety[];
    }

    if (Array.isArray(nested.societies)) {
      return nested.societies as TSociety[];
    }
  }

  return [];
};

const getFlats = (response: unknown): TFlatOption[] => {
  if (Array.isArray(response)) {
    return response as TFlatOption[];
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const obj = response as {
    data?: unknown;
    result?: unknown;
    flats?: unknown;
    results?: unknown;
  };

  if (Array.isArray(obj.data)) {
    return obj.data as TFlatOption[];
  }

  if (Array.isArray(obj.result)) {
    return obj.result as TFlatOption[];
  }

  if (Array.isArray(obj.flats)) {
    return obj.flats as TFlatOption[];
  }

  if (Array.isArray(obj.results)) {
    return obj.results as TFlatOption[];
  }

  if (obj.data && typeof obj.data === "object") {
    const nested = obj.data as {
      data?: unknown;
      result?: unknown;
      flats?: unknown;
      results?: unknown;
    };

    if (Array.isArray(nested.result)) {
      return nested.result as TFlatOption[];
    }

    if (Array.isArray(nested.data)) {
      return nested.data as TFlatOption[];
    }

    if (Array.isArray(nested.flats)) {
      return nested.flats as TFlatOption[];
    }

    if (Array.isArray(nested.results)) {
      return nested.results as TFlatOption[];
    }
  }

  return [];
};

const getEntityId = (
  value: string | { _id: string } | undefined | null,
): string => {
  if (!value) return "";

  return typeof value === "string" ? value : value._id;
};

const getApiError = (error: unknown): string => {
  if (!error || typeof error !== "object") {
    return "Unable to save car. Please try again.";
  }

  const value = error as {
    data?: { message?: string };
    message?: string;
    error?: string;
  };

  return (
    value.data?.message ||
    value.message ||
    value.error ||
    "Unable to save car. Please try again."
  );
};

const CCarForm: React.FC<CCarFormProps> = ({
  initialData,
  mode,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  // Logged-in customer profile
  const {
    data: customerResponse,
    isLoading: customerLoading,
    isFetching: customerFetching,
    isError: customerError,
    refetch: refetchCustomer,
  } = useGetMyCustomerProfileQuery();

  const customer = useMemo(
    () => getCustomerProfile(customerResponse),
    [customerResponse],
  );

  const ownerName = customer?.name ?? "";
  const ownerEmail = customer?.email ?? "";
  const ownerPhone = customer?.phone ?? "";

  // Customer societies
  const {
    data: societyResponse,
    isLoading: societiesLoading,
    isFetching: societiesFetching,
    isError: societiesError,
    error: societyError,
    refetch: refetchSocieties,
  } = useGetMySocietiesQuery(undefined);

  // Customer flats
  const {
    data: flatsResponse,
    isLoading: flatsLoading,
    isFetching: flatsFetching,
    isError: flatsError,
    error: flatError,
    refetch: refetchFlats,
  } = useGetMyFlatsQuery(undefined);

  const societies = useMemo(
    () =>
      getSocieties(societyResponse).filter(
        (society) =>
          society.isDeleted !== true &&
          (!society.verificationStatus ||
            society.verificationStatus === "VERIFIED"),
      ),
    [societyResponse],
  );

  const allFlats = useMemo(
    () =>
      getFlats(flatsResponse).filter(
        (flat) =>
          flat.isDeleted !== true &&
          (!flat.verificationStatus ||
            flat.verificationStatus === "VERIFIED"),
      ),
    [flatsResponse],
  );

  const [formData, setFormData] =
    useState<TFormData>(emptyForm);

  const [errors, setErrors] = useState<
    Partial<Record<keyof TFormData, string>>
  >({});

  const [submitError, setSubmitError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(formData.imageUrl);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [formData.imageUrl, imageFile]);

  const availableFlats = useMemo(() => {
    const matches = new Map<string, TFlatOption>();

    allFlats
      .filter(
        (flat) => getEntityId(flat.societyId) === formData.societyId,
      )
      .forEach((flat) => matches.set(flat._id, flat));

    const initialSocietyId = getEntityId(
      initialData?.societyId as string | { _id: string } | undefined,
    );
    const initialFlat = initialData?.flatId as
      | string
      | TFlatOption
      | undefined;
    const initialFlatId = getEntityId(initialFlat);
    if (
      initialSocietyId === formData.societyId &&
      initialFlatId &&
      !matches.has(initialFlatId)
    ) {
      const savedFlat =
        initialFlat && typeof initialFlat === "object"
          ? initialFlat
          : undefined;
      const savedSocietyId = savedFlat
        ? getEntityId(savedFlat.societyId)
        : "";

      if (savedFlat && (!savedSocietyId || savedSocietyId === formData.societyId)) {
        matches.set(initialFlatId, { ...savedFlat, _id: initialFlatId });
      }
    }

    return Array.from(matches.values());
  }, [allFlats, formData.societyId, initialData]);

  useEffect(() => {
    if (initialData) {
      const societyId = getEntityId(
        initialData.societyId as
          | string
          | { _id: string }
          | undefined,
      );

      const flatId = getEntityId(
        initialData.flatId as
          | string
          | { _id: string }
          | undefined,
      );

      setFormData({
        societyId,
        flatId,
        registrationNumber:
          initialData.registrationNumber ?? "",
        make: initialData.make ?? "",
        model: initialData.model ?? "",
        color: initialData.color ?? "",
        carType: initialData.carType ?? "Sedan",
        parkingSlot: initialData.parkingSlot ?? "",
        status: initialData.status ?? "Active",
        description: initialData.description ?? "",
        imageUrl: initialData.imageUrl ?? "",
      });
    } else {
      setFormData({ ...emptyForm });
    }

    setImageFile(null);
    setErrors({});
    setSubmitError("");
  }, [initialData, mode]);

  const handleChange = (
    field: keyof TFormData,
    value: string,
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "societyId" ? { flatId: "" } : {}),
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));

    setSubmitError("");
  };

  const validateForm = (): boolean => {
    const nextErrors: Partial<
      Record<keyof TFormData, string>
    > = {};

    if (!formData.societyId) {
      nextErrors.societyId = "Please select a society.";
    }

    if (!formData.flatId) {
      nextErrors.flatId = "Please select a verified flat.";
    }

    if (!formData.registrationNumber.trim()) {
      nextErrors.registrationNumber =
        "Registration number is required.";
    } else if (
      !/^[A-Z0-9 -]{4,15}$/i.test(
        formData.registrationNumber.trim(),
      )
    ) {
      nextErrors.registrationNumber =
        "Enter a valid registration number.";
    }

    if (!formData.make.trim()) {
      nextErrors.make = "Car make is required.";
    }

    if (!formData.model.trim()) {
      nextErrors.model = "Car model is required.";
    }

    if (!formData.color.trim()) {
      nextErrors.color = "Car color is required.";
    }

    if (!formData.carType) {
      nextErrors.carType = "Please select a car type.";
    }

    if (!formData.status) {
      nextErrors.status = "Please select car status.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isView || loading) return;

    setSubmitError("");

    if (!customer || !ownerName || !ownerEmail || !ownerPhone) {
      setSubmitError(
        "Unable to retrieve your customer profile. Please refresh and try again.",
      );
      return;
    }

    if (!validateForm()) return;

    const payload = {
      societyId: formData.societyId,
      flatId: formData.flatId,
      registrationNumber:
        formData.registrationNumber.trim().toUpperCase(),
      make: formData.make.trim(),
      model: formData.model.trim(),
      color: formData.color.trim(),
      carType: formData.carType,
      parkingSlot: formData.parkingSlot.trim(),
      status: formData.status,
      description: formData.description.trim(),
      imageUrl: formData.imageUrl,

      // Logged-in customer's profile details
      ownerName,
      ownerEmail,
      ownerPhone,
    } as TCarPayload;

    try {
      if (imageFile) {
        setImageUploading(true);
        const uploaded = (await imageUpload(imageFile)) as {
          data?: { url?: string };
        };
        if (!uploaded.data?.url) {
          throw new Error("Car image upload failed. Please try again.");
        }
        payload.imageUrl = uploaded.data.url;
      }
      await onSubmit(payload);
    } catch (error: unknown) {
      setSubmitError(getApiError(error));
    } finally {
      setImageUploading(false);
    }
  };

  const verificationStatus = getVerificationStatus(
    initialData?.verificationStatus,
  );

  const societyErrorMessage = getApiError(societyError);
  const flatErrorMessage = getApiError(flatError);

  const societyLoading =
    societiesLoading || societiesFetching;

  const flatLoading = flatsLoading || flatsFetching;

  const isProfileLoading =
    customerLoading || customerFetching;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Car verification status */}
      {initialData && (
        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="font-semibold">
                  Car Verification
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your car registration is reviewed by the
                  administrator.
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={
                statusConfig[verificationStatus].className
              }
            >
              {statusConfig[verificationStatus].icon}
              {statusConfig[verificationStatus].label}
            </Badge>
          </div>

          {verificationStatus === "PENDING" && (
            <p className="mt-3 text-sm text-amber-700">
              Your car registration is waiting for admin approval.
            </p>
          )}

          {verificationStatus === "VERIFIED" && (
            <p className="mt-3 text-sm text-emerald-700">
              Your car has been verified successfully.
            </p>
          )}

          {verificationStatus === "REJECTED" &&
            initialData.verificationNote && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                  <XCircle className="h-4 w-4" />
                  Administrator's Rejection Reason
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                  {initialData.verificationNote}
                </p>
              </div>
            )}
        </div>
      )}

      {/* Customer profile details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <UserRound className="h-5 w-5 text-primary" />

          <div>
            <h3 className="font-semibold">
              Customer Information
            </h3>
            <p className="text-xs text-muted-foreground">
              Details are fetched from your logged-in account.
            </p>
          </div>
        </div>

        {customerError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">
              Unable to load your customer profile.
            </p>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void refetchCustomer()}
              disabled={isProfileLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ownerName">
              Customer Name
            </Label>

            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="ownerName"
                value={ownerName}
                disabled
                placeholder={
                  isProfileLoading
                    ? "Loading customer..."
                    : "Customer name"
                }
                className="cursor-not-allowed bg-muted pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerEmail">
              Customer Email
            </Label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="ownerEmail"
                type="email"
                value={ownerEmail}
                disabled
                placeholder="Customer email"
                className="cursor-not-allowed bg-muted pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerPhone">
              Customer Phone
            </Label>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="ownerPhone"
                type="tel"
                value={ownerPhone}
                disabled
                placeholder="Customer phone"
                className="cursor-not-allowed bg-muted pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Car information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <CarFront className="h-5 w-5 text-primary" />

          <div>
            <h3 className="font-semibold">
              {mode === "add"
                ? "Register Car"
                : mode === "edit"
                  ? "Edit My Car"
                  : "Car Details"}
            </h3>

            <p className="text-xs text-muted-foreground">
              Enter your car information below.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Society */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="societyId">
              Society <span className="text-red-500">*</span>
            </Label>

            <Select
              value={formData.societyId}
              onValueChange={(value) =>
                handleChange("societyId", value)
              }
              disabled={
                isView || loading || societyLoading
              }
            >
              <SelectTrigger
                id="societyId"
                aria-invalid={Boolean(errors.societyId)}
                className={
                  errors.societyId ? "border-red-500" : ""
                }
              >
                <SelectValue
                  placeholder={
                    societyLoading
                      ? "Loading societies..."
                      : "Select society"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {societies.map((society) => (
                  <SelectItem
                    key={society._id}
                    value={society._id}
                  >
                    {society.name ||
                      society.societyName ||
                      "Unnamed Society"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.societyId && (
              <p className="text-xs text-red-500">
                {errors.societyId}
              </p>
            )}

            {societiesError && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-red-600">
                <span>{societyErrorMessage}</span>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void refetchSocieties()}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  Retry
                </Button>
              </div>
            )}

            {!societyLoading &&
              !societiesError &&
              societies.length === 0 && (
                <p className="text-xs text-amber-700">
                  No verified societies available. Submit a
                  society and wait for admin approval.
                </p>
              )}
          </div>

          {/* Flat */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="flatId">
              Flat <span className="text-red-500">*</span>
            </Label>

            <Select
              value={formData.flatId}
              onValueChange={(value) =>
                handleChange("flatId", value)
              }
              disabled={
                isView ||
                loading ||
                flatLoading ||
                !formData.societyId
              }
            >
              <SelectTrigger
                id="flatId"
                aria-invalid={Boolean(errors.flatId)}
                className={
                  errors.flatId ? "border-red-500" : ""
                }
              >
                <SelectValue
                  placeholder={
                    !formData.societyId
                      ? "Select society first"
                      : flatLoading
                        ? "Loading flats..."
                        : "Select verified flat"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {availableFlats.map((flat) => (
                  <SelectItem
                    key={flat._id}
                    value={flat._id}
                  >
                    {flat.flatNumber}
                    {flat.block ? ` · ${flat.block}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.flatId && (
              <p className="text-xs text-red-500">
                {errors.flatId}
              </p>
            )}

            {flatsError && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-red-600">
                <span>{flatErrorMessage}</span>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void refetchFlats()}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  Retry
                </Button>
              </div>
            )}

            {formData.societyId &&
              !flatLoading &&
              !flatsError &&
              availableFlats.length === 0 && (
                <p className="text-xs text-amber-700">
                  No verified flats found in this society.
                  Only approved flats can be selected.
                </p>
              )}
          </div>

          {/* Registration number */}
          <div className="space-y-2">
            <Label htmlFor="registrationNumber">
              Registration Number{" "}
              <span className="text-red-500">*</span>
            </Label>

            <Input
              id="registrationNumber"
              value={formData.registrationNumber}
              onChange={(event) =>
                handleChange(
                  "registrationNumber",
                  event.target.value.toUpperCase(),
                )
              }
              placeholder="e.g. GJ01AB1234"
              maxLength={15}
              disabled={isView || loading}
              aria-invalid={Boolean(
                errors.registrationNumber,
              )}
              className={
                errors.registrationNumber
                  ? "border-red-500"
                  : ""
              }
            />

            {errors.registrationNumber && (
              <p className="text-xs text-red-500">
                {errors.registrationNumber}
              </p>
            )}
          </div>

          {/* Make */}
          <div className="space-y-2">
            <Label htmlFor="make">
              Make / Brand{" "}
              <span className="text-red-500">*</span>
            </Label>

            <Input
              id="make"
              value={formData.make}
              onChange={(event) =>
                handleChange("make", event.target.value)
              }
              placeholder="e.g. Maruti Suzuki"
              disabled={isView || loading}
              aria-invalid={Boolean(errors.make)}
              className={
                errors.make ? "border-red-500" : ""
              }
            />

            {errors.make && (
              <p className="text-xs text-red-500">
                {errors.make}
              </p>
            )}
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">
              Model <span className="text-red-500">*</span>
            </Label>

            <Input
              id="model"
              value={formData.model}
              onChange={(event) =>
                handleChange("model", event.target.value)
              }
              placeholder="e.g. Swift"
              disabled={isView || loading}
              aria-invalid={Boolean(errors.model)}
              className={
                errors.model ? "border-red-500" : ""
              }
            />

            {errors.model && (
              <p className="text-xs text-red-500">
                {errors.model}
              </p>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">
              Color <span className="text-red-500">*</span>
            </Label>

            <Input
              id="color"
              value={formData.color}
              onChange={(event) =>
                handleChange("color", event.target.value)
              }
              placeholder="e.g. White"
              disabled={isView || loading}
              aria-invalid={Boolean(errors.color)}
              className={
                errors.color ? "border-red-500" : ""
              }
            />

            {errors.color && (
              <p className="text-xs text-red-500">
                {errors.color}
              </p>
            )}
          </div>

          {/* Car type */}
          <div className="space-y-2">
            <Label htmlFor="carType">
              Car Type <span className="text-red-500">*</span>
            </Label>

            <Select
              value={formData.carType}
              onValueChange={(value) =>
                handleChange("carType", value as TCarType)
              }
              disabled={isView || loading}
            >
              <SelectTrigger id="carType">
                <SelectValue placeholder="Select car type" />
              </SelectTrigger>

              <SelectContent>
                {carTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parking slot */}
          <div className="space-y-2">
            <Label htmlFor="parkingSlot">
              Parking Slot
            </Label>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="parkingSlot"
                value={formData.parkingSlot}
                onChange={(event) =>
                  handleChange(
                    "parkingSlot",
                    event.target.value,
                  )
                }
                placeholder="e.g. B-24"
                disabled={isView || loading}
                className="pl-10"
              />
            </div>
          </div>

          {/* Car status */}
          <div className="space-y-2">
            <Label htmlFor="status">Car Status</Label>

            <Select
              value={formData.status}
              onValueChange={(value) =>
                handleChange("status", value as TCarStatus)
              }
              disabled={isView || loading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>

              <SelectContent>
                {carStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="carImage">Car Image (Optional)</Label>
            <Input
              id="carImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isView || loading || imageUploading}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024)) {
                  setSubmitError("Choose a JPEG, PNG, or WebP image up to 5 MB.");
                  event.target.value = "";
                  return;
                }
                setSubmitError("");
                setImageFile(file);
              }}
            />
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Car preview"
                className="h-40 w-full rounded-md border object-cover md:max-w-sm"
              />
            ) : (
              <p className="text-xs text-muted-foreground">No car image uploaded.</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">
              Description (Optional)
            </Label>

            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) =>
                  handleChange(
                    "description",
                    event.target.value,
                  )
                }
                placeholder="Additional information about your car..."
                rows={4}
                disabled={isView || loading}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          {isView ? "Close" : "Cancel"}
        </Button>

        {!isView && (
          <Button
            type="submit"
            disabled={
              loading ||
              imageUploading ||
              isProfileLoading ||
              customerError ||
              !customer ||
              !ownerName ||
              !ownerEmail ||
              !ownerPhone ||
              societyLoading ||
              flatLoading ||
              societiesError ||
              flatsError ||
              societies.length === 0 ||
              !formData.societyId ||
              availableFlats.length === 0
            }
            className="gap-2"
          >
            {loading || imageUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {imageUploading ? "Uploading image..." : isEdit ? "Updating..." : "Registering..."}
              </>
            ) : (
              <>
                <CarFront className="h-4 w-4" />
                {isEdit ? "Update Car" : "Register Car"}
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
};

export default CCarForm;