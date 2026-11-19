import { baseApi } from "@/redux/api/baseApi";

export type TMembershipStatus = "Pending" | "Active" | "Expired" | "Cancelled";

export type TPaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

type MembershipRelation =
  | string
  | {
      _id?: string;
      name?: string;
      city?: string;
      registrationNumber?: string;
      flatNumber?: string;
      block?: string;
      make?: string;
      model?: string;
      flatNo?: string;
      flatName?: string;
      planName?: string;
      title?: string;
    };

export interface TMembership {
  _id: string;
  societyId: MembershipRelation;
  flatId: MembershipRelation;
  carId: MembershipRelation;
  planId: MembershipRelation;
  offerId?: MembershipRelation;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paymentStatus: TPaymentStatus;
  status: TMembershipStatus;
  remarks?: string;
  isDeleted?: boolean;
  includedWashes?: number;
  usedWashes?: number;
  reservedWashes?: number;
  planNameSnapshot?: string;
  planValidityDays?: number;
  planServicesSnapshot?: string[];
  daysRemaining?: number;
  renewalDueDate?: string;
  renewalDueSoon?: boolean;
  remainingWashes?: number;
  completedWashes?: number;
  scheduledWashes?: number;
  washHistory?: {
    _id: string;
    bookingDate: string;
    bookingTime: string;
    serviceNameSnapshot: string;
    status: string;
    workStatus?: string;
    workCompletedAt?: string | null;
    totalWorkingSeconds?: number;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export type TMembershipPayload = {
  societyId: string;
  flatId: string;
  carId: string;
  planId: string;
  offerId?: string | null;
  startDate: string;
  endDate: string;
  paymentStatus: TPaymentStatus;
  status: TMembershipStatus;
  remarks?: string;
};

export interface TMembershipListParams {
  search?: string;
  status?: TMembershipStatus | "";
  paymentStatus?: TPaymentStatus | "";
  societyId?: string;
  flatId?: string;
  carId?: string;
  planId?: string;
  page?: number;
  limit?: number;
}

export interface TMembershipListResponse {
  data: TMembership[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TMembershipStats {
  total: number;
  active: number;
  pending: number;
  expired: number;
  cancelled: number;
}

export interface TCustomerPlan {
  _id: string;
  name: string;
  description?: string;
  societyId: string | { _id: string; name?: string; city?: string };
  price: number;
  includedWashes: number;
  validityDays: number;
  services: string[];
  billingCycle: string;
}

export interface TMembershipOffer {
  _id: string;
  title: string;
  description?: string;
  planId: string | { _id: string };
  discountType: "Percentage" | "Fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
}

const getData = <T>(response: unknown): T => {
  if (!response || typeof response !== "object") return response as T;
  const data = (response as Record<string, unknown>).data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = data as Record<string, unknown>;
    if (nested.data !== undefined) return nested.data as T;
  }
  return (data ?? response) as T;
};

const getArray = <T>(response: unknown): T[] => {
  if (Array.isArray(response)) return response as T[];
  if (!response || typeof response !== "object") return [];
  const record = response as Record<string, unknown>;
  for (const candidate of [
    record.data,
    record.result,
    record.results,
    record.docs,
    record.items,
  ]) {
    if (Array.isArray(candidate)) return candidate as T[];
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      for (const value of [
        nested.data,
        nested.result,
        nested.results,
        nested.docs,
        nested.items,
      ]) {
        if (Array.isArray(value)) return value as T[];
      }
    }
  }
  return [];
};

export const membershipApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomerMemberships: builder.query<TMembership[], void>({
      query: () => ({ url: "/memberships/mine" }),
      transformResponse: (response: unknown) => getArray<TMembership>(response),
      providesTags: [{ type: "membership", id: "CUSTOMER_LIST" }],
    }),

    getCustomerPlans: builder.query<TCustomerPlan[], { carId: string }>({
      query: (params) => ({
        url: "/memberships/plans",
        params,
      }),
      transformResponse: (response: unknown) =>
        getArray<TCustomerPlan>(response),
    }),

    getMembershipOffers: builder.query<TMembershipOffer[], string>({
      query: (planId) => ({
        url: "/offers",
        params: { planId, status: "Active" },
      }),
      transformResponse: (response: unknown) =>
        getArray<TMembershipOffer>(response).filter(
          (offer) =>
            new Date(offer.startDate) <= new Date() &&
            new Date(offer.endDate) >= new Date(),
        ),
    }),

    purchaseCustomerMembership: builder.mutation<
      TMembership,
      { carId: string; planId: string; offerId?: string; startDate?: string }
    >({
      query: (body) => ({
        url: "/memberships/purchase",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) => getData<TMembership>(response),
      invalidatesTags: [{ type: "membership", id: "CUSTOMER_LIST" }],
    }),

    startStripeMembershipCheckout: builder.mutation<
      { url: string; sessionId: string },
      { membershipId: string }
    >({
      query: (body) => ({
        url: "/payment/stripe/membership-checkout",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) =>
        getData<{ url: string; sessionId: string }>(response),
    }),

    confirmStripeMembershipPayment: builder.mutation<
      TMembership,
      { sessionId: string }
    >({
      query: (body) => ({
        url: "/payment/stripe/confirm",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) => getData<TMembership>(response),
      invalidatesTags: [{ type: "membership", id: "CUSTOMER_LIST" }],
    }),

    getMemberships: builder.query<
      TMembershipListResponse,
      TMembershipListParams | void
    >({
      query: (params) => ({
        url: "/memberships",
        method: "GET",
        params: params || {},
      }),
      transformResponse: (response: unknown): TMembershipListResponse => {
        const result = getArray<TMembership>(response);
        const outer =
          response && typeof response === "object"
            ? (response as Record<string, unknown>)
            : {};
        const data =
          outer.data && typeof outer.data === "object"
            ? (outer.data as Record<string, unknown>)
            : {};

        return {
          data: result,
          meta: (outer.meta ?? data.meta) as TMembershipListResponse["meta"],
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({
                type: "membership" as const,
                id: _id,
              })),
              { type: "membership" as const, id: "LIST" },
            ]
          : [{ type: "membership" as const, id: "LIST" }],
    }),

    getSingleMembership: builder.query<TMembership, string>({
      query: (id) => ({ url: `/memberships/${id}` }),
      transformResponse: (response: unknown) => getData<TMembership>(response),
      providesTags: (_result, _error, id) => [{ type: "membership", id }],
    }),

    getMembershipStats: builder.query<TMembershipStats, void>({
      query: () => ({ url: "/memberships/stats" }),
      transformResponse: (response: unknown) =>
        getData<TMembershipStats>(response),
      providesTags: [{ type: "membership", id: "STATS" }],
    }),

    createMembership: builder.mutation<TMembership, TMembershipPayload>({
      query: (body) => ({
        url: "/memberships",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) => getData<TMembership>(response),
      invalidatesTags: [
        { type: "membership", id: "LIST" },
        { type: "membership", id: "STATS" },
      ],
    }),

    updateMembership: builder.mutation<
      TMembership,
      { id: string; data: Partial<TMembershipPayload> }
    >({
      query: ({ id, data }) => ({
        url: `/memberships/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response: unknown) => getData<TMembership>(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "membership", id },
        { type: "membership", id: "LIST" },
        { type: "membership", id: "STATS" },
      ],
    }),

    deleteMembership: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/memberships/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "membership", id: "LIST" },
        { type: "membership", id: "STATS" },
      ],
    }),
  }),
});

export const {
  useGetCustomerMembershipsQuery,
  useGetCustomerPlansQuery,
  useGetMembershipOffersQuery,
  usePurchaseCustomerMembershipMutation,
  useStartStripeMembershipCheckoutMutation,
  useConfirmStripeMembershipPaymentMutation,
  useGetMembershipsQuery,
  useGetSingleMembershipQuery,
  useGetMembershipStatsQuery,
  useCreateMembershipMutation,
  useUpdateMembershipMutation,
  useDeleteMembershipMutation,
} = membershipApi;
