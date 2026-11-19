import { baseApi } from "../../api/baseApi";

export type TAvailableSlot = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: "booked" | "available" | "canceled";
  washServiceId?: string;
};

type TSlotsResponse = {
  success: boolean;
  data: TAvailableSlot[];
};

const SlotsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSlots: builder.query({
      query: (userInfo) => ({
        url: `/slots/availability?serviceId=${userInfo.serviceId}&date=${userInfo?.date}`,
        method: "GET",
      }),
      providesTags: ["Slot"],
    }),
    getWashServiceSlots: builder.query<
      TSlotsResponse,
      { serviceId: string; date?: string; from?: string; to?: string }
    >({
      query: ({ serviceId, date, from, to }) => ({
        url: "/slots/availability",
        method: "GET",
        params: { serviceId, date, from, to },
      }),
      providesTags: ["Slot"],
    }),
    createWashServiceSlots: builder.mutation<
      { success: boolean; data: TAvailableSlot[] },
      {
        washServiceId: string;
        date?: string;
        startDate?: string;
        endDate?: string;
        startTime: string;
        endTime: string;
      }
    >({
      query: (body) => ({
        url: "/slots/wash-services",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Slot"],
    }),
    createSlots: builder.mutation({
      query: (userInfo) => ({
        url: `services/slots`,
        method: "POST",
        body: userInfo,
      }),
      invalidatesTags: ["Slot"],
    }),
    bookingSlots: builder.mutation({
      query: (userInfo) => ({
        url: `/bookings`,
        method: "POST",
        body: userInfo,
      }),
      invalidatesTags: ["booking"],
    }),
    updateSlots: builder.mutation({
      query: (userInfo) => ({
        url: `/slots/${userInfo.id}`,
        method: "PUT",
        body: userInfo?.dataUp,
      }),
    }),
  }),
});

export const {
  useGetSlotsQuery,
  useGetWashServiceSlotsQuery,
  useCreateWashServiceSlotsMutation,
  useCreateSlotsMutation,
  useBookingSlotsMutation,
  useUpdateSlotsMutation,
} = SlotsApi;
