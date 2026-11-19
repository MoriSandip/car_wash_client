import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ListPagination from "@/components/ListPagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PaymentTransaction,
  useGetPaymentTransactionsQuery,
  useRefundPaymentTransactionMutation,
} from "@/redux/features/payment/transactionsApi";

const PaymentTransactions = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [selected, setSelected] = useState<PaymentTransaction | null>(null);
  const [reason, setReason] = useState("");
  const [refundReference, setRefundReference] = useState("");
  const { data, isLoading, isFetching, isError, refetch } =
    useGetPaymentTransactionsQuery({
      page,
      limit: 100,
      ...(status ? { status } : {}),
      ...(provider ? { provider } : {}),
    });
  const [refund, refundState] = useRefundPaymentTransactionMutation();
  const totalPages = Math.max(1, data?.meta?.totalPages ?? 1);
  const totalTransactions = data?.meta?.total ?? data?.data.length ?? 0;

  const submitRefund = async () => {
    if (!selected || reason.trim().length < 3) {
      toast.error("Enter a reason for the refund.");
      return;
    }
    if (selected.provider !== "Stripe" && !refundReference.trim()) {
      toast.error("Enter the cash/UPI refund reference.");
      return;
    }
    try {
      await refund({
        transactionId: selected._id,
        reason: reason.trim(),
        ...(refundReference.trim()
          ? { refundReference: refundReference.trim() }
          : {}),
      }).unwrap();
      toast.success("Refund recorded.");
      setSelected(null);
      setReason("");
      setRefundReference("");
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(response.data?.message || "Refund could not be recorded.");
    }
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold">Payments & reconciliation</h1>
        <p className="text-sm text-muted-foreground">
          Review payment attempts and track refunds across bookings and memberships.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transactions</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter by payment status"
            >
              <option value="">All statuses</option>
              {["Pending", "Paid", "Failed", "Refunded"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={provider}
              onChange={(event) => {
                setProvider(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter by provider"
            >
              <option value="">All methods</option>
              {["Stripe", "Cash", "UPI"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          {isError ? (
            <p className="text-sm text-red-600">Transactions could not be loaded.</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading transactions...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>For</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.data ?? []).map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {transaction.customerId?.name || transaction.customerId?.email || "—"}
                      </TableCell>
                      <TableCell>
                        {transaction.bookingId
                          ? `Booking · ${transaction.bookingId.serviceNameSnapshot}`
                          : transaction.membershipId
                            ? "Membership"
                            : "—"}
                      </TableCell>
                      <TableCell>₹{transaction.amount}</TableCell>
                      <TableCell>{transaction.provider}</TableCell>
                      <TableCell>{transaction.status}</TableCell>
                      <TableCell className="max-w-40 truncate">
                        {transaction.refundReference || transaction.reference || "—"}
                      </TableCell>
                      <TableCell>
                        {transaction.status === "Paid" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelected(transaction)}
                          >
                            <RotateCcw className="mr-1 h-4 w-4" />
                            Refund
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!data?.data.length ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          )}
          <ListPagination
            page={data?.meta?.page ?? page}
            totalPages={totalPages}
            totalItems={totalTransactions}
            pageSize={100}
            isLoading={isFetching}
            itemLabel="transactions"
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund payment</DialogTitle>
            <DialogDescription>
              {selected?.provider === "Stripe"
                ? "This submits a refund through Stripe. Refunds may take time to appear in the customer’s account."
                : "Confirm that the offline refund has been issued, then record its reference."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              {selected?.provider} · ₹{selected?.amount}
            </p>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">Reason</Label>
              <Textarea
                id="refund-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
              />
            </div>
            {selected?.provider !== "Stripe" ? (
              <div className="space-y-2">
                <Label htmlFor="refund-reference">Refund reference</Label>
                <Input
                  id="refund-reference"
                  value={refundReference}
                  onChange={(event) => setRefundReference(event.target.value)}
                  maxLength={120}
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={submitRefund} disabled={refundState.isLoading}>
              {refundState.isLoading ? "Processing..." : "Confirm refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentTransactions;
