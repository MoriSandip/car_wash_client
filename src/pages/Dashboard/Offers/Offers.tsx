import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetPlansQuery, type TPlan } from "@/redux/features/plan/planApi";
import {
  useCreateOfferMutation,
  useDeleteOfferMutation,
  useGetOffersQuery,
  useUpdateOfferMutation,
  type TOffer,
  type TOfferPayload,
} from "@/redux/features/offer/offerApi";

type TMode = "add" | "edit";
type TOfferForm = Omit<TOfferPayload, "startDate" | "endDate"> & {
  startDate: string;
  endDate: string;
};

const blankOffer: TOfferForm = {
  planId: "",
  title: "",
  description: "",
  discountType: "Percentage",
  discountValue: 10,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  status: "Active",
};

const getPlans = (response: unknown): TPlan[] => {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: unknown }).data;
  if (Array.isArray(data)) return data as TPlan[];
  if (data && typeof data === "object") {
    const result = (data as { result?: unknown }).result;
    if (Array.isArray(result)) return result as TPlan[];
  }
  return [];
};

const getOffers = (response: unknown): TOffer[] => {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: unknown }).data;
  if (Array.isArray(data)) return data as TOffer[];
  if (data && typeof data === "object") {
    const result = (data as { result?: unknown }).result;
    if (Array.isArray(result)) return result as TOffer[];
  }
  return [];
};

const planInfo = (offer: TOffer) =>
  typeof offer.planId === "object" ? offer.planId : undefined;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatDiscount = (offer: Pick<TOffer, "discountType" | "discountValue">) =>
  offer.discountType === "Percentage"
    ? `${offer.discountValue}%`
    : `₹${Number(offer.discountValue).toLocaleString("en-IN")}`;

const errorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
};

