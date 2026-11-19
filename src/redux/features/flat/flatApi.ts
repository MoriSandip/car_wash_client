import { baseApi } from "../../api/baseApi";

export type TFlatStatus =
  | "Available"
  | "Occupied"
  | "Maintenance";

export type TFlatVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export interface TFlat {
  _id: string;
  societyId: string | { _id: string; name?: string };
  flatNumber: string;
  block?: string;
  floorNumber?: number;
  flatType?: string;
  area?: number;
  status: TFlatStatus;
  description?: string;
  isDeleted?: boolean;

  verificationStatus?: TFlatVerificationStatus;
  verificationNote?: string;
  createdBy?: string;
  createdByRole?: string;
  verifiedBy?: string;
  verifiedAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface TFlatPayload {
  societyId: string;
  flatNumber: string;
  block?: string;
  floorNumber?: number;
  flatType?: string;
  area?: number;
  status: TFlatStatus;
  description?: string;
}

export interface TRejectFlatPayload {
  verificationNote: string;
}

export interface TFlatListResponse {
  success?: boolean;
  message?: string;
  data?: TFlat[] | { result?: TFlat[]; data?: TFlat[] };
  result?: TFlat[];
}

export const flatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ADMIN: Get all flats
    getFlats: builder.query<TFlatListResponse, void>({
      query: () => ({
        url: "/flats",
        method: "GET",
      }),
      providesTags: ["flat"],
    }),

    // ADMIN/CUSTOMER: Get single flat
    getSingleFlat: builder.query<{ data: TFlat }, string>({
      query: (id) => ({
        url: `/flats/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "flat", id },
      ],
    }),

    // CUSTOMER: Get flats submitted by the logged-in customer
    getMyFlats: builder.query<TFlatListResponse, void>({
      query: () => ({
        url: "/flats/my",
        method: "GET",
      }),
      providesTags: ["flat"],
    }),

    // CUSTOMER: Get verified flats in the selected society
    getVerifiedFlatsBySociety: builder.query<
      TFlatListResponse,
      string
    >({
      query: (societyId) => ({
        url: `/flats/society/${societyId}/verified`,
        method: "GET",
      }),
      providesTags: (_result, _error, societyId) => [
        { type: "flat", id: `SOCIETY-${societyId}` },
        "flat",
      ],
    }),

    // ADMIN: Get pending flats
    getPendingFlats: builder.query<TFlatListResponse, void>({
      query: () => ({
        url: "/flats/pending",
        method: "GET",
      }),
      providesTags: ["flat"],
    }),

    // ADMIN/CUSTOMER: Create flat
    createFlat: builder.mutation<
      { success: boolean; message?: string; data?: TFlat },
      TFlatPayload
    >({
      query: (body) => ({
        url: "/flats",
        method: "POST",
        body,
      }),
      invalidatesTags: ["flat"],
    }),

    // Update flat
    updateFlat: builder.mutation<
      { success: boolean; message?: string; data?: TFlat },
      { id: string; data: Partial<TFlatPayload> }
    >({
      query: ({ id, data }) => ({
        url: `/flats/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["flat"],
    }),

    // Delete flat
    deleteFlat: builder.mutation<
      { success: boolean; message?: string },
      string
    >({
      query: (id) => ({
        url: `/flats/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["flat"],
    }),

    // ADMIN: Verify flat
    verifyFlat: builder.mutation<
      { success: boolean; message?: string; data?: TFlat },
      string
    >({
      query: (id) => ({
        url: `/flats/${id}/verify`,
        method: "PATCH",
      }),
      invalidatesTags: ["flat"],
    }),

   

    // ADMIN: Reject flat
    rejectFlat: builder.mutation<
      { success: boolean; message?: string; data?: TFlat },
      { id: string; data: TRejectFlatPayload }
    >({
      query: ({ id, data }) => ({
        url: `/flats/${id}/reject`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["flat"],
    }),
  }),
});

export const {
  useGetFlatsQuery,
  useGetSingleFlatQuery,
  useGetMyFlatsQuery,
  useGetVerifiedFlatsBySocietyQuery,
  useGetPendingFlatsQuery,
  useCreateFlatMutation,
  useUpdateFlatMutation,
  useDeleteFlatMutation,
  useVerifyFlatMutation,
  useRejectFlatMutation,
} = flatApi;
