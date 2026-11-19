import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Layers3,
  Home,
  Ruler,
  FileText,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGetMySocietiesQuery } from "@/redux/features/society/societyApi";

import type {
  TFlat,
  TFlatPayload,
  TFlatStatus,
  TFlatVerificationStatus,
} from "@/redux/features/flat/flatApi";

interface CFlatFormProps {
  initialData?: TFlat | null;
  mode: "add" | "edit" | "view";
  loading?: boolean;
  onSubmit: (data: TFlatPayload) => void | Promise<void>;
  onClose: () => void;
}

interface TSociety {
  _id: string;
  name?: string;
  societyName?: string;
  status?: string;
  isDeleted?: boolean;
}

interface TFormData {
  societyId: string;
  flatNumber: string;
  block: string;
  floorNumber: string;
  flatType: string;
  area: string;
  status: TFlatStatus;
  description: string;
}

const emptyForm: TFormData = {
  societyId: "",
  flatNumber: "",
  block: "",
  floorNumber: "0",
  flatType: "2BHK",
  area: "",
  status: "Available",
  description: "",
};

const statusConfig: Record<
  TFlatVerificationStatus,
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
): TFlatVerificationStatus => {
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

const getSocietyId = (
  value: TFlat["societyId"] | undefined,
): string => {
  if (!value) return "";

  return typeof value === "string" ? value : value._id;
};

const getApiError = (error: unknown): string => {
  if (!error || typeof error !== "object") {
    return "Unable to save flat. Please try again.";
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
    "Unable to save flat. Please try again."
  );
};

const CFlatForm: React.FC<CFlatFormProps> = ({
  initialData,
  mode,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const {
    data: societyResponse,
    isLoading: societiesLoading,
    isFetching: societiesFetching,
    isError: societiesError,
    error: societyError,
    refetch: refetchSocieties,
  } = useGetMySocietiesQuery();

  const societies = useMemo(
    () =>
      getSocieties(societyResponse).filter(
        (society) => society.isDeleted !== true,
      ),
    [societyResponse],
  );

  const [formData, setFormData] = useState<TFormData>(emptyForm);

  const [errors, setErrors] = useState<
    Partial<Record<keyof TFormData, string>>
  >({});

  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        societyId: getSocietyId(initialData.societyId),
        flatNumber: initialData.flatNumber ?? "",
        block: initialData.block ?? "",
        floorNumber: String(initialData.floorNumber ?? 0),
        flatType: initialData.flatType ?? "2BHK",
        area:
          initialData.area == null
            ? ""
            : String(initialData.area),
        status: initialData.status ?? "Available",
        description: initialData.description ?? "",
      });
    } else {
      setFormData({ ...emptyForm });
    }

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

    if (!formData.flatNumber.trim()) {
      nextErrors.flatNumber = "Flat number is required.";
    } else if (formData.flatNumber.trim().length > 30) {
      nextErrors.flatNumber =
        "Flat number cannot exceed 30 characters.";
    }

    if (
      !formData.floorNumber.trim() ||
      !Number.isInteger(Number(formData.floorNumber)) ||
      Number(formData.floorNumber) < 0
    ) {
      nextErrors.floorNumber =
        "Enter a valid non-negative floor number.";
    }

    if (
      formData.area.trim() !== "" &&
      (!Number.isFinite(Number(formData.area)) ||
        Number(formData.area) < 0)
    ) {
      nextErrors.area = "Enter a valid area.";
    }

    if (!formData.flatType.trim()) {
      nextErrors.flatType = "Please select a flat type.";
    }

    if (!formData.status) {
      nextErrors.status = "Please select a flat status.";
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

    if (!validateForm()) return;

    const payload: TFlatPayload = {
      societyId: formData.societyId,
      flatNumber: formData.flatNumber.trim().toUpperCase(),
      block: formData.block.trim(),
      floorNumber: Number(formData.floorNumber),
      flatType: formData.flatType,
      area:
        formData.area.trim() === ""
          ? 0
          : Number(formData.area),
      status: formData.status,
      description: formData.description.trim(),
    };

    try {
      await onSubmit(payload);
    } catch (error: unknown) {
      setSubmitError(getApiError(error));
    }
  };

  const verificationStatus = getVerificationStatus(
    initialData?.verificationStatus,
  );

  const societyErrorMessage = getApiError(societyError);

  const societyLoading = societiesLoading || societiesFetching;

  const title =
    mode === "add"
      ? "Register Flat"
      : mode === "edit"
        ? "Edit My Flat"
        : "Flat Details";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Verification status */}
      {initialData && (
        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="font-semibold">
                  Flat Verification
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your flat is reviewed by the administrator.
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={statusConfig[verificationStatus].className}
            >
              {statusConfig[verificationStatus].icon}
              {statusConfig[verificationStatus].label}
            </Badge>
          </div>

          {verificationStatus === "PENDING" && (
            <p className="mt-3 text-sm text-amber-700">
              Your flat registration is waiting for admin approval.
            </p>
          )}

          {verificationStatus === "VERIFIED" && (
            <p className="mt-3 text-sm text-emerald-700">
              Your flat has been verified successfully.
            </p>
          )}

          {verificationStatus === "REJECTED" &&
            initialData.verificationNote && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                  <XCircle className="h-4 w-4" />
                  Administrator&apos;s Rejection Reason
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                  {initialData.verificationNote}
                </p>
              </div>
            )}
        </div>
      )}

      {/* Flat information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Building2 className="h-5 w-5 text-primary" />

          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">
              Enter your flat information below.
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
              disabled={isView || loading || societyLoading}
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
                  No societies found for your account. Register a
                  society first or check its availability in your
                  account.
                </p>
              )}
          </div>

          {/* Flat number */}
          <div className="space-y-2">
            <Label htmlFor="flatNumber">
              Flat Number <span className="text-red-500">*</span>
            </Label>

            <div className="relative">
              <Home className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="flatNumber"
                value={formData.flatNumber}
                onChange={(event) =>
                  handleChange("flatNumber", event.target.value)
                }
                placeholder="e.g. A-101"
                maxLength={30}
                disabled={isView || loading}
                aria-invalid={Boolean(errors.flatNumber)}
                className={`pl-10 ${
                  errors.flatNumber ? "border-red-500" : ""
                }`}
              />
            </div>

            {errors.flatNumber && (
              <p className="text-xs text-red-500">
                {errors.flatNumber}
              </p>
            )}
          </div>

          {/* Block */}
          <div className="space-y-2">
            <Label htmlFor="block">Block / Wing</Label>

            <div className="relative">
              <Layers3 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="block"
                value={formData.block}
                onChange={(event) =>
                  handleChange("block", event.target.value)
                }
                placeholder="e.g. A Wing"
                disabled={isView || loading}
                className="pl-10"
              />
            </div>
          </div>

          {/* Floor */}
          <div className="space-y-2">
            <Label htmlFor="floorNumber">Floor Number</Label>

            <Input
              id="floorNumber"
              type="number"
              min={0}
              step={1}
              value={formData.floorNumber}
              onChange={(event) =>
                handleChange("floorNumber", event.target.value)
              }
              disabled={isView || loading}
              aria-invalid={Boolean(errors.floorNumber)}
              className={
                errors.floorNumber ? "border-red-500" : ""
              }
            />

            {errors.floorNumber && (
              <p className="text-xs text-red-500">
                {errors.floorNumber}
              </p>
            )}
          </div>

          {/* Flat type */}
          <div className="space-y-2">
            <Label htmlFor="flatType">Flat Type</Label>

            <Select
              value={formData.flatType}
              onValueChange={(value) =>
                handleChange("flatType", value)
              }
              disabled={isView || loading}
            >
              <SelectTrigger id="flatType">
                <SelectValue placeholder="Select flat type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="1RK">1RK</SelectItem>
                <SelectItem value="1BHK">1BHK</SelectItem>
                <SelectItem value="2BHK">2BHK</SelectItem>
                <SelectItem value="3BHK">3BHK</SelectItem>
                <SelectItem value="4BHK">4BHK</SelectItem>
                <SelectItem value="Penthouse">Penthouse</SelectItem>
                <SelectItem value="Studio">Studio</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Area */}
          <div className="space-y-2">
            <Label htmlFor="area">Area (sq. ft.)</Label>

            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="area"
                type="number"
                min={0}
                step="any"
                value={formData.area}
                onChange={(event) =>
                  handleChange("area", event.target.value)
                }
                placeholder="e.g. 1200"
                disabled={isView || loading}
                aria-invalid={Boolean(errors.area)}
                className={`pl-10 ${
                  errors.area ? "border-red-500" : ""
                }`}
              />
            </div>

            {errors.area && (
              <p className="text-xs text-red-500">
                {errors.area}
              </p>
            )}
          </div>

          {/* Occupancy status */}
          <div className="space-y-2">
            <Label htmlFor="status">Flat Status</Label>

            <Select
              value={formData.status}
              onValueChange={(value) =>
                handleChange("status", value as TFlatStatus)
              }
              disabled={isView || loading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select flat status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Occupied">Occupied</SelectItem>
                <SelectItem value="Maintenance">
                  Maintenance
                </SelectItem>
              </SelectContent>
            </Select>
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
                  handleChange("description", event.target.value)
                }
                placeholder="Enter additional information about your flat..."
                rows={4}
                disabled={isView || loading}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* API error */}
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
              societyLoading ||
              societiesError ||
              societies.length === 0
            }
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Registering..."}
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                {isEdit ? "Update Flat" : "Register Flat"}
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
};

export default CFlatForm;