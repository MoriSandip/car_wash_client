
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type {
  TSociety,
  TSocietyPayload,
} from "@/redux/features/society/societyApi";

type SocietyFormProps = {
  initialData?: TSociety | null;
  mode: "add" | "edit" | "view";
  loading?: boolean;
  onSubmit: (data: TSocietyPayload) => void | Promise<void>;
  onClose: () => void;
};

const emptyForm: TSocietyPayload = {
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

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  VERIFIED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const SocietyForm: React.FC<SocietyFormProps> = ({
  initialData,
  mode,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] =
    useState<TSocietyPayload>({ ...emptyForm });

  const [error, setError] = useState("");

  const isView = mode === "view";

  // Verification information comes from the API's TSociety type.
  const societyStatus = initialData?.status || (
    mode === "add" ? undefined : "PENDING"
  );

  const verificationNote = initialData?.verificationNote;

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        address: initialData.address || "",
        city: initialData.city || "",
        state: initialData.state || "",
        pincode: initialData.pincode || "",
        contactPerson: initialData.contactPerson || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        description: initialData.description || "",
      });
    } else {
      setFormData({ ...emptyForm });
    }

    setError("");
  }, [initialData, mode]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isView || loading) {
      return;
    }

    setError("");

    const name = formData.name.trim();
    const address = formData.address.trim();
    const city = formData.city.trim();
    const pincode = formData.pincode?.trim() || "";
    const phone = formData.phone?.trim() || "";
    const email = formData.email?.trim() || "";

    if (!name) {
      setError("Society Name is required.");
      return;
    }

    if (!address) {
      setError("Address is required.");
      return;
    }

    if (!city) {
      setError("City is required.");
      return;
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
      setError("Please enter a valid 6-digit Pincode.");
      return;
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Correct email validation regex.
    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    const payload: TSocietyPayload = {
      name,
      address,
      city,
      state: formData.state?.trim() || "",
      pincode,
      contactPerson: formData.contactPerson?.trim() || "",
      phone,
      email,
      description: formData.description?.trim() || "",
    };

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      const apiError = err as {
        data?: {
          message?: string;
          errorSources?: Array<{ message?: string }>;
        };
        message?: string;
      };

      setError(
        apiError?.data?.message ||
          apiError?.data?.errorSources?.[0]?.message ||
          apiError?.message ||
          "Unable to save society. Please try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Society verification status */}
      {societyStatus && (
        <div className="rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Society Verification
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {societyStatus === "PENDING" &&
                  "Your society registration is awaiting admin approval."}

                {societyStatus === "VERIFIED" &&
                  "Your society has been verified by the admin."}

                {societyStatus === "REJECTED" &&
                  "Your society registration has been rejected."}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusStyles[societyStatus] ||
                "bg-gray-100 text-gray-700"
              }`}
            >
              {societyStatus}
            </span>
          </div>

          {/* Rejection reason */}
          {societyStatus === "REJECTED" && verificationNote && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800">
                Rejection Reason
              </p>

              <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                {verificationNote}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Society details */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Society name */}
        <div className="space-y-2">
          <Label htmlFor="society-name">
            Society Name <span className="text-red-500">*</span>
          </Label>

          <Input
            id="society-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter Society Name"
            maxLength={150}
            required
            disabled={isView || loading}
          />
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="society-city">
            City <span className="text-red-500">*</span>
          </Label>

          <Input
            id="society-city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter City"
            required
            disabled={isView || loading}
          />
        </div>

        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="society-state">State</Label>

          <Input
            id="society-state"
            name="state"
            value={formData.state || ""}
            onChange={handleChange}
            placeholder="Enter State"
            disabled={isView || loading}
          />
        </div>

        {/* Pincode */}
        <div className="space-y-2">
          <Label htmlFor="society-pincode">Pincode</Label>

          <Input
            id="society-pincode"
            name="pincode"
            type="text"
            inputMode="numeric"
            value={formData.pincode || ""}
            onChange={handleChange}
            placeholder="Enter 6-digit Pincode"
            maxLength={6}
            disabled={isView || loading}
          />
        </div>

        {/* Contact person */}
        <div className="space-y-2">
          <Label htmlFor="society-contact-person">
            Contact Person
          </Label>

          <Input
            id="society-contact-person"
            name="contactPerson"
            value={formData.contactPerson || ""}
            onChange={handleChange}
            placeholder="Enter Contact Person"
            disabled={isView || loading}
          />
        </div>

        {/* Mobile */}
        <div className="space-y-2">
          <Label htmlFor="society-phone">Mobile Number</Label>

          <Input
            id="society-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={formData.phone || ""}
            onChange={handleChange}
            placeholder="Enter 10-digit Mobile Number"
            disabled={isView || loading}
          />
        </div>

        {/* Email */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="society-email">Email Address</Label>

          <Input
            id="society-email"
            name="email"
            type="email"
            value={formData.email || ""}
            onChange={handleChange}
            placeholder="Enter Email Address"
            disabled={isView || loading}
          />
        </div>

        {/* Address */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="society-address">
            Complete Address <span className="text-red-500">*</span>
          </Label>

          <Textarea
            id="society-address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter complete society address"
            rows={3}
            required
            disabled={isView || loading}
          />
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="society-description">Description</Label>

          <Textarea
            id="society-description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            placeholder="Enter optional details..."
            rows={3}
            disabled={isView || loading}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {/* Form actions */}
      <div className="flex justify-end gap-2 border-t pt-4">
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
              : mode === "edit"
                ? "Update Society"
                : "Register Society"}
          </Button>
        )}
      </div>
    </form>
  );
};

export default SocietyForm;