export default function Offers() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TOffer | null>(null);
  const [selected, setSelected] = useState<TOffer | null>(null);
  const [mode, setMode] = useState<TMode>("add");
  const [form, setForm] = useState<TOfferForm>(blankOffer);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const offersQuery = useGetOffersQuery();
  const plansQuery = useGetPlansQuery();
  const [createOffer, createState] = useCreateOfferMutation();
  const [updateOffer, updateState] = useUpdateOfferMutation();
  const [deleteOffer, deleteState] = useDeleteOfferMutation();
  const offers = useMemo(() => getOffers(offersQuery.data), [offersQuery.data]);
  const plans = useMemo(() => getPlans(plansQuery.data), [plansQuery.data]);
  const visibleOffers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return offers.filter((offer) =>
      !term ||
      offer.title.toLowerCase().includes(term) ||
      (planInfo(offer)?.name ?? "").toLowerCase().includes(term) ||
      (offer.description ?? "").toLowerCase().includes(term),
    );
  }, [offers, search]);

  const openForm = (nextMode: TMode, offer?: TOffer) => {
    setMode(nextMode);
    setSelected(offer ?? null);
    setFormError("");
    setForm(
      offer
        ? {
            planId: typeof offer.planId === "string" ? offer.planId : offer.planId._id,
            title: offer.title,
            description: offer.description ?? "",
            discountType: offer.discountType,
            discountValue: offer.discountValue,
            startDate: offer.startDate.slice(0, 10),
            endDate: offer.endDate.slice(0, 10),
            status: offer.status,
          }
        : { ...blankOffer },
    );
    setFormOpen(true);
  };

  const setField = <K extends keyof TOfferForm>(key: K, value: TOfferForm[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!form.planId) return setFormError("Select a plan for this offer.");
    if (form.endDate < form.startDate) {
      return setFormError("End date must be on or after the start date.");
    }
    if (
      form.discountType === "Percentage" &&
      (form.discountValue <= 0 || form.discountValue > 100)
    ) {
      return setFormError("Percentage discount must be between 1 and 100.");
    }
    if (form.discountValue <= 0) {
      return setFormError("Discount value must be greater than zero.");
    }

    const payload: TOfferPayload = {
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() ?? "",
      startDate: `${form.startDate}T00:00:00.000Z`,
      endDate: `${form.endDate}T23:59:59.999Z`,
    };
    try {
      if (mode === "edit" && selected) {
        await updateOffer({ id: selected._id, data: payload }).unwrap();
      } else {
        await createOffer(payload).unwrap();
      }
      setFormOpen(false);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await deleteOffer(deleteTarget._id).unwrap();
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(errorMessage(error));
    }
  };

  const activeCount = offers.filter((offer) => offer.status === "Active").length;
  const currentCount = offers.filter(
    (offer) =>
      offer.status === "Active" &&
      new Date(offer.startDate) <= new Date() &&
      new Date(offer.endDate) >= new Date(),
  ).length;

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          
          <h1 className="text-2xl font-bold tracking-tight">Offers</h1>
          <p className="text-sm text-muted-foreground">
            Create discounts for specific plans and manage their validity.
          </p>
        </div>
        <Button onClick={() => openForm("add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Offer
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total offers</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{offers.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Active offers</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-600">{activeCount}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Currently available</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-600">{currentCount}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Offer list</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search offer or plan..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {offersQuery.isLoading ? (
            <p className="py-10 text-center text-muted-foreground">Loading offers…</p>
          ) : offersQuery.isError ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-sm text-destructive">Offers could not be loaded.</p>
              <Button variant="outline" onClick={() => void offersQuery.refetch()}>Retry</Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleOffers.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No offers found.</TableCell></TableRow>
                  ) : visibleOffers.map((offer) => (
                    <TableRow key={offer._id}>
                      <TableCell>
                        <div className="font-medium">{offer.title}</div>
                        {offer.description && <div className="max-w-64 truncate text-xs text-muted-foreground">{offer.description}</div>}
                      </TableCell>
                      <TableCell>{planInfo(offer)?.name ?? "Plan unavailable"}</TableCell>
                      <TableCell className="font-semibold">{formatDiscount(offer)}</TableCell>
                      <TableCell>{formatDate(offer.startDate)} – {formatDate(offer.endDate)}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${offer.status === "Active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                          {offer.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Edit offer" onClick={() => openForm("edit", offer)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" title="Delete offer" className="text-destructive" onClick={() => { setDeleteTarget(offer); setDeleteError(""); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Add Offer" : "Edit Offer"}</DialogTitle>
            <DialogDescription>Offers apply to the selected plan and reduce its price when creating a membership.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Plan *</Label>
                <Select value={form.planId} onValueChange={(value) => setField("planId", value)} disabled={plansQuery.isLoading || plansQuery.isError}>
                  <SelectTrigger><SelectValue placeholder={plansQuery.isLoading ? "Loading plans…" : "Select plan"} /></SelectTrigger>
                  <SelectContent>
                    {plans.filter((plan) => plan.status === "Active" || plan._id === form.planId).map((plan) => (
                      <SelectItem key={plan._id} value={plan._id}>
                        {plan.name}{plan.status === "Inactive" ? " (Inactive)" : ""} — ₹{Number(plan.price).toLocaleString("en-IN")}
                      </SelectItem>
                    ))}
                    {selected && !plans.some((plan) => plan._id === form.planId) && (
                      <SelectItem value={form.planId}>{planInfo(selected)?.name ?? "Selected plan"}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {plansQuery.isError && (
                  <p role="alert" className="text-sm text-destructive">
                    Plans could not be loaded. Close this form and retry the page.
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="offer-title">Offer title *</Label>
                <Input id="offer-title" value={form.title} maxLength={100} onChange={(event) => setField("title", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Discount type *</Label>
                <Select value={form.discountType} onValueChange={(value) => setField("discountType", value as TOfferForm["discountType"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percentage">Percentage</SelectItem>
                    <SelectItem value="Fixed">Fixed amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-value">Discount {form.discountType === "Percentage" ? "(%)" : "(₹)"} *</Label>
                <Input id="discount-value" type="number" min="0.01" max={form.discountType === "Percentage" ? 100 : undefined} step="0.01" value={form.discountValue} onChange={(event) => setField("discountValue", Number(event.target.value))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-start">Start date *</Label>
                <Input id="offer-start" type="date" value={form.startDate} onChange={(event) => setField("startDate", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-end">End date *</Label>
                <Input id="offer-end" type="date" min={form.startDate} value={form.endDate} onChange={(event) => setField("endDate", event.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setField("status", value as TOfferForm["status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="offer-description">Description</Label>
                <Textarea id="offer-description" value={form.description} maxLength={1000} rows={3} onChange={(event) => setField("description", event.target.value)} />
              </div>
            </div>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createState.isLoading || updateState.isLoading || plansQuery.isLoading}>
                {createState.isLoading || updateState.isLoading ? "Saving…" : mode === "add" ? "Create offer" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete offer?</DialogTitle>
            <DialogDescription>This will deactivate and remove “{deleteTarget?.title}” from the active offers list.</DialogDescription>
          </DialogHeader>
          {deleteError && <p role="alert" className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteState.isLoading}>Cancel</Button>
            <Button variant="destructive" onClick={() => void confirmDelete()} disabled={deleteState.isLoading}>
              {deleteState.isLoading ? "Deleting…" : "Delete offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
