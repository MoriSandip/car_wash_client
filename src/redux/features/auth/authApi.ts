import { baseApi } from "../../api/baseApi";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    requestLoginOtp: builder.mutation<
      {
        success: boolean;
        message: string;
        data: { destination: string; developmentOtp?: string };
      },
      {
        role: "admin" | "customer" | "worker";
        channel: "email" | "phone";
        identifier: string;
      }
    >({
      query: (body) => ({
        url: "/auth/otp/request",
        method: "POST",
        body,
      }),
    }),

    verifyLoginOtp: builder.mutation<
      { success: boolean; message: string; data: { accessToken: string } },
      {
        role: "admin" | "customer" | "worker";
        channel: "email" | "phone";
        identifier: string;
        code: string;
      }
    >({
      query: (body) => ({
        url: "/auth/otp/verify",
        method: "POST",
        body,
      }),
    }),

    forgotPassword: builder.mutation<
      { success: boolean; message: string },
      { email: string; role: "ADMIN" | "CUSTOMER" | "WORKER" }
    >({
      query: (body) => ({
        url: "/auth/password/forgot",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation<
      { success: boolean; message: string },
      {
        email: string;
        role: "ADMIN" | "CUSTOMER" | "WORKER";
        code: string;
        newPassword: string;
      }
    >({
      query: (body) => ({
        url: "/auth/password/reset",
        method: "POST",
        body,
      }),
    }),

    login: builder.mutation({
      query: (userInfo) => ({
        url: "/auth/login",
        method: "POST",
        body: userInfo,
      }),
    }),

    workerLogin: builder.mutation({
      query: (userInfo) => ({
        url: "/workers/login",
        method: "POST",
        body: userInfo,
      }),
    }),

    customerLogin: builder.mutation({
      query: (data) => ({
        url: "/customers/login",
        method: "POST",
        body: data,
      }),
    }),

    CreateUser: builder.mutation({
      query: (userInfo) => ({
        url: "/auth/signup",
        method: "POST",
        body: userInfo,
      }),
    }),
  }),
});

export const {
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLoginMutation,
  useRequestLoginOtpMutation,
  useVerifyLoginOtpMutation,
  useWorkerLoginMutation,
  useCreateUserMutation,
  useCustomerLoginMutation,
} = authApi;
