import React, { useEffect, useMemo, useState } from "react";
import {
  CarFront,
  Clock3,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useGetSocietiesQuery } from "@/redux/features/society/societyApi";
import {
  useGetFlatsQuery,
  useGetSingleFlatQuery,
} from "@/redux/features/flat/flatApi";

import type {
  TCar,
  TCarPayload,
  TCarStatus,
  TCarType,
} from "@/redux/features/car/carApi";
import imageUpload from "@/utils/ImageUp";

type TVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

type TCarWithVerification = TCar & {
  verificationStatus?: TVerificationStatus;
  verificationNote?: string;
  createdByRole?: string;
  verifiedAt?: string;
};

interface CarFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TCarPayload) => Promise<void> | void;
  initialData?: TCar | null;
  mode: "add" | "edit" | "view";
  loading?: boolean;
}

type TOption = {
  _id?: string;
  id?: string;
  $oid?: string;
  name?: string;
  societyName?: string;
  city?: string;
  status?: string;
  verificationStatus?: string;
  societyId?: unknown;
  society?: unknown;
  society_id?: unknown;
  flatNumber?: string;
  flatNo?: string;
  flatName?: string;
  block?: string;
  floorNumber?: number;
  floor?: number;
  [key: string]: any;
};

const defaultForm: TCarPayload = {
  societyId: "",
  flatId: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  registrationNumber: "",
  make: "",
  model: "",
  color: "",
  imageUrl: "",
  carType: "Hatchback",
  parkingSlot: "",
  status: "Active",
  description: "",
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

const getId = (value: any): string => {
  if (value == null) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const id = value._id ?? value.id ?? value.$oid;

    if (id != null && id !== value) {
      return getId(id);
    }
  }

  return "";
};

const getOptionId = (item: TOption): string =>
  getId(item?._id ?? item?.id ?? item?.$oid);

