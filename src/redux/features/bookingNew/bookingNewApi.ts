import { baseApi } from "@/redux/api/baseApi";

 
export type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "InProgress"
  | "Completed"
  | "Cancelled";

export type BookingReference =
  | string
  | {
      _id?: string;
      id?: string;
      name?: string;
      city?: string;
      flatNumber?: string;
      block?: string;
      registrationNumber?: string;
      make?: string;
      model?: string;
      imageUrl?: string;
    };

export type BookingNew = {
  _id: string;
  societyId: BookingReference;
  flatId: BookingReference;
  carId: BookingReference;
  serviceId: BookingReference;
  membershipId?: BookingReference;
  bookingDate: string;
  bookingTime: string;
  paymentType: "Membership" | "Individual";
  serviceNameSnapshot: string;
  servicePriceSnapshot: number;
  amountPayable: number;
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded";
  paymentMethod?: "Stripe" | "Cash" | "UPI";
  cashCollectionStatus?: "NotRecorded" | "Received" | "NotReceived";
  cashCollectionUpdatedAt?: string;
  status: BookingStatus;
  remarks?: string;
  workStatus?: "NotStarted" | "Working" | "Paused" | "Completed";
  currentWorkStartedAt?: string | null;
  workCompletedAt?: string | null;
  totalWorkingSeconds?: number;
  workSessions?: {
    startedAt: string;
    endedAt?: string | null;
    durationSeconds?: number;
  }[];
  beforePhoto?: string;
  afterPhoto?: string;
  cleaningChecklist?: {
    exteriorWash: boolean;
    interiorCleaning: boolean;
    dashboard: boolean;
    tyreDressing: boolean;
    vacuumCleaning: boolean;
  };
  workerNotes?: string;
  customerRating?: number;
  customerReview?: string;
};

export type BookingPayload = {
  societyId: string;
  flatId: string;
  carId: string;
  serviceId: string;
  slotId?: string;
  membershipId?: string;
  bookingDate: string;
  bookingTime: string;
  paymentType: "Membership" | "Individual";
  paymentMethod?: "Stripe" | "Cash";
  remarks?: string;
};

export type BookingStats = {
  total?: number;
  pending?: number;
  confirmed?: number;
  inProgress?: number;
  completed?: number;
  cancelled?: number;
  individualPaidRevenue?: number;
  dailyBookings?: {
    date: string;
    bookings: number;
  }[];
};

type ListResponse = {
  data: BookingNew[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
};

type BookingListApiResponse = {
  data: ListResponse;
  meta?: ListResponse["meta"];
};

export const bookingNewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBookings: builder.query<
      BookingListApiResponse,
      {
        searchTerm?: string;
        page?: number;
        limit?: number;
        status?: string;
        paymentType?: string;
        societyId?: string;
        from?: string;
        to?: string;
      } | void
    >({
      query: (params) => ({
        url: "/bookings",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["BookingNew"],
    }),

    getBookingStats: builder.query<
      { data: BookingStats },
      void
    >({
      query: () => ({
        url: "/bookings/stats",
        method: "GET",
      }),
      providesTags: ["BookingNew"],
    }),

    createBooking: builder.mutation<
      { data: BookingNew },
      BookingPayload
    >({
      query: (body) => ({
        url: "/bookings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BookingNew", "Slot"],
    }),

    updateBooking: builder.mutation<
      { data: BookingNew },
      {
        id: string;
        body: Partial<
          Pick<BookingNew, "bookingDate" | "bookingTime" | "remarks"> & {
            slotId: string;
          }
        >;
      }
    >({
      query: ({ id, body }) => ({
        url: `/bookings/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["BookingNew"],
    }),

    submitBookingReview: builder.mutation<
      { data: BookingNew },
      { id: string; rating: number; review?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/bookings/${id}/review`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["BookingNew"],
    }),

    changeBookingStatus: builder.mutation<
      { data: BookingNew },
      {
        id: string;
        body: {
          status: BookingStatus;
          paymentStatus?: BookingNew["paymentStatus"];
          remarks?: string;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/bookings/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["BookingNew"],
    }),

    startStripeBookingCheckout: builder.mutation<
      { data: { url: string; sessionId: string } },
      { bookingId: string }
    >({
      query: (body) => ({
        url: "/payment/stripe/booking-checkout",
        method: "POST",
        body,
      }),
    }),

    confirmStripeBookingPayment: builder.mutation<
      { data: BookingNew },
      { sessionId: string }
    >({
      query: (body) => ({
        url: "/payment/stripe/confirm",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BookingNew"],
    }),

    recordOfflineBookingPayment: builder.mutation<
      { data: BookingNew },
      {
        bookingId: string;
        body: { method: "Cash" | "UPI"; reference?: string };
      }
    >({
      query: ({ bookingId, body }) => ({
        url: `/payment/bookings/${bookingId}/offline`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["BookingNew", "Booking"],
    }),

    deleteBooking: builder.mutation<{ data: BookingNew }, string>({
      query: (id) => ({
        url: `/bookings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BookingNew"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBookingsQuery,
  useGetBookingStatsQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useSubmitBookingReviewMutation,
  useChangeBookingStatusMutation,
  useStartStripeBookingCheckoutMutation,
  useConfirmStripeBookingPaymentMutation,
  useRecordOfflineBookingPaymentMutation,
  useDeleteBookingMutation,
} = bookingNewApi;
