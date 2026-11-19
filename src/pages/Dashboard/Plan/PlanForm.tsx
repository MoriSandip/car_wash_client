import React, { useEffect, useState } from "react";
import type {
  TPlan,
  TPlanPayload,
  TPlanStatus,
  TBillingCycle,
} from "@/redux/features/plan/planApi";
import { useGetSocietiesQuery } from "@/redux/features/society/societyApi";

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

type TSocietyOption = { _id: string; name: string; city?: string };
type Props = {
  initialData?: TPlan | null;
  mode: "add" | "edit" | "view";
  loading?: boolean;
  onSubmit: (data: TPlanPayload) => Promise<void> | void;
  onClose: () => void;
};

const defaultForm: TPlanPayload = {
  societyId: "",
  name: "",
  description: "",
  billingCycle: "Monthly",
  price: 0,
  includedWashes: 30,
  validityDays: 30,
  services: ["Exterior Wash", "Interior Cleaning"],
  status: "Active",
};

const getSocieties = (response: any): TSocietyOption[] => {
  const value = response?.data;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.result)) return value.result;
  return [];
};

const getSocietyId = (plan?: TPlan | null) => {
  if (!plan) return "";
  return typeof plan.societyId === "string"
    ? plan.societyId
    : plan.societyId?._id || "";
};

const PlanForm: React.FC<Props> = ({
  initialData,
  mode,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const [form, setForm] = useState<TPlanPayload>(defaultForm);
  const [servicesText, setServicesText] = useState(defaultForm.services.join(", "));
  const [error, setError] = useState("");
  const { data: societyResponse, isLoading: societiesLoading } =
    useGetSocietiesQuery();
  const societies = getSocieties(societyResponse);
  const isView = mode === "view";

  useEffect(() => {
    if (initialData) {
      const services = initialData.services || [];
      setForm({
        societyId: getSocietyId(initialData),
        name: initialData.name || "",
        description: initialData.description || "",
        billingCycle: initialData.billingCycle || "Monthly",
        price: initialData.price ?? 0,
        includedWashes: initialData.includedWashes ?? 0,
        validityDays: initialData.validityDays ?? 30,
        services,
        status: initialData.status || "Active",
      });
      setServicesText(services.join(", "));
    } else {
      setForm(defaultForm);
      setServicesText(defaultForm.services.join(", "));
    }
    setError("");
  }, [initialData, mode]);

  const updateField = <K extends keyof TPlanPayload>(
    key: K,
    value: TPlanPayload[K]
  ) => setForm((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const services = servicesText
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, index, all) => all.findIndex(
        (candidate) => candidate.toLowerCase() === item.toLowerCase()
      ) === index);

    if (!form.societyId) return setError("Please select a Society.");
    if (!form.name.trim()) return setError("Plan name is required.");
    if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0)
      return setError("Price must be zero or greater.");
    if (!Number.isInteger(Number(form.includedWashes)) || Number(form.includedWashes) < 0)
      return setError("Included washes must be a whole number of zero or greater.");
    if (!Number.isInteger(Number(form.validityDays)) || Number(form.validityDays) < 1)
      return setError("Validity must be at least 1 day.");
    if (services.length === 0) return setError("Enter at least one cleaning service.");

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || "",
        price: Number(form.price),
        includedWashes: Number(form.includedWashes),
        validityDays: Number(form.validityDays),
        services,
      });
    } catch (err: any) {
      setError(
        err?.data?.message || err?.message || "Unable to save Plan. Please try again."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="societyId">Society *</Label>
          <Select
            value={form.societyId}
            onValueChange={(value) => updateField("societyId", value)}
            disabled={isView || societiesLoading}
          >
            <SelectTrigger id="societyId">
              <SelectValue placeholder={societiesLoading ? "Loading Societies..." : "Select Society"} />
            </SelectTrigger>
            <SelectContent>
              {societies.map((society) => (
                <SelectItem key={society._id} value={society._id}>
                  {society.name}{society.city ? ` — ${society.city}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Plan Name *</Label>
          <Input id="name" value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Premium Plan" maxLength={80} required disabled={isView} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="billingCycle">Billing Cycle *</Label>
          <Select value={form.billingCycle}
            onValueChange={(value) => updateField("billingCycle", value as TBillingCycle)}
            disabled={isView}>
            <SelectTrigger id="billingCycle"><SelectValue placeholder="Select billing cycle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
              <SelectItem value="Half-Yearly">Half-Yearly</SelectItem>
              <SelectItem value="Yearly">Yearly</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price (₹) *</Label>
          <Input id="price" type="number" min={0} step="0.01" value={form.price}
            onChange={(e) => updateField("price", e.target.value === "" ? 0 : Number(e.target.value))}
            required disabled={isView} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="includedWashes">Included Washes *</Label>
          <Input id="includedWashes" type="number" min={0} step={1}
            value={form.includedWashes}
            onChange={(e) => updateField("includedWashes", e.target.value === "" ? 0 : Number(e.target.value))}
            required disabled={isView} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="validityDays">Validity (Days) *</Label>
          <Input id="validityDays" type="number" min={1} step={1}
            value={form.validityDays}
            onChange={(e) => updateField("validityDays", e.target.value === "" ? 0 : Number(e.target.value))}
            required disabled={isView} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={form.status}
            onValueChange={(value) => updateField("status", value as TPlanStatus)}
            disabled={isView}>
            <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="services">Included Cleaning Services *</Label>
          <Textarea id="services" value={servicesText}
            onChange={(e) => setServicesText(e.target.value)}
            placeholder="Exterior Wash, Interior Cleaning, Dashboard, Tyre Dressing"
            rows={3} disabled={isView} />
          <p className="text-xs text-muted-foreground">Separate services with commas or new lines.</p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={form.description || ""}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Optional plan details..." rows={3} disabled={isView} />
        </div>
      </div>

      {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose}>{isView ? "Close" : "Cancel"}</Button>
        {!isView && <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : mode === "edit" ? "Update Plan" : "Create Plan"}
        </Button>}
      </div>
    </form>
  );
};

export default PlanForm;
