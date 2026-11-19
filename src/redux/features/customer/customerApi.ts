import { baseApi } from '@/redux/api/baseApi';

export type TCustomer = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
};

export type TCustomerRegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  address?: string;
};

export type TCustomerLoginPayload = {
  email: string;
  password: string;
};

export type TCustomerPayload = Omit<
  TCustomerRegisterPayload,
  "password" | "address"
> & {
  password?: string;
  address?: string;
  status?: TCustomer["status"];
};

type TApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
};

type TCustomerLoginResponse = {
  accessToken: string;
  customer: TCustomer;
};

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<TCustomer[], void>({
      query: () => ({
        url: "/customers",
        method: "GET",
      }),
      transformResponse: (response: unknown): TCustomer[] => {
        const data =
          typeof response === "object" && response !== null && "data" in response
            ? response.data
            : undefined;
        if (!Array.isArray(data)) {
          throw new Error("The customer list response was invalid.");
        }
        return data as TCustomer[];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({
                type: "Customer" as const,
                id: _id,
              })),
              { type: "Customer" as const, id: "LIST" },
            ]
          : [{ type: "Customer" as const, id: "LIST" }],
    }),

    createCustomer: builder.mutation<
      TApiResponse<TCustomer>,
      TCustomerRegisterPayload & { status?: TCustomer["status"] }
    >({
      query: (body) => ({
        url: "/customers",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Customer", id: "LIST" }],
    }),

    updateCustomer: builder.mutation<
      TApiResponse<TCustomer>,
      { id: string; data: Partial<TCustomerPayload> }
    >({
      query: ({ id, data }) => ({
        url: `/customers/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Customer", id },
        { type: "Customer", id: "LIST" },
      ],
    }),

    deleteCustomer: builder.mutation<TApiResponse<TCustomer>, string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Customer", id },
        { type: "Customer", id: "LIST" },
      ],
    }),

    registerCustomer: builder.mutation<
      TApiResponse<TCustomer>,
      TCustomerRegisterPayload
    >({
      query: (body) => ({
        url: '/customers/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customer'],
    }),

    customerLogin: builder.mutation<
      TApiResponse<TCustomerLoginResponse>,
      TCustomerLoginPayload
    >({
      query: (body) => ({
        url: '/customers/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customer'],
    }),

    getMyCustomerProfile: builder.query<TApiResponse<TCustomer>, void>({
      query: () => ({
        url: '/customers/me',
        method: 'GET',
      }),
      providesTags: ['Customer'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useRegisterCustomerMutation,
  useCustomerLoginMutation,
  useGetMyCustomerProfileQuery,
} = customerApi;