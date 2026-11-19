/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BaseQueryApi,
  BaseQueryFn,
  DefinitionType,
  FetchArgs,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { logout } from "../features/auth/authSlice";
import { toast } from "sonner";
import { RootState } from "../store";
import {
  beginApiRequest,
  requiresApiConfirmation,
  requestApiConfirmation,
} from "./requestUi";

export const API_BASE_URL = "/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithSessionExpiry: BaseQueryFn<
  FetchArgs,
  BaseQueryApi,
  DefinitionType
> = async (args, api, extraOptions): Promise<any> => {
  if (api.type === "mutation" && requiresApiConfirmation(api.endpoint)) {
    const confirmed = await requestApiConfirmation(api.endpoint);
    if (!confirmed) {
      return {
        error: {
          status: "CUSTOM_ERROR",
          error: "ACTION_CANCELLED",
          data: {code: "ACTION_CANCELLED", message: "Action cancelled."},
        },
      };
    }
  }

  const finishRequest = beginApiRequest();
  let result;
  try {
    result = await baseQuery(args, api, extraOptions);

    if (result?.error?.status === 404) {
      const errorMessage = (result.error.data as { message: string }).message;
      toast.error(errorMessage);
    }
    if (result?.error?.status === 403) {
      const errorMessage = (result.error.data as { message: string }).message;
      toast.error(errorMessage);
    }
    if (result?.error?.status === 401) {
      api.dispatch(logout());
    }
    return result;
  } finally {
    finishRequest();
  }
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithSessionExpiry,
  tagTypes: ["booking", "service", "services", "user", "Slot", "car",
    "society",
    "flat",
    "membership",
    "WashService",
    "Booking",
    "BookingNew",
    "Worker",
    'Customer',
    "plan",
    "Offer",
    "Attendance",
    "PaymentTransactions",
  ],
  endpoints: () => ({}),
});
