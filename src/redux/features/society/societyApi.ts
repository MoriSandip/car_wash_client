
import { baseApi } from "../../api/baseApi";

export type TSocietyStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type TSociety = {
  _id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  description?: string;
  status?: TSocietyStatus;
  verificationNote?: string;
  verifiedAt?: string | null;
  isDeleted?: boolean;
  createdAt?: string;
};

export type TSocietyPayload = {
  name: string;
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  description?: string;
};

type TSocietyApiResponse = {
  success?: boolean;
  message?: string;
  data?:
    | TSociety
    | TSociety[]
    | { data?: TSociety[]; result?: TSociety[]; societies?: TSociety[] };
  result?: TSociety[];
};

const SocietyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Admin: get all societies
    getSocieties: builder.query<TSocietyApiResponse, void>({
      query: () => ({
        url: "/societies",
        method: "GET",
      }),
      providesTags: ["society"],
    }),

    // Customer: get only societies created by logged-in customer
 

    // Get one society
    getSingleSociety: builder.query<TSocietyApiResponse, string>({
      query: (id) => ({
        url: `/societies/${id}`,
        method: "GET",
      }),
      providesTags: ["society"],
    }),

    // Create society
    createSociety: builder.mutation<TSocietyApiResponse, TSocietyPayload>({
      query: (payload) => ({
        url: "/societies",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["society"],
    }),

    // Update society
    updateSociety: builder.mutation<
      TSocietyApiResponse,
      { id: string; data: Partial<TSocietyPayload> }
    >({
      query: ({ id, data }) => ({
        url: `/societies/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["society"],
    }),

    // Delete society
    deleteSociety: builder.mutation<TSocietyApiResponse, string>({
      query: (id) => ({
        url: `/societies/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["society"],
    }),

    // Admin: verify society
    verifySociety: builder.mutation<TSocietyApiResponse, string>({
      query: (id) => ({
        url: `/societies/${id}/verify`,
        method: "PATCH",
      }),
      invalidatesTags: ["society"],
    }),

    getMySocieties: builder.query<TSocietyApiResponse, void>({
      query: () => ({
        url: "/societies/my",
        method: "GET",
      }),
      providesTags: ["society"],
    }),
    // Admin: reject society
    rejectSociety: builder.mutation<
      TSocietyApiResponse,
      { id: string; verificationNote: string }
    >({
      query: ({ id, verificationNote }) => ({
        url: `/societies/${id}/reject`,
        method: "PATCH",
        body: { verificationNote },
      }),
      invalidatesTags: ["society"],
    }),
  }),
});

export const {
  useGetSocietiesQuery,
  useGetMySocietiesQuery,
  useGetSingleSocietyQuery,
  useCreateSocietyMutation,
  useUpdateSocietyMutation,
  useDeleteSocietyMutation,
  useVerifySocietyMutation,
  useRejectSocietyMutation, 
} = SocietyApi;
