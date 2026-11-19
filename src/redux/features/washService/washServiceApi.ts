import { baseApi } from "@/redux/api/baseApi";

 
export type WashService = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  status: "Active" | "Inactive";
};

type ListResponse = {
  data: WashService[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
};

type WashServicePayload = {
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  status: "Active" | "Inactive";
};

export const washServiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWashServices: builder.query<
      ListResponse,
      {
        searchTerm?: string;
        page?: number;
        limit?: number;
        status?: string;
      } | void
    >({
      query: (params) => ({
        url: "/wash-services",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["WashService"],
    }),

    getWashServiceStats: builder.query<
      { data: { total: number; active: number; inactive: number } },
      void
    >({
      query: () => ({
        url: "/wash-services/stats",
        method: "GET",
      }),
      providesTags: ["WashService"],
    }),

    createWashService: builder.mutation<
      { data: WashService },
      WashServicePayload
    >({
      query: (body) => ({
        url: "/wash-services",
        method: "POST",
        body,
      }),
      invalidatesTags: ["WashService"],
    }),

    updateWashService: builder.mutation<
      { data: WashService },
      { id: string; body: Partial<WashServicePayload> }
    >({
      query: ({ id, body }) => ({
        url: `/wash-services/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["WashService"],
    }),

    deleteWashService: builder.mutation<
      { data: WashService },
      string
    >({
      query: (id) => ({
        url: `/wash-services/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WashService"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWashServicesQuery,
  useGetWashServiceStatsQuery,
  useCreateWashServiceMutation,
  useUpdateWashServiceMutation,
  useDeleteWashServiceMutation,
} = washServiceApi;
