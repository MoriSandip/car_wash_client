import { createBrowserRouter, Navigate } from "react-router-dom";
import ErrorPage from "@/pages/ErrorPage/ErrorPage";
import Login from "@/pages/Login/Login";
import { Dashboard } from "@/components/layout/DashboardLayout";
import { DashboardHome } from "@/pages/Dashboard/DashboardHome/DashboardHome";
import AllUser from "@/pages/Dashboard/AllUser/AllUser";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AddService from "@/pages/Dashboard/AddService/AddService";
import AllService from "@/pages/Dashboard/AllService/AllService";
import Society from "@/pages/Dashboard/Society/Society";
import Flat from "@/pages/Dashboard/Flat/Flat";
import Car from "@/pages/Dashboard/Car/Car";
import Plan from "@/pages/Dashboard/Plan/Plan";
import Membership from "@/pages/Dashboard/Membership/Membership";
import WashServicePage from "@/pages/Dashboard/wash-services/WashServicePage";
import BookingPage from "@/pages/Dashboard/bookingNew/BookingPage";
import Worker from "@/pages/Dashboard/Worker/Worker";
import BookingAssignment from "@/pages/Dashboard/BookingAssignment/BookingAssignment";
import { WorkerDashboardLayout } from "@/components/layout/WorkerDashboardLayout";
import WorkerDashboard from "@/pages/WorkerDashboard/WorkerDashboard";
import AssignedBookings from "@/pages/WorkerDashboard/AssignedBookings/AssignedBookings";
import Profile from "@/pages/WorkerDashboard/Profile/Profile";
import CustomerDashboardLayout from "@/components/layout/CustomerDashboardLayout";
import CustomerDashboard from "@/pages/CustomerDashboard/CustomerDashboard";
import CustomerProfile from "@/pages/CustomerDashboard/CustomerProfile";
import CustomerRegister from "@/pages/Login/CustomerRegister";
import CustomerSociety from "@/pages/CustomerDashboard/CustomerSociety/CustomerSociety";
import CFlat from "@/pages/CustomerDashboard/CustomerFlat/CFlat";
import CCar from "@/pages/CustomerDashboard/CustomerCars/CCar";
import CustomerBookings from "@/pages/CustomerDashboard/CustomerBookings";
import CustomerPaymentHistory from "@/pages/CustomerDashboard/CustomerPaymentHistory";
import CustomerWorkStatus from "@/pages/CustomerDashboard/CustomerWorkStatus";
import CustomerMemberships from "@/pages/CustomerDashboard/CustomerMemberships";
import SlotManagement from "@/pages/Dashboard/Slots/SlotManagement";
import ForgotPassword from "@/pages/Login/ForgotPassword";
import CustomerManagement from "@/pages/Dashboard/Customer/Customer";
import Offers from "@/pages/Dashboard/Offers/Offers";
import AttendanceReport from "@/pages/Dashboard/Attendance/AttendanceReport";
import PaymentTransactions from "@/pages/Dashboard/Payments/PaymentTransactions";
import CashCollections from "@/pages/Dashboard/Payments/CashCollections";
import WorkerAttendance from "@/pages/WorkerDashboard/Attendance/WorkerAttendance";
import WorkerAttendanceReport from "@/pages/WorkerDashboard/Attendance/WorkerAttendanceReport";
import EditServicePage from "@/pages/Dashboard/AllService/EditServicePage";
import RouteMetadata from "@/components/RouteMetadata";

const routes = createBrowserRouter([
  {
    element: <RouteMetadata />,
    children: [
  {
    path: "/",
    
    children: [
      {
        index: true,
        element: <Login />,
      },
    
    ],
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/customer/login",
    element: <Login />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/customer/register",
    element: <CustomerRegister />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute role="admin">
        <Dashboard />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <DashboardHome />,
      },
      {
        path: "dashboard/booking",
        element: <Navigate to="/dashboard/bookingsNew" replace />,
      },
      {
        path: "dashboard/allUser",
        element: <AllUser />,
      },
      {
        path: "dashboard/addService",
        element: <AddService />,
      },
      {
        path: "dashboard/allService",
        element: <AllService />,
      },
      {
        path: "dashboard/editService/:id",
        element: <EditServicePage />,
      },
      {
        path: "dashboard/society",
        element: <Society />,
      },
      {
        path: "dashboard/flat",
        element: <Flat />,
      },
      {
        path: "dashboard/car",
        element: <Car />,
      },
      {
        path: "dashboard/plan",
        element: <Plan />,
      },
      {
        path: "dashboard/offers",
        element: <Offers />,
      },
      {
        path: "dashboard/memberships",
        element: <Membership />,
      },
      {
        path: "dashboard/wash-services",
        element: <WashServicePage />,
      },
      {
        path: "dashboard/slots",
        element: <SlotManagement />,
      },
      {
        path: "dashboard/bookingsNew",
        element: <BookingPage />,
      },
      {
        path: "dashboard/workers",
        element: <Worker />,
      },
      {
        path: "dashboard/attendance",
        element: <AttendanceReport />,
      },
      {
        path: "dashboard/payments",
        element: <PaymentTransactions />,
      },
      {
        path: "dashboard/cash-collections",
        element: <CashCollections />,
      },
      {
        path: "dashboard/customers",
        element: <CustomerManagement />,
      },
      {
        path: "dashboard/booking-assignment",
        element: <BookingAssignment />,
      },
      //BookingAssignment
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute role="WORKER">
        <WorkerDashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/worker",
        element: <WorkerDashboard />,
      },
      {
        path: "/bookings",
        element: <AssignedBookings />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/worker/attendance",
        element: <WorkerAttendance />,
      },
      {
        path: "/worker/attendance/report",
        element: <WorkerAttendanceReport />,
      },
    ],
  },
  {
    path: "/customer",
    element: (
      <ProtectedRoute role="CUSTOMER">
        <CustomerDashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <CustomerDashboard />,
      },
      {
        path: "profile",
        element: <CustomerProfile />,
      },
      {
        path: "society",
        element: <CustomerSociety />,
      },
      {
        path: "flat",
        element: <CFlat />,
      },
      {
        path: "car",
        element: <CCar />,
      },
      {
        path: "book-service",
        element: <CustomerBookings openBookingOnLoad />,
      },
      {
        path: "bookings",
        element: <CustomerBookings />,
      },
      {
        path: "transactions",
        element: <CustomerPaymentHistory />,
      },
      {
        path: "status",
        element: <CustomerWorkStatus />,
      },
      {
        path: "memberships",
        element: <CustomerMemberships />,
      },
    ],
  },
  {
    path: "*",
    element: <ErrorPage />,
  },
    ],
  },
]);

export default routes;
