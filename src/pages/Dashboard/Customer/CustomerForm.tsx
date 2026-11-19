import React, { useEffect, useState } from "react";
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
import type {
  TCustomer,
  TCustomerPayload,
} from "@/redux/features/customer/customerApi";

type TCustomerFormProps = {
  initialData?: TCustomer | null;
  mode: "add" | "edit" | "view";
  loading?: boolean;
  onSubmit: (data: TCustomerPayload) => Promise<void> | void;
  onClose: () => void;
};

const emptyForm: TCustomerPayload = {
  name: "",
  email: "",
  phone: "",
  password: "",
  address: "",
  status: "ACTIVE",
};

const getErrorMessage = (error: unknown) => {
  const response = error as {
    data?: { message?: string };
    message?: string;
  };
  return (
    response.data?.message ||
    response.message ||
    "Unable to save customer. Please try again."
  );
};

const CustomerForm: React.FC<TCustomerFormProps> = ({
  initialData,
  mode,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const [form, setForm] = useState<TCustomerPayload>({ ...emptyForm });
  const [error, setError] = useState("");
  const isView = mode === "view";

  useEffect(() => {
    setForm(
      initialData
        ? {
            name: initialData.name || "",
            email: initialData.email || "",
            phone: initialData.phone || "",
            password: "",
            address: initialData.address || "",
            status: initialData.status || "ACTIVE",
          }
        : { ...emptyForm },
    );
    setError("");
  }, [initialData, mode]);

  const updateField = <K extends keyof TCustomerPayload>(
    key: K,
    value: TCustomerPayload[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!name || !email || !phone) {
      setError("Name, email and phone are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (phone.length < 10) {
      setError("Phone number must be at least 10 characters.");
      return;
    }
    if (mode === "add" && (form.password || "").length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const payload: TCustomerPayload = {
      name,
      email,
      phone,
      address: form.address?.trim() || "",
      status: form.status || "ACTIVE",
    };
    if (mode === "add") payload.password = form.password;

    try {
      await onSubmit(payload);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer-name">Full Name *</Label>
          <Input
            id="customer-name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Enter full name"
            disabled={isView}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-email">Email *</Label>
          <Input
            id="customer-email"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="customer@example.com"
            disabled={isView}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-phone">Phone *</Label>
          <Input
            id="customer-phone"
            type="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="Enter phone number"
            disabled={isView}
            required
          />
        </div>
        {mode === "add" && (
          <div className="space-y-2">
            <Label htmlFor="customer-password">
              Password {mode === "add" ? "*" : ""}
            </Label>
            <Input
              id="customer-password"
              type="password"
              value={form.password || ""}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              required={mode === "add"}
            />
          </div>
        )}
        {mode !== "add" && (
          <div className="space-y-2">
            <Label>Account Status *</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                updateField("status", value as TCustomer["status"])
              }
              disabled={isView}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customer-address">Address</Label>
          <Textarea
            id="customer-address"
            value={form.address || ""}
            onChange={(event) => updateField("address", event.target.value)}
            placeholder="Enter customer address"
            rows={3}
            disabled={isView}
          />
        </div>
      </div>

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
                ? "Update Customer"
                : "Create Customer"}
          </Button>
        )}
      </div>
    </form>
  );
};

export default CustomerForm;
