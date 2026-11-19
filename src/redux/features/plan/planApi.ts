import { baseApi } from "../../api/baseApi";

export type TPlanStatus = "Active" | "Inactive";
export type TBillingCycle = "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly" | "Custom";

export type TPlan = {
  _id: string;
  societyId:
    | string
    | { _id: string; name: string; city?: string; address?: string };
  name: string;
  description?: string;
  billingCycle: TBillingCycle;
  price: number;
  includedWashes: number;
  validityDays: number;
  services: string[];
  status: TPlanStatus;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TPlanPayload = {
  societyId: string;
  name: string;
  description?: string;
  billingCycle: TBillingCycle;
  price: number;
  includedWashes: number;
  validityDays: number;
  services: string[];
  status: TPlanStatus;
};

export type TPlanListResponse = {
  success: boolean;
  message: string;
  data: TPlan[] | { result: TPlan[]; total?: number };
};

export type TPlanMutationResponse = {
  success: boolean;
  message: string;
  data: TPlan;
};

const PlanApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query<
      TPlanListResponse,
      { search?: string; societyId?: string; status?: TPlanStatus } | void
    >({
      query: (params) => ({
        url: "/plans",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["plan"],
    }),
    getSinglePlan: builder.query<TPlanMutationResponse, string>({
      query: (id) => ({ url: `/plans/${id}`, method: "GET" }),
      providesTags: ["plan"],
    }),
    createPlan: builder.mutation<TPlanMutationResponse, TPlanPayload>({
      query: (payload) => ({ url: "/plans", method: "POST", body: payload }),
      invalidatesTags: ["plan"],
    }),
    updatePlan: builder.mutation<
      TPlanMutationResponse,
      { id: string; data: Partial<TPlanPayload> }
    >({
      query: ({ id, data }) => ({
        url: `/plans/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["plan"],
    }),
    deletePlan: builder.mutation<TPlanMutationResponse, string>({
      query: (id) => ({ url: `/plans/${id}`, method: "DELETE" }),
      invalidatesTags: ["plan"],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetSinglePlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
} = PlanApi;
