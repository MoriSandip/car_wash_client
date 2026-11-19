import { baseApi } from "@/redux/api/baseApi";

export type TOfferStatus = "Active" | "Inactive";
export type TOfferDiscountType = "Percentage" | "Fixed";

export type TOfferPlan = {
  _id: string;
  name: string;
  price: number;
  status?: string;
  societyId?: string | { _id: string; name?: string; city?: string };
};

export type TOffer = {
  _id: string;
  planId: string | TOfferPlan;
  title: string;
  description?: string;
  discountType: TOfferDiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  status: TOfferStatus;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TOfferPayload = {
  planId: string;
  title: string;
  description?: string;
  discountType: TOfferDiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  status: TOfferStatus;
};

type TOfferResponse = {
  success: boolean;
  message: string;
  data: TOffer | { result: TOffer[]; total: number };
};

export const offerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOffers: builder.query<
      TOfferResponse,
      { planId?: string; status?: TOfferStatus; search?: string } | void
    >({
      query: (params) => ({
        url: "/offers",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Offer"],
    }),
    createOffer: builder.mutation<TOfferResponse, TOfferPayload>({
      query: (body) => ({ url: "/offers", method: "POST", body }),
      invalidatesTags: ["Offer"],
    }),
    updateOffer: builder.mutation<
      TOfferResponse,
      { id: string; data: Partial<TOfferPayload> }
    >({
      query: ({ id, data }) => ({
        url: `/offers/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Offer"],
    }),
    deleteOffer: builder.mutation<TOfferResponse, string>({
      query: (id) => ({ url: `/offers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Offer"],
    }),
  }),
});

export const {
  useGetOffersQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
} = offerApi;
