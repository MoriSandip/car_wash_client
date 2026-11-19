import { baseApi } from "@/redux/api/baseApi";

export type PaymentTransaction = {
  _id: string;
  bookingId?: {
    _id: string;
    bookingDate: string;
    bookingTime: string;
    serviceNameSnapshot: string;
    status: string;
    paymentType?: string;
    paymentMethod?: string;
  };
  membershipId?: {
    _id: string;
    startDate: string;
    endDate: string;
    status: string;
    paymentStatus?: string;
    totalAmount?: number;
  };
  recordedByWorker?: { name?: string };
  customerId?: { name?: string; email?: string; phone?: string };
  amount: number;
  currency: string;
  provider: "Stripe" | "Cash" | "UPI";
  status: "Pending" | "Paid" | "Failed" | "Refunded";
  reference?: string;
  refundReference?: string;
  refundReason?: string;
  createdAt: string;
  verifiedAt?: string;
  refundedAt?: string;
};

type TransactionList = {
  data: PaymentTransaction[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
};

export type CustomerPaymentHistory = {
  data: PaymentTransaction[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    summary?: {
      paidAmount: number;
      pendingAmount: number;
      cashPaidAmount: number;
      onlinePaidAmount: number;
    };
  };
};

export type CashCollectionBooking = {
  _id: string;
  bookingDate: string;
  bookingTime: string;
  amountPayable: number;
  paymentStatus: string;
  cashCollectionStatus?: "NotRecorded" | "Received" | "NotReceived";
  cashCollectionUpdatedAt?: string;
  serviceNameSnapshot: string;
  customerId?: { name?: string; email?: string; phone?: string };
  workerId?: { name?: string; email?: string };
  cashCollectionUpdatedByWorker?: { name?: string; email?: string };
  cashCollectionUpdatedByAdmin?: { name?: string; email?: string };
  carId?: {
    registrationNumber?: string;
    carNumber?: string;
    plateNumber?: string;
  };
};

export type CashCollectionList = {
  data: CashCollectionBooking[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    summary?: {
      collectedAmount: number;
      outstandingAmount: number;
      receivedCount: number;
      notReceivedCount: number;
    };
  };
};

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentTransactions: builder.query<
      TransactionList,
      { page?: number; limit?: number; status?: string; provider?: string } | void
    >({
      query: (params) => ({ url: "/payment/transactions", params: params || {} }),
      transformResponse: (response: unknown): TransactionList => {
        const record = recordOf(response);
        return {
          data: Array.isArray(record.data)
            ? record.data as PaymentTransaction[]
            : [],
          meta: record.meta as TransactionList["meta"],
        };
      },
      providesTags: ["PaymentTransactions"],
    }),
    getMyPaymentTransactions: builder.query<
      CustomerPaymentHistory,
      {
        page?: number;
        limit?: number;
        status?: string;
        provider?: string;
        from?: string;
        to?: string;
      } | void
    >({
      query: (params) => ({
        url: "/payment/my-transactions",
        params: params || {},
      }),
      transformResponse: (response: unknown): CustomerPaymentHistory => {
        const record = recordOf(response);
        return {
          data: Array.isArray(record.data)
            ? record.data as PaymentTransaction[]
            : [],
          meta: record.meta as CustomerPaymentHistory["meta"],
        };
      },
      providesTags: ["PaymentTransactions"],
    }),
    getCashCollections: builder.query<
      CashCollectionList,
      {
        page?: number;
        limit?: number;
        status?: string;
        from?: string;
        to?: string;
      } | void
    >({
      query: (params) => ({
        url: "/payment/cash-collections",
        params: params || {},
      }),
      transformResponse: (response: unknown): CashCollectionList => {
        const record = recordOf(response);
        return {
          data: Array.isArray(record.data)
            ? record.data as CashCollectionBooking[]
            : [],
          meta: record.meta as CashCollectionList["meta"],
        };
      },
      providesTags: ["PaymentTransactions"],
    }),
    createCashReceiptLink: builder.mutation<
      { url: string; expiresInSeconds: number },
      string
    >({
      query: (bookingId) => ({
        url: `/payment/bookings/${bookingId}/receipt-link`,
        method: "POST",
      }),
      transformResponse: (response: unknown) =>
        recordOf(recordOf(response).data) as { url: string; expiresInSeconds: number },
    }),
    refundPaymentTransaction: builder.mutation<
      PaymentTransaction,
      { transactionId: string; reason: string; refundReference?: string }
    >({
      query: ({ transactionId, ...body }) => ({
        url: `/payment/transactions/${transactionId}/refund`,
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown): PaymentTransaction =>
        recordOf(response).data as PaymentTransaction,
      invalidatesTags: ["PaymentTransactions", "BookingNew", "membership"],
    }),
    recordOfflineMembershipPayment: builder.mutation<
      unknown,
      { membershipId: string; body: { method: "Cash" | "UPI"; reference?: string } }
    >({
      query: ({ membershipId, body }) => ({
        url: `/payment/memberships/${membershipId}/offline`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PaymentTransactions", "membership"],
    }),
    recordOfflineBookingPayment: builder.mutation<
      unknown,
      { bookingId: string; body: { method: "Cash" | "UPI"; reference?: string } }
    >({
      query: ({ bookingId, body }) => ({
        url: `/payment/bookings/${bookingId}/offline`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PaymentTransactions", "BookingNew"],
    }),
  }),
});

export const {
  useGetPaymentTransactionsQuery,
  useGetMyPaymentTransactionsQuery,
  useGetCashCollectionsQuery,
  useCreateCashReceiptLinkMutation,
  useRefundPaymentTransactionMutation,
  useRecordOfflineMembershipPaymentMutation,
  useRecordOfflineBookingPaymentMutation,
} = transactionsApi;