const getList = (response: unknown): TOption[] => {
  if (!response || typeof response !== "object") return [];

  const value = response as any;
  const candidates = [
    value,
    value.data,
    value.data?.data,
    value.data?.result,
    value.data?.results,
    value.data?.docs,
    value.data?.items,
    value.result,
    value.results,
    value.docs,
    value.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

const getFlatSocietyId = (flat: TOption): string =>
  getId(
    flat.societyId ??
      flat.society ??
      flat.society_id ??
      flat.societyID,
  );

const getFlatLabel = (flat: TOption): string => {
  const label =
    flat.flatNumber ||
    flat.flatNo ||
    flat.flatName ||
    flat.name ||
    getOptionId(flat);

  const block = flat.block ? ` — ${flat.block}` : "";
  const floorValue = flat.floorNumber ?? flat.floor;
  const floor =
    floorValue != null ? ` (Floor ${floorValue})` : "";

  return `${label}${block}${floor}`;
};

const getVerificationStatus = (
  car: TCarWithVerification | null | undefined,
): TVerificationStatus => car?.verificationStatus || "VERIFIED";

const CarForm: React.FC<CarFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  loading = false,
}) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const [form, setForm] = useState<TCarPayload>({
    ...defaultForm,
  });
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(form.imageUrl || "");
      return;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.imageUrl, imageFile]);

  const {
    data: societyResponse,
    isLoading: societiesLoading,
    isError: societiesError,
  } = useGetSocietiesQuery();

  const {
    data: flatResponse,
    isLoading: flatsLoading,
    isError: flatsError,
  } = useGetFlatsQuery();

  const societies = useMemo(
    () => getList(societyResponse),
    [societyResponse],
  );

  const allFlats = useMemo(
    () => getList(flatResponse),
    [flatResponse],
  );

  useEffect(() => {
    if (!open) return;

    if (!initialData) {
      setForm({ ...defaultForm });
      setError("");
      setImageFile(null);
      return;
    }

    const car = initialData as TCarWithVerification & {
      society?: unknown;
      flat?: unknown;
    };

    setForm({
      societyId: getId(car.societyId ?? car.society),
      flatId: getId(car.flatId ?? car.flat),
      ownerName: car.ownerName || "",
      ownerPhone: car.ownerPhone || "",
      ownerEmail: car.ownerEmail || "",
      registrationNumber: car.registrationNumber || "",
      make: car.make || "",
      model: car.model || "",
      color: car.color || "",
      imageUrl: car.imageUrl || "",
      carType: car.carType || "Hatchback",
      parkingSlot: car.parkingSlot || "",
      status: car.status || "Active",
      description: car.description || "",
    });

    setError("");
    setImageFile(null);
  }, [initialData, open]);

  const societyId = getId(form.societyId);
  const flatId = getId(form.flatId);
  const { data: selectedFlatResponse } = useGetSingleFlatQuery(flatId, {
    skip: !open || !flatId,
  });

  const selectedSociety = societies.find(
    (society) => getOptionId(society) === societyId,
  );

  const availableFlats = useMemo(() => {
    if (!societyId) return [];

    const matchingFlats = allFlats.filter(
      (flat) => getFlatSocietyId(flat) === societyId,
    );

    const uniqueFlats = new Map<string, TOption>();

    matchingFlats.forEach((flat) => {
      const id = getOptionId(flat);
      if (id) uniqueFlats.set(id, flat);
    });

    const car = initialData as
      | (TCarWithVerification & {
          society?: unknown;
          flat?: unknown;
        })
      | null
      | undefined;

    const originalSocietyId = getId(car?.societyId ?? car?.society);
    const originalFlat = car?.flatId ?? car?.flat;
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
      !uniqueFlats.has(originalFlatId)
    ) {
      const savedFlat =
        fetchedFlat && getOptionId(fetchedFlat) === originalFlatId
          ? fetchedFlat
          : originalFlat && typeof originalFlat === "object"
            ? (originalFlat as TOption)
            : undefined;
      const savedSocietyId = savedFlat
        ? getFlatSocietyId(savedFlat)
        : "";

      if (savedFlat && (!savedSocietyId || savedSocietyId === societyId)) {
        uniqueFlats.set(originalFlatId, {
          ...savedFlat,
          _id: originalFlatId,
        });
      }
    }

    return Array.from(uniqueFlats.values());
  }, [allFlats, societyId, initialData, selectedFlatResponse]);

  const updateField = <K extends keyof TCarPayload>(
    key: K,
    value: TCarPayload[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
    setError("");
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");

    if (isView) {
      onClose();
      return;
    }

    if (!societyId) {
      setError("Please select a Society.");
      return;
    }

    if (!flatId) {
      setError("Please select a Flat.");
      return;
    }

    const selectedFlat = availableFlats.find(
      (flat) => getOptionId(flat) === flatId,
    );

    if (!selectedFlat) {
      setError(
        "The selected Flat is unavailable. Please select a Flat belonging to this Society.",
      );
      return;
    }

    const flatSocietyId = getFlatSocietyId(selectedFlat);

    if (flatSocietyId && flatSocietyId !== societyId) {
      setError("The selected Flat does not belong to this Society.");
      return;
    }

    if (!form.ownerName.trim()) {
      setError("Owner Name is required.");
      return;
    }

    if (!form.ownerPhone.trim()) {
      setError("Owner Phone is required.");
      return;
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(form.ownerPhone.trim())) {
      setError("Please enter a valid owner phone number.");
      return;
    }

    if (
      form.ownerEmail?.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail.trim())
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!form.registrationNumber.trim()) {
      setError("Registration Number is required.");
      return;
    }

    if (!form.make.trim()) {
      setError("Car Make is required.");
      return;
    }

    if (!form.model.trim()) {
      setError("Car Model is required.");
      return;
    }

    if (!form.color.trim()) {
      setError("Car Color is required.");
      return;
    }

    const payload: TCarPayload = {
      societyId,
      flatId,
      ownerName: form.ownerName.trim(),
      ownerPhone: form.ownerPhone.trim(),
      ownerEmail: form.ownerEmail?.trim() || "",
      registrationNumber: form.registrationNumber
        .trim()
        .toUpperCase(),
      make: form.make.trim(),
      model: form.model.trim(),
      color: form.color.trim(),
      imageUrl: form.imageUrl || "",
      carType: form.carType,
      parkingSlot: form.parkingSlot?.trim() || "",
      status: form.status,
      description: form.description?.trim() || "",
    };

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
    } catch (submitError: any) {
      setError(
        submitError?.data?.message ||
          submitError?.message ||
          "Unable to save car. Please try again.",
      );
    } finally {
      setImageUploading(false);
    }
  };

  const car = initialData as TCarWithVerification | null | undefined;
  const verificationStatus = getVerificationStatus(car);

  const verificationClass =
    verificationStatus === "VERIFIED"
      ? "border-green-200 bg-green-50 text-green-700"
      : verificationStatus === "REJECTED"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "add"
              ? "Add Car"
              : mode === "edit"
                ? "Edit Car"
                : "View Car"}
          </DialogTitle>
          <DialogDescription>
            {isView
              ? "View the car, owner and verification details."
              : isEdit
                ? "Update the selected car details."
                : "Enter the car, owner, society and flat details."}
          </DialogDescription>
        </DialogHeader>

        {initialData && (
          <div className="rounded-lg border p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <CarFront className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">
                    {(car?.registrationNumber || "Car registration") as string}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {car?.make} {car?.model}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${verificationClass}`}
              >
                {verificationStatus === "VERIFIED" ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : verificationStatus === "REJECTED" ? (
                  <ShieldAlert className="h-3.5 w-3.5" />
                ) : (
                  <Clock3 className="h-3.5 w-3.5" />
                )}
                {verificationStatus === "VERIFIED"
                  ? "Verified"
                  : verificationStatus === "REJECTED"
                    ? "Rejected"
                    : "Pending Approval"}
              </span>
            </div>

            {verificationStatus === "REJECTED" &&
              car?.verificationNote && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-semibold">Rejection reason</p>
                  <p className="mt-1">{car.verificationNote}</p>
                </div>
              )}

            {car?.verifiedAt && verificationStatus === "VERIFIED" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Verified on:{" "}
                {new Date(car.verifiedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-4">
            <h3 className="border-b pb-2 text-sm font-semibold">
              Society & Flat Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="carSociety">Society *</Label>
                <Select
                  value={societyId}
                  onValueChange={(value) => {
                    if (value === societyId) return;

                    setForm((previous) => ({
                      ...previous,
                      societyId: value,
                      flatId: "",
                    }));
                    setError("");
                  }}
                  disabled={isView || loading || societiesLoading}
                >
                  <SelectTrigger id="carSociety">
                    <SelectValue
                      placeholder={
                        societiesLoading
                          ? "Loading societies..."
                          : "Select Society"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {societies.map((society) => {
                      const id = getOptionId(society);
                      if (!id) return null;

                      return (
                        <SelectItem key={id} value={id}>
                          {society.name ||
                            society.societyName ||
                            society.city ||
                            id}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {societiesError && (
                  <p className="text-xs text-red-600">
                    Unable to load societies. Please refresh and try again.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="carFlat">Flat *</Label>
                <Select
                  value={flatId}
                  onValueChange={(value) => updateField("flatId", value)}
                  disabled={
                    isView ||
                    loading ||
                    !societyId ||
                    flatsLoading
                  }
                >
                  <SelectTrigger id="carFlat">
                    <SelectValue
                      placeholder={
                        !societyId
                          ? "Select Society first"
                          : flatsLoading
                            ? "Loading flats..."
                            : "Select Flat"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFlats.map((flat) => {
                      const id = getOptionId(flat);
                      if (!id) return null;

                      return (
                        <SelectItem key={id} value={id}>
                          {getFlatLabel(flat)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {flatsError && (
                  <p className="text-xs text-red-600">
                    Unable to load flats. Please refresh and try again.
                  </p>
                )}

                {societyId &&
                  !flatsLoading &&
                  availableFlats.length === 0 && (
                    <p className="text-xs text-amber-600">
                      No flats found for the selected Society.
                    </p>
                  )}
              </div>
            </div>

            {selectedSociety && (
              <p className="text-xs text-muted-foreground">
                Selected Society:{" "}
                {selectedSociety.name ||
                  selectedSociety.societyName ||
                  getOptionId(selectedSociety)}
              </p>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="border-b pb-2 text-sm font-semibold">
              Owner Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  value={form.ownerName}
                  onChange={(event) =>
                    updateField("ownerName", event.target.value)
                  }
                  placeholder="Enter owner name"
                  disabled={isView || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerPhone">Owner Phone *</Label>
                <Input
                  id="ownerPhone"
                  value={form.ownerPhone}
                  onChange={(event) =>
                    updateField("ownerPhone", event.target.value)
                  }
                  placeholder="Enter phone number"
                  disabled={isView || loading}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ownerEmail">Owner Email</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={form.ownerEmail || ""}
                  onChange={(event) =>
                    updateField("ownerEmail", event.target.value)
                  }
                  placeholder="Enter email address (optional)"
                  disabled={isView || loading}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="border-b pb-2 text-sm font-semibold">
              Vehicle Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">
                  Registration Number *
                </Label>
                <Input
                  id="registrationNumber"
                  value={form.registrationNumber}
                  onChange={(event) =>
                    updateField(
                      "registrationNumber",
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="e.g. GJ01AB1234"
                  disabled={isView || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carType">Car Type *</Label>
                <Select
                  value={form.carType}
                  onValueChange={(value) =>
                    updateField("carType", value as TCarType)
                  }
                  disabled={isView || loading}
                >
                  <SelectTrigger id="carType">
                    <SelectValue placeholder="Select Car Type" />
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

              <div className="space-y-2">
                <Label htmlFor="carMake">Make *</Label>
                <Input
                  id="carMake"
                  value={form.make}
                  onChange={(event) =>
                    updateField("make", event.target.value)
                  }
                  placeholder="e.g. Maruti Suzuki"
                  disabled={isView || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carModel">Model *</Label>
                <Input
                  id="carModel"
                  value={form.model}
                  onChange={(event) =>
                    updateField("model", event.target.value)
                  }
                  placeholder="e.g. Swift"
                  disabled={isView || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carColor">Color *</Label>
                <Input
                  id="carColor"
                  value={form.color}
                  onChange={(event) =>
                    updateField("color", event.target.value)
                  }
                  placeholder="e.g. White"
                  disabled={isView || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parkingSlot">Parking Slot</Label>
                <Input
                  id="parkingSlot"
                  value={form.parkingSlot || ""}
                  onChange={(event) =>
                    updateField("parkingSlot", event.target.value)
                  }
                  placeholder="e.g. B-12"
                  disabled={isView || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carStatus">Car Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    updateField("status", value as TCarStatus)
                  }
                  disabled={isView || loading}
                >
                  <SelectTrigger id="carStatus">
                    <SelectValue placeholder="Select Status" />
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
                      setError("Choose a JPEG, PNG, or WebP image up to 5 MB.");
                      event.target.value = "";
                      return;
                    }
                    setError("");
                    setImageFile(file);
                  }}
                />
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Car preview"
                    className="h-40 w-full rounded-md border object-cover sm:max-w-sm"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">No car image uploaded.</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="carDescription">Description</Label>
                <Textarea
                  id="carDescription"
                  value={form.description || ""}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="Additional details (optional)"
                  rows={3}
                  disabled={isView || loading}
                />
              </div>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {isView ? "Close" : "Cancel"}
            </Button>

            {!isView && (
              <Button type="submit" disabled={loading || imageUploading}>
                {loading || imageUploading
                  ? imageUploading
                    ? "Uploading image..."
                    : "Saving..."
                  : isEdit
                    ? "Update Car"
                    : "Add Car"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CarForm;