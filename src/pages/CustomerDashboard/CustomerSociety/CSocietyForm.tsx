
import React, { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  UserRound,
  Phone,
  Mail,
  FileText,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import type {
  TSociety,
  TSocietyPayload,
} from "@/redux/features/society/societyApi";

type TSocietyStatus = "PENDING" | "VERIFIED" | "REJECTED";

interface SocietyFormProps {
  initialData?: TSociety | null;
  mode: "add" | "edit" | "view";
  loading?: boolean;
  onSubmit: (data: TSocietyPayload) => void | Promise<void>;
  onClose: () => void;
}

interface TFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: string;
  phone: string;
  email: string;
  description: string;
}

const emptyForm: TFormData = {
  name: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  contactPerson: "",
  phone: "",
  email: "",
  description: "",
};

const statusConfig: Record<
  TSocietyStatus,
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

const getSocietyStatus = (
  status?: string,
): TSocietyStatus => {
  const normalized = status?.toUpperCase();

  if (
    normalized === "VERIFIED" ||
    normalized === "REJECTED" ||
    normalized === "PENDING"
  ) {
    return normalized;
  }

  return "PENDING";
};

const CSocietyForm: React.FC<SocietyFormProps> = ({
  initialData,
  mode,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState<TFormData>(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof TFormData, string>>
  >({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name ?? "",
        address: initialData.address ?? "",
        city: initialData.city ?? "",
        state: initialData.state ?? "",
        pincode: initialData.pincode ?? "",
        contactPerson: initialData.contactPerson ?? "",
        phone: initialData.phone ?? "",
        email: initialData.email ?? "",
        description: initialData.description ?? "",
      });
    } else {
      setFormData(emptyForm);
    }

    setErrors({});
    setSubmitError("");
  }, [initialData, mode]);

  const status = getSocietyStatus(
    (initialData as (TSociety & { status?: string }) | null)
      ?.status,
  );

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

  const validateForm = () => {
    const nextErrors: Partial<
      Record<keyof TFormData, string>
    > = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Society name is required.";
    }

    if (!formData.address.trim()) {
      nextErrors.address = "Address is required.";
    }

    if (!formData.city.trim()) {
      nextErrors.city = "City is required.";
    }

    if (
      formData.pincode.trim() &&
      !/^\d{6}$/.test(formData.pincode.trim())
    ) {
      nextErrors.pincode = "Enter a valid 6-digit pincode.";
    }

    if (
      formData.phone.trim() &&
      !/^[6-9]\d{9}$/.test(formData.phone.trim())
    ) {
      nextErrors.phone =
        "Enter a valid 10-digit Indian mobile number.";
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim(),
      )
    ) {
      nextErrors.email = "Enter a valid email address.";
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

    const payload: TSocietyPayload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      contactPerson: formData.contactPerson.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      description: formData.description.trim(),
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data
          ?.message === "string"
          ? (error as { data: { message: string } }).data.message
          : error instanceof Error
            ? error.message
            : "Unable to save society. Please try again.";

      setSubmitError(message);
    }
  };

  const renderField = (
    field: keyof TFormData,
    label: string,
    placeholder: string,
    icon: React.ReactNode,
    options?: {
      required?: boolean;
      type?: string;
      maxLength?: number;
    },
  ) => (
    <div className="space-y-2" key={field}>
      <Label htmlFor={field}>
        {label}
        {options?.required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </Label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>

        <Input
          id={field}
          type={options?.type ?? "text"}
          value={formData[field]}
          onChange={(event) => {
            let value = event.target.value;

            if (field === "pincode") {
              value = value.replace(/\D/g, "").slice(0, 6);
            }

            if (field === "phone") {
              value = value.replace(/\D/g, "").slice(0, 10);
            }

            handleChange(field, value);
          }}
          placeholder={placeholder}
          maxLength={options?.maxLength}
          disabled={isView || loading}
          aria-invalid={Boolean(errors[field])}
          className={`pl-10 ${
            errors[field] ? "border-red-500 focus-visible:ring-red-500" : ""
          }`}
        />
      </div>

      {errors[field] && (
        <p className="text-xs text-red-500">
          {errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer verification status */}
      {initialData && (
        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="font-semibold">
                  Verification Status
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Society verification is managed by the administrator.
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={statusConfig[status].className}
            >
              {statusConfig[status].icon}
              {statusConfig[status].label}
            </Badge>
          </div>

          {status === "REJECTED" &&
            "verificationNote" in initialData &&
            initialData.verificationNote && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                  <XCircle className="h-4 w-4" />
                  Administrator's Rejection Reason
                </p>
                <p className="mt-1 text-sm text-red-700">
                  {
                    (
                      initialData as TSociety & {
                        verificationNote?: string;
                      }
                    ).verificationNote
                  }
                </p>
              </div>
            )}
        </div>
      )}

      {/* Society details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">
              Society Information
            </h3>
            <p className="text-xs text-muted-foreground">
              Enter the basic details of your society.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderField(
            "name",
            "Society Name",
            "Enter society name",
            <Building2 className="h-4 w-4" />,
            { required: true },
          )}

          {renderField(
            "contactPerson",
            "Contact Person",
            "Enter contact person's name",
            <UserRound className="h-4 w-4" />,
          )}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">
              Address <span className="text-red-500">*</span>
            </Label>

            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Textarea
                id="address"
                value={formData.address}
                onChange={(event) =>
                  handleChange("address", event.target.value)
                }
                placeholder="Enter complete society address"
                disabled={isView || loading}
                aria-invalid={Boolean(errors.address)}
                className={`min-h-20 pl-10 ${
                  errors.address ? "border-red-500" : ""
                }`}
              />
            </div>

            {errors.address && (
              <p className="text-xs text-red-500">
                {errors.address}
              </p>
            )}
          </div>

          {renderField(
            "city",
            "City",
            "Enter city",
            <MapPin className="h-4 w-4" />,
            { required: true },
          )}

          {renderField(
            "state",
            "State",
            "Enter state",
            <MapPin className="h-4 w-4" />,
          )}

          {renderField(
            "pincode",
            "Pincode",
            "6-digit pincode",
            <MapPin className="h-4 w-4" />,
            { maxLength: 6 },
          )}
        </div>
      </div>

      {/* Contact details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Phone className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">
              Contact Information
            </h3>
            <p className="text-xs text-muted-foreground">
              Provide contact details for communication.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderField(
            "phone",
            "Mobile Number",
            "10-digit mobile number",
            <Phone className="h-4 w-4" />,
            { maxLength: 10 },
          )}

          {renderField(
            "email",
            "Email Address",
            "example@email.com",
            <Mail className="h-4 w-4" />,
            { type: "email" },
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
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
            placeholder="Enter additional information about your society"
            disabled={isView || loading}
            className="min-h-24 pl-10"
          />
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
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Registering..."}
              </>
            ) : (
              <>
                {isEdit ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                {isEdit ? "Update Society" : "Register Society"}
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
};

export default CSocietyForm;
