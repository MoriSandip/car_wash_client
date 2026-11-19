import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ListPagination from "@/components/ListPagination";
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
  useCreateCashReceiptLinkMutation,
  useGetMyPaymentTransactionsQuery,
} from "@/redux/features/payment/transactionsApi";

const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const CustomerPaymentHistory = () => {
  const [page, setPage] = useState(1);
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading, isFetching, isError, refetch } =
    useGetMyPaymentTransactionsQuery({
      page,
      limit: 20,
      ...(provider ? { provider } : {}),
      ...(status ? { status } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    });
  const [createReceiptLink, receiptState] =
    useCreateCashReceiptLinkMutation();
  const summary = data?.meta?.summary;
  const totalPages = Math.max(1, data?.meta?.totalPages ?? 1);

  const downloadReceipt = async (bookingId: string) => {
    try {
      const result = await createReceiptLink(bookingId).unwrap();
      window.location.assign(result.url);
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(response.data?.message || "Receipt could not be opened.");
    }
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold">Payment history</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your online and cash payments for bookings and memberships.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total paid", summary?.paidAmount ?? 0],
          ["Online paid", summary?.onlinePaidAmount ?? 0],
          ["Cash paid", summary?.cashPaidAmount ?? 0],
          ["Pending", summary?.pendingAmount ?? 0],
        ].map(([label, amount]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              ₹{Number(amount).toFixed(2)}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Transactions</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={provider}
              onChange={(event) => {
                setProvider(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter by payment method"
            >
              <option value="">All methods</option>
              <option value="Stripe">Online (Stripe)</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
            </select>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter by transaction status"
            >
              <option value="">All statuses</option>
              {["Pending", "Paid", "Failed", "Refunded"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              From
              <input
                type="date"
                value={from}
                max={to || localDate(new Date())}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              To
              <input
                type="date"
                value={to}
                min={from || undefined}
                max={localDate(new Date())}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
              />
            </label>
          </div>

          {isError ? (
            <p className="text-sm text-red-600">
              Payment history could not be loaded.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading your transactions...
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction date</TableHead>
                      <TableHead>For</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference / collector</TableHead>
                      <TableHead className="text-right">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.data ?? []).map((transaction) => {
                      const booking = transaction.bookingId;
                      const membership = transaction.membershipId;
                      const description = booking
                        ? booking.serviceNameSnapshot || "Individual booking"
                        : "Membership purchase";
                      const schedule = booking
                        ? `${new Date(booking.bookingDate).toLocaleDateString()} · ${booking.bookingTime}`
                        : membership
                          ? `${new Date(membership.startDate).toLocaleDateString()} – ${new Date(membership.endDate).toLocaleDateString()}`
                          : "";
                      return (
                        <TableRow key={transaction._id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{description}</div>
                            <div className="text-xs text-muted-foreground">
                              {schedule}
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.provider === "Stripe"
                              ? "Online (Stripe)"
                              : transaction.provider}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            ₹{Number(transaction.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>{transaction.status}</TableCell>
                          <TableCell>
                            <div>{transaction.reference || "—"}</div>
                            {transaction.provider === "Cash" &&
                              transaction.recordedByWorker?.name && (
                                <div className="text-xs text-muted-foreground">
                                  Collected by {transaction.recordedByWorker.name}
                                </div>
                              )}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.provider === "Cash" &&
                            transaction.status === "Paid" &&
                            booking?._id ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={receiptState.isLoading}
                                onClick={() =>
                                  downloadReceipt(booking._id)
                                }
                              >
                                PDF
                              </Button>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!data?.data.length && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No transactions match these filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ListPagination
                page={data?.meta?.page ?? page}
                totalPages={totalPages}
                totalItems={data?.meta?.total ?? 0}
                pageSize={20}
                isLoading={isFetching}
                itemLabel="transactions"
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPaymentHistory;
