
import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock3,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useGetSocietiesQuery } from "@/redux/features/society/societyApi";

import type {
  TFlat,
  TFlatPayload,
  TFlatStatus,
  TFlatVerificationStatus,
} from "@/redux/features/flat/flatApi";

interface FlatFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TFlatPayload) => Promise<void> | void;
  initialData?: TFlat | null;
  mode: "add" | "edit" | "view";
  loading?: boolean;
}

interface TSociety {
  _id: string;
  name?: string;
  societyName?: string;
  verificationStatus?: string;
  status?: string;
}

interface TSocietyResponse {
  data?: TSociety[] | { result?: TSociety[]; data?: TSociety[] };
  result?: TSociety[];
}

const getSocietyId = (
  societyId: TFlat["societyId"] | undefined,
): string => {
  if (!societyId) return "";
  return typeof societyId === "string" ? societyId : societyId._id;
};

const getSocieties = (response: unknown): TSociety[] => {
  if (!response || typeof response !== "object") return [];

  const result = response as TSocietyResponse;

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (result.data && typeof result.data === "object") {
    if (Array.isArray(result.data.result)) {
      return result.data.result;
    }

    if (Array.isArray(result.data.data)) {
      return result.data.data;
    }
  }

  if (Array.isArray(result.result)) {
    return result.result;
  }

  return [];
};

const getVerificationLabel = (
  status?: TFlatVerificationStatus,
): string => {
  switch (status) {
    case "VERIFIED":
      return "Verified";
    case "REJECTED":
      return "Rejected";
    default:
      return "Pending Approval";
  }
};

