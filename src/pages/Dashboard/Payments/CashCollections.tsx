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
  useGetCashCollectionsQuery,
  useRecordOfflineBookingPaymentMutation,
} from "@/redux/features/payment/transactionsApi";

const today = () => new Date().toISOString().slice(0, 10);

const CashCollections = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading, isFetching, isError, refetch } =
    useGetCashCollectionsQuery({
      page,
      limit: 100,
      ...(status ? { status } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    });
  const [recordPayment, paymentState] =
    useRecordOfflineBookingPaymentMutation();
  const summary = data?.meta?.summary;
  const totalPages = Math.max(1, data?.meta?.totalPages ?? 1);
  const recordCashAsAdmin = async (bookingId: string) => {
    try {
      await recordPayment({
        bookingId,
        body: { method: "Cash" },
      }).unwrap();
      toast.success("Cash receipt recorded.");
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(response.data?.message || "Cash payment could not be recorded.");
    }
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold">Cash collections</h1>
        <p className="text-sm text-muted-foreground">
          Track cash reported by workers and payments resolved by admins.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Cash collected", summary?.collectedAmount ?? 0],
          ["Outstanding", summary?.outstandingAmount ?? 0],
          ["Received", summary?.receivedCount ?? 0],
          ["Not received", summary?.notReceivedCount ?? 0],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {typeof value === "number" && label !== "Received" && label !== "Not received"
                ? `₹${value.toFixed(2)}`
                : value}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Cash bookings</span>
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
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter cash collection status"
            >
              <option value="">All collection statuses</option>
              <option value="NotRecorded">Not recorded</option>
              <option value="Received">Received</option>
              <option value="NotReceived">Not received</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              From
              <input
                type="date"
                value={from}
                max={to || today()}
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
                max={today()}
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
              Cash collections could not be loaded.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading cash collections...
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service / car</TableHead>
                      <TableHead>Assigned worker</TableHead>
                      <TableHead>Collector / reporter</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Collection status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.data ?? []).map((booking) => {
                      const statusLabel =
                        booking.cashCollectionStatus ||
                        (booking.paymentStatus === "Paid"
                          ? "Received"
                          : "NotRecorded");
                      const car =
                        booking.carId?.registrationNumber ||
                        booking.carId?.carNumber ||
                        booking.carId?.plateNumber ||
                        "—";
                      const collector =
                        booking.cashCollectionUpdatedByWorker?.name ||
                        booking.cashCollectionUpdatedByAdmin?.name ||
                        "—";
                      const canRecordAdminPayment =
                        statusLabel === "NotReceived" &&
                        booking.paymentStatus !== "Paid" &&
                        booking.paymentStatus !== "Refunded";
                      return (
                        <TableRow key={booking._id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(booking.bookingDate).toLocaleDateString()}
                            <div className="text-xs text-muted-foreground">
                              {booking.bookingTime}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {booking.customerId?.name || "Customer"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {booking.customerId?.phone || booking.customerId?.email || ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{booking.serviceNameSnapshot || "Car wash"}</div>
                            <div className="text-xs text-muted-foreground">{car}</div>
                          </TableCell>
                          <TableCell>{booking.workerId?.name || "Unassigned"}</TableCell>
                          <TableCell>
                            <div>{collector}</div>
                            <div className="text-xs text-muted-foreground">
                              {booking.cashCollectionUpdatedAt
                                ? new Date(
                                    booking.cashCollectionUpdatedAt,
                                  ).toLocaleString()
                                : "Not reported"}
                            </div>
                          </TableCell>
                          <TableCell>₹{Number(booking.amountPayable || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <div>{statusLabel}</div>
                            <div className="text-xs text-muted-foreground">
                              Payment: {booking.paymentStatus}
                            </div>
                            {canRecordAdminPayment && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                disabled={paymentState.isLoading}
                                onClick={() => recordCashAsAdmin(booking._id)}
                              >
                                Record cash received
                              </Button>
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
                          No cash bookings match these filters.
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
                pageSize={100}
                isLoading={isFetching}
                itemLabel="bookings"
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashCollections;
