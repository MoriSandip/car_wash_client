import React, { useMemo, useState } from "react";
import {
  useCreatePlanMutation,
  useDeletePlanMutation,
  useGetPlansQuery,
  useUpdatePlanMutation,
  type TPlan,
  type TPlanPayload,
  type TPlanStatus,
} from "@/redux/features/plan/planApi";
import PlanForm from "./PlanForm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BadgePercent, Download, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

type TMode = "add" | "edit" | "view";

const getPlans = (response: any): TPlan[] => {
  const value = response?.data;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.result)) return value.result;
  return [];
};
const getSocietyId = (plan: TPlan) =>
  typeof plan.societyId === "string" ? plan.societyId : plan.societyId?._id || "";
const getSocietyName = (plan: TPlan) =>
  typeof plan.societyId === "object" ? plan.societyId?.name || "—" : "—";
const getErrorMessage = (error: any) => error?.data?.message || error?.message || "Something went wrong.";

const Plan: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [societyFilter, setSocietyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mode, setMode] = useState<TMode>("add");
  const [selectedPlan, setSelectedPlan] = useState<TPlan | null>(null);
  const [actionError, setActionError] = useState("");

  const { data: planResponse, isLoading, isFetching, isError, refetch } = useGetPlansQuery();
  const [createPlan, { isLoading: isCreating }] = useCreatePlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation();
  const [deletePlan, { isLoading: isDeleting }] = useDeletePlanMutation();

  const plans = useMemo(() => getPlans(planResponse), [planResponse]);
  const filteredPlans = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return plans.filter((plan) => {
      const matchesSearch =
        !search ||
        plan.name.toLowerCase().includes(search) ||
        getSocietyName(plan).toLowerCase().includes(search) ||
        (plan.services || []).some((service) => service.toLowerCase().includes(search));
      const matchesSociety = societyFilter === "all" || getSocietyId(plan) === societyFilter;
      const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
      return matchesSearch && matchesSociety && matchesStatus;
    });
  }, [plans, searchTerm, societyFilter, statusFilter]);

  const openForm = (nextMode: TMode, plan: TPlan | null = null) => {
    setSelectedPlan(plan);
    setMode(nextMode);
    setActionError("");
    setFormOpen(true);
  };

  const handleFormSubmit = async (payload: TPlanPayload) => {
    if (mode === "edit" && selectedPlan) {
      await updatePlan({ id: selectedPlan._id, data: payload }).unwrap();
    } else {
      await createPlan(payload).unwrap();
    }
    setFormOpen(false);
    setSelectedPlan(null);
    setActionError("");
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    setActionError("");
    try {
      await deletePlan(selectedPlan._id).unwrap();
      setDeleteOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const exportCSV = () => {
    const headers = ["Society", "Plan Name", "Billing Cycle", "Price (INR)", "Included Washes", "Validity Days", "Services", "Status", "Description"];
    const rows = filteredPlans.map((plan) => [
      getSocietyName(plan), plan.name, plan.billingCycle, plan.price,
      plan.includedWashes, plan.validityDays, (plan.services || []).join("; "),
      plan.status, plan.description || "",
    ]);
    const escapeCSV = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "society-plans-charges.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const statusClass = (status: TPlanStatus) =>
    status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";

  const societies = Array.from(
    new Map(
      plans.filter((plan) => typeof plan.societyId === "object" && plan.societyId?._id)
        .map((plan) => [(plan.societyId as { _id: string })._id, plan.societyId as { _id: string; name: string }])
    ).values()
  );

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan &amp; Charges</h1>
          <p className="text-sm text-muted-foreground">Manage cleaning plans and charges separately for each Society.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard/offers">
              <BadgePercent className="mr-2 h-4 w-4" />
              Manage Offers
            </Link>
          </Button>
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
          <Button onClick={() => openForm("add")}><Plus className="mr-2 h-4 w-4" />Add Plan</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Plans</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{plans.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Plans</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{plans.filter((p) => p.status === "Active").length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Inactive Plans</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-gray-600">{plans.filter((p) => p.status === "Inactive").length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Societies With Plans</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{new Set(plans.map(getSocietyId).filter(Boolean)).size}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Plans &amp; Charges</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search plan, service or society..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={societyFilter} onValueChange={setSocietyFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by Society" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Societies</SelectItem>
                {societies.map((society) => <SelectItem key={society._id} value={society._id}>{society.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? <div className="py-10 text-center text-muted-foreground">Loading Plans...</div>
          : isError ? <div className="space-y-3 py-10 text-center"><p className="text-sm text-red-600">Failed to load Plans. Please try again.</p><Button variant="outline" onClick={() => refetch()}>Retry</Button></div>
          : <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Society</TableHead><TableHead>Plan Name</TableHead><TableHead>Billing</TableHead>
                <TableHead>Price</TableHead><TableHead>Washes</TableHead><TableHead>Validity</TableHead>
                <TableHead>Services</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No Plans found.</TableCell></TableRow>
                : filteredPlans.map((plan) => <TableRow key={plan._id}>
                  <TableCell className="font-medium">{getSocietyName(plan)}</TableCell>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>{plan.billingCycle}</TableCell>
                  <TableCell>₹{Number(plan.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>{plan.includedWashes}</TableCell>
                  <TableCell>{plan.validityDays} days</TableCell>
                  <TableCell className="max-w-64"><span className="line-clamp-2">{(plan.services || []).join(", ") || "—"}</span></TableCell>
                  <TableCell><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(plan.status)}`}>{plan.status}</span></TableCell>
                  <TableCell><div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="View Plan" onClick={() => openForm("view", plan)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Edit Plan" onClick={() => openForm("edit", plan)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Delete Plan" className="text-red-600 hover:text-red-700" onClick={() => { setSelectedPlan(plan); setActionError(""); setDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                  </div></TableCell>
                </TableRow>)}
              </TableBody>
            </Table>
          </div>}
          {isFetching && !isLoading && <p className="text-xs text-muted-foreground">Refreshing data...</p>}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setSelectedPlan(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Add Plan" : mode === "edit" ? "Edit Plan" : "View Plan"}</DialogTitle>
            <DialogDescription>{mode === "view" ? "Plan information and charges." : "Enter society-wise plan details below."}</DialogDescription>
          </DialogHeader>
          <PlanForm key={`${mode}-${selectedPlan?._id || "new"}`} initialData={selectedPlan} mode={mode}
            loading={isCreating || isUpdating} onSubmit={handleFormSubmit}
            onClose={() => { setFormOpen(false); setSelectedPlan(null); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setActionError(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{selectedPlan?.name}</strong> for <strong>{selectedPlan ? getSocietyName(selectedPlan) : ""}</strong>? This will soft-delete the plan.</DialogDescription>
          </DialogHeader>
          {actionError && <p role="alert" className="text-sm text-red-600">{actionError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Plan;
