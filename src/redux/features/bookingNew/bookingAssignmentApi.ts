import { baseApi } from "@/redux/api/baseApi";

export type TAssignmentWorker = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  mobileNumber?: string;
  status?: string;
};

export type TAssignmentBooking = {
  _id: string;
  bookingDate: string;
  bookingTime: string;
  serviceNameSnapshot: string;
  servicePriceSnapshot: number;
  amountPayable: number;
  paymentType: string;
  paymentStatus: string;
  status: string;
  workerId?: TAssignmentWorker | string | null;
  membershipId?: string | {
    _id?: string;
    workerId?: TAssignmentWorker | string | null;
  };
  carId?: any;
  flatId?: any;
  societyId?: any;
};

type TBookingListResponse = {
  data: TAssignmentBooking[];
  meta?: { page?: number; limit?: number; total?: number; totalPage?: number };
};

type TListEnvelope = {
  data?: unknown;
  result?: unknown;
  results?: unknown;
  meta?: TBookingListResponse["meta"];
};

type TMembershipAssignmentResult = {
  membershipId: string;
  workerId: string;
  assignedCount: number;
  futureBookingsAutoAssigned: boolean;
};

type TMembershipUnassignmentResult = {
  membershipId: string;
  unassignedCount: number;
  futureBookingsAutoUnassigned: boolean;
};

const getArray = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) return response as T[];
  if (!response || typeof response !== "object") return [];

  const envelope = response as TListEnvelope;
  if (Array.isArray(envelope.data)) return envelope.data as T[];
  if (Array.isArray(envelope.result)) return envelope.result as T[];
  if (Array.isArray(envelope.results)) return envelope.results as T[];

  if (envelope.data && typeof envelope.data === "object") {
    const nested = envelope.data as TListEnvelope;
    if (Array.isArray(nested.data)) return nested.data as T[];
    if (Array.isArray(nested.result)) return nested.result as T[];
    if (Array.isArray(nested.results)) return nested.results as T[];
  }

  return [];
};

export const bookingAssignmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBookingsForAssignment: builder.query<
      TBookingListResponse,
      {
        page?: number;
        limit?: number;
        searchTerm?: string;
        from?: string;
        toExclusive?: string;
      }
    >({
      async queryFn(params, _queryApi, _extraOptions, baseQuery) {
        const pageSize = 100;
        const data: TAssignmentBooking[] = [];
        let page = 1;
        let meta: TBookingListResponse["meta"];

        while (true) {
          const response = await baseQuery({
            url: "/bookings",
            method: "GET",
            params: { ...params, page, limit: pageSize },
          });

          if (response.error) return { error: response.error };

          const body = response.data as TListEnvelope;
          const pageData = getArray<TAssignmentBooking>(body);
          data.push(...pageData);
          const nestedMeta =
            body.data &&
            typeof body.data === "object" &&
            !Array.isArray(body.data)
              ? (body.data as TListEnvelope).meta
              : undefined;
          meta = body.meta ?? nestedMeta ?? meta;

          const totalPages = Number(meta?.totalPage);
          if (
            pageData.length < pageSize ||
            (Number.isFinite(totalPages) && totalPages > 0 && page >= totalPages)
          ) {
            break;
          }
          page += 1;
        }

        return { data: { data, meta } };
      },
      providesTags: ["Booking"],
    }),

    getWorkersForAssignment: builder.query<TAssignmentWorker[], void>({
      query: () => ({
        url: "/workers",
        method: "GET",
        params: { page: 1, limit: 100 },
      }),
      transformResponse: (response: unknown) =>
        getArray<TAssignmentWorker>(response),
      providesTags: ["Worker"],
    }),

    assignWorkerToBooking: builder.mutation<
      any,
      { bookingId: string; workerId: string }
    >({
      query: ({ bookingId, workerId }) => ({
        url: `/bookings/${bookingId}/assign-worker`,
        method: "PATCH",
        body: { workerId },
      }),
      invalidatesTags: ["Booking"],
    }),

    assignWorkerToMembershipBookings: builder.mutation<
      { data: TMembershipAssignmentResult },
      { membershipId: string; workerId: string }
    >({
      query: ({ membershipId, workerId }) => ({
        url: `/bookings/memberships/${membershipId}/assign-worker`,
        method: "PATCH",
        body: { workerId },
      }),
      invalidatesTags: ["Booking"],
    }),

    unassignWorkerFromMembershipBookings: builder.mutation<
      { data: TMembershipUnassignmentResult },
      string
    >({
      query: (membershipId) => ({
        url: `/bookings/memberships/${membershipId}/unassign-worker`,
        method: "PATCH",
      }),
      invalidatesTags: ["Booking"],
    }),

    unassignWorkerFromBooking: builder.mutation<any, string>({
      query: (bookingId) => ({
        url: `/bookings/${bookingId}/unassign-worker`,
        method: "PATCH",
      }),
      invalidatesTags: ["Booking"],
    }),
  }),
});

export const {
  useGetBookingsForAssignmentQuery,
  useGetWorkersForAssignmentQuery,
  useAssignWorkerToBookingMutation,
  useAssignWorkerToMembershipBookingsMutation,
  useUnassignWorkerFromMembershipBookingsMutation,
  useUnassignWorkerFromBookingMutation,
} = bookingAssignmentApi;
