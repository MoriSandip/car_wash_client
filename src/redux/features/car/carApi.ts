import { baseApi } from "../../api/baseApi";

export type TCarStatus = "Active" | "Inactive" | "Maintenance";

export type TCarType =
  | "Hatchback"
  | "Sedan"
  | "SUV"
  | "MUV"
  | "Luxury"
  | "Other";

export type TCarVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export interface TCarRelatedEntity {
  _id: string;
  name?: string;
  societyName?: string;
  flatNumber?: string;
  block?: string;
  floorNumber?: number;
}

export interface TCar {
  _id: string;

  societyId: string | TCarRelatedEntity;
  flatId: string | TCarRelatedEntity;

  customerId?: string | TCarRelatedEntity;

  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;

  registrationNumber: string;
  make: string;
  model: string;
  color: string;
  imageUrl?: string;
  carType: TCarType;

  parkingSlot?: string;
  status: TCarStatus;
  description?: string;

  isDeleted?: boolean;

  verificationStatus?: TCarVerificationStatus;
  verificationNote?: string;

  createdBy?: string;
  createdByRole?: string;
  verifiedBy?: string;
  verifiedAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface TCarPayload {
  societyId: string;
  flatId: string;

  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;

  registrationNumber: string;
  make: string;
  model: string;
  color: string;
  imageUrl?: string;
  carType: TCarType;

  parkingSlot?: string;
  status: TCarStatus;
  description?: string;
}

export interface TRejectCarPayload {
  verificationNote: string;
}

export interface TCarListResponse {
  success?: boolean;
  message?: string;

  data?:
    | TCar[]
    | {
        result?: TCar[];
        data?: TCar[];
        results?: TCar[];
        docs?: TCar[];
        total?: number;
        page?: number;
        limit?: number;
      };

  result?: TCar[];
  results?: TCar[];
  docs?: TCar[];

  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPage?: number;
  };
}

export interface TCarStats {
  totalCars?: number;
  activeCars?: number;
  inactiveCars?: number;
  maintenanceCars?: number;
  pendingCars?: number;
  verifiedCars?: number;
  rejectedCars?: number;
  [key: string]: unknown;
}

export interface TCarStatsResponse {
  success?: boolean;
  message?: string;
  data?: TCarStats | { result?: TCarStats };
  result?: TCarStats;
}

export const carApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Admin: get all cars
    getCars: builder.query<TCarListResponse, void>({
      query: () => ({
        url: "/cars",
        method: "GET",
      }),
      providesTags: ["car"],
    }),

    // Admin: get cars awaiting verification
    getPendingCars: builder.query<TCarListResponse, void>({
      query: () => ({
        url: "/cars/pending",
        method: "GET",
      }),
      providesTags: ["car"],
    }),

    // Customer: get only the logged-in customer's cars
    getMyCars: builder.query<TCarListResponse, void>({
      query: () => ({
        url: "/cars/my",
        method: "GET",
      }),
      providesTags: ["car"],
    }),

    // Get a single car
    getSingleCar: builder.query<{ data: TCar }, string>({
      query: (id) => ({
        url: `/cars/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "car", id },
      ],
    }),

    // Admin/customer: create a car (backend decides verification status)
    createCar: builder.mutation<
      { success: boolean; message?: string; data?: TCar },
      TCarPayload
    >({
      query: (body) => ({
        url: "/cars",
        method: "POST",
        body,
      }),
      invalidatesTags: ["car"],
    }),

    // Update a car
    updateCar: builder.mutation<
      { success: boolean; message?: string; data?: TCar },
      { id: string; data: Partial<TCarPayload> }
    >({
      query: ({ id, data }) => ({
        url: `/cars/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["car"],
    }),

    // Delete a car
    deleteCar: builder.mutation<
      { success: boolean; message?: string },
      string
    >({
      query: (id) => ({
        url: `/cars/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["car"],
    }),

    // Admin: approve a car
    verifyCar: builder.mutation<
      { success: boolean; message?: string; data?: TCar },
      string
    >({
      query: (id) => ({
        url: `/cars/${id}/verify`,
        method: "PATCH",
      }),
      invalidatesTags: ["car"],
    }),

    // Admin: reject a car with a reason
    rejectCar: builder.mutation<
      { success: boolean; message?: string; data?: TCar },
      { id: string; data: TRejectCarPayload }
    >({
      query: ({ id, data }) => ({
        url: `/cars/${id}/reject`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["car"],
    }),

    // Admin: dashboard counts
    getCarStats: builder.query<TCarStatsResponse, void>({
      query: () => ({
        url: "/cars/stats",
        method: "GET",
      }),
      providesTags: ["car"],
    }),
  }),
});

export const {
  useGetCarsQuery,
  useGetPendingCarsQuery,
  useGetMyCarsQuery,
  useGetSingleCarQuery,
  useCreateCarMutation,
  useUpdateCarMutation,
  useDeleteCarMutation,
  useVerifyCarMutation,
  useRejectCarMutation,
  useGetCarStatsQuery,
} = carApi;