const getVerificationClasses = (
  status?: TFlatVerificationStatus,
): string => {
  switch (status) {
    case "VERIFIED":
      return "border-green-200 bg-green-50 text-green-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
};

const FlatForm: React.FC<FlatFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  loading = false,
}) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const {
    data: societyResponse,
    isLoading: societiesLoading,
    isError: societiesError,
  } = useGetSocietiesQuery();

  const societies = getSocieties(societyResponse);

  const [formData, setFormData] = useState<TFlatPayload>({
    societyId: "",
    flatNumber: "",
    block: "",
    floorNumber: 0,
    flatType: "2BHK",
    area: 0,
    status: "Available",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        societyId: getSocietyId(initialData.societyId),
        flatNumber: initialData.flatNumber || "",
        block: initialData.block || "",
        floorNumber: Number(initialData.floorNumber ?? 0),
        flatType: initialData.flatType || "2BHK",
        area: Number(initialData.area ?? 0),
        status: initialData.status || "Available",
        description: initialData.description || "",
      });
    } else {
      setFormData({
        societyId: "",
        flatNumber: "",
        block: "",
        floorNumber: 0,
        flatType: "2BHK",
        area: 0,
        status: "Available",
        description: "",
      });
    }

    setErrors({});
    setSubmitError("");
  }, [initialData, open]);

  const updateField = <K extends keyof TFlatPayload>(
    field: K,
    value: TFlatPayload[K],
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

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!formData.societyId.trim()) {
      nextErrors.societyId = "Please select a society.";
    }

    if (!formData.flatNumber.trim()) {
      nextErrors.flatNumber = "Flat number is required.";
    } else if (formData.flatNumber.trim().length > 30) {
      nextErrors.flatNumber = "Flat number cannot exceed 30 characters.";
    }

    if (
      formData.floorNumber === undefined ||
      !Number.isFinite(Number(formData.floorNumber)) ||
      Number(formData.floorNumber) < 0
    ) {
      nextErrors.floorNumber = "Enter a valid floor number.";
    }

    if (
      formData.area === undefined ||
      !Number.isFinite(Number(formData.area)) ||
      Number(formData.area) < 0
    ) {
      nextErrors.area = "Enter a valid area.";
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

    if (!validate()) return;

    try {
      await onSubmit({
        societyId: formData.societyId,
        flatNumber: formData.flatNumber.trim().toUpperCase(),
        block: formData.block?.trim() || "",
        floorNumber: Number(formData.floorNumber ?? 0),
        flatType: formData.flatType?.trim() || "2BHK",
        area: Number(formData.area ?? 0),
        status: formData.status,
        description: formData.description?.trim() || "",
      });
    } catch {
      setSubmitError("Unable to save flat. Please try again.");
    }
  };

  const verificationStatus =
    initialData?.verificationStatus || "PENDING";

  const VerificationIcon =
    verificationStatus === "VERIFIED"
      ? ShieldCheck
      : verificationStatus === "REJECTED"
        ? ShieldAlert
        : Clock3;

  const selectedSociety = societies.find(
    (society) => society._id === formData.societyId,
  );

  const title =
    mode === "add"
      ? "Add Flat"
      : mode === "edit"
        ? "Edit Flat"
        : "Flat Details";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {title}
          </DialogTitle>

          <DialogDescription>
            {mode === "add"
              ? "Enter the flat information to create a new flat."
              : mode === "edit"
                ? "Update the flat information below."
                : "View the flat details and approval information."}
          </DialogDescription>
        </DialogHeader>

        {initialData && (
          <div
            className={`rounded-lg border p-4 ${getVerificationClasses(
              verificationStatus,
            )}`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <VerificationIcon className="h-5 w-5" />
              <span>
                Verification Status:{" "}
                {getVerificationLabel(verificationStatus)}
              </span>
            </div>

            {initialData.createdByRole && (
              <p className="mt-2 text-sm">
                Created by: {initialData.createdByRole}
              </p>
            )}

            {initialData.verifiedAt && (
              <p className="mt-1 text-sm">
                Verified on:{" "}
                {new Date(initialData.verifiedAt).toLocaleString()}
              </p>
            )}

            {verificationStatus === "REJECTED" &&
              initialData.verificationNote && (
                <div className="mt-3 rounded-md border border-red-200 bg-white/70 p-3">
                  <p className="text-sm font-semibold">
                    Rejection Reason
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {initialData.verificationNote}
                  </p>
                </div>
              )}

            {verificationStatus === "PENDING" && (
              <p className="mt-2 text-sm">
                This flat is waiting for admin approval.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Society */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">
                Society <span className="text-red-500">*</span>
              </label>

              <Select
                value={formData.societyId}
                onValueChange={(value) =>
                  updateField("societyId", value)
                }
                disabled={isView || societiesLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      societiesLoading
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
                <p className="text-sm text-red-500">
                  {errors.societyId}
                </p>
              )}

              {societiesError && (
                <p className="text-sm text-red-500">
                  Unable to load societies. Please refresh and try again.
                </p>
              )}

              {selectedSociety && (
                <p className="text-xs text-muted-foreground">
                  Selected:{" "}
                  {selectedSociety.name ||
                    selectedSociety.societyName ||
                    "Unnamed Society"}
                </p>
              )}
            </div>

            {/* Flat Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Flat Number <span className="text-red-500">*</span>
              </label>

              <Input
                value={formData.flatNumber}
                onChange={(event) =>
                  updateField("flatNumber", event.target.value)
                }
                placeholder="e.g. A-101"
                maxLength={30}
                disabled={isView}
              />

              {errors.flatNumber && (
                <p className="text-sm text-red-500">
                  {errors.flatNumber}
                </p>
              )}
            </div>

            {/* Block */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Block / Wing
              </label>

              <Input
                value={formData.block || ""}
                onChange={(event) =>
                  updateField("block", event.target.value)
                }
                placeholder="e.g. A Wing"
                disabled={isView}
              />
            </div>

            {/* Floor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Floor Number
              </label>

              <Input
                type="number"
                min={0}
                step={1}
                value={formData.floorNumber ?? 0}
                onChange={(event) =>
                  updateField(
                    "floorNumber",
                    event.target.value === ""
                      ? ("" as unknown as number)
                      : Number(event.target.value),
                  )
                }
                disabled={isView}
              />

              {errors.floorNumber && (
                <p className="text-sm text-red-500">
                  {errors.floorNumber}
                </p>
              )}
            </div>

            {/* Flat Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Flat Type
              </label>

              <Select
                value={formData.flatType || "2BHK"}
                onValueChange={(value) =>
                  updateField("flatType", value)
                }
                disabled={isView}
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium">
                Area (sq. ft.)
              </label>

              <Input
                type="number"
                min={0}
                step="any"
                value={formData.area ?? 0}
                onChange={(event) =>
                  updateField(
                    "area",
                    event.target.value === ""
                      ? ("" as unknown as number)
                      : Number(event.target.value),
                  )
                }
                placeholder="e.g. 1200"
                disabled={isView}
              />

              {errors.area && (
                <p className="text-sm text-red-500">
                  {errors.area}
                </p>
              )}
            </div>

            {/* Flat Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Flat Status
              </label>

              <Select
                value={formData.status}
                onValueChange={(value) =>
                  updateField("status", value as TFlatStatus)
                }
                disabled={isView}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select flat status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Available">
                    Available
                  </SelectItem>
                  <SelectItem value="Occupied">
                    Occupied
                  </SelectItem>
                  <SelectItem value="Maintenance">
                    Maintenance
                  </SelectItem>
                </SelectContent>
              </Select>

              {errors.status && (
                <p className="text-sm text-red-500">
                  {errors.status}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">
                Description
              </label>

              <Textarea
                value={formData.description || ""}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Additional details about this flat..."
                rows={4}
                disabled={isView}
              />
            </div>
          </div>

          {submitError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {isView ? "Close" : "Cancel"}
            </Button>

            {!isView && (
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : isEdit
                    ? "Update Flat"
                    : "Add Flat"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FlatForm;
