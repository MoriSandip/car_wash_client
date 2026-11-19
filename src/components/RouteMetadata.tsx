import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

const routeMetadata: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Sign In | Ultimate Car Wash",
    description: "Sign in to manage your Ultimate Car Wash bookings and account.",
  },
  "/login": {
    title: "Admin Sign In | Ultimate Car Wash",
    description: "Sign in to the Ultimate Car Wash management portal.",
  },
  "/customer/login": {
    title: "Customer Sign In | Ultimate Car Wash",
    description: "Sign in to book and manage your car wash services.",
  },
  "/customer/register": {
    title: "Create Customer Account | Ultimate Car Wash",
    description: "Create an account to book and manage car wash appointments.",
  },
  "/forgot-password": {
    title: "Reset Password | Ultimate Car Wash",
    description: "Request a secure code to reset your Ultimate Car Wash password.",
  },
  "/dashboard": {
    title: "Admin Dashboard | Ultimate Car Wash",
    description: "Review car wash operations and booking activity.",
  },
  "/dashboard/booking": {
    title: "Bookings | Ultimate Car Wash",
    description: "View and manage car wash bookings.",
  },
  "/dashboard/bookingsNew": {
    title: "Booking Management | Ultimate Car Wash",
    description: "Manage customer appointments and booking details.",
  },
  "/dashboard/allUser": {
    title: "User Management | Ultimate Car Wash",
    description: "Manage user access and account status.",
  },
  "/dashboard/addService": {
    title: "Add a Service | Ultimate Car Wash",
    description: "Create a car wash service offering.",
  },
  "/dashboard/allService": {
    title: "Service Management | Ultimate Car Wash",
    description: "Review and manage available car wash services.",
  },
  "/dashboard/society": {
    title: "Society Management | Ultimate Car Wash",
    description: "Manage customer societies and service locations.",
  },
  "/dashboard/flat": {
    title: "Flat Management | Ultimate Car Wash",
    description: "Manage registered flats and residential details.",
  },
  "/dashboard/car": {
    title: "Car Management | Ultimate Car Wash",
    description: "View and manage customer vehicles.",
  },
  "/dashboard/plan": {
    title: "Plan Management | Ultimate Car Wash",
    description: "Manage car wash plans and pricing.",
  },
  "/dashboard/offers": {
    title: "Offers | Ultimate Car Wash",
    description: "Manage customer offers and promotions.",
  },
  "/dashboard/memberships": {
    title: "Membership Management | Ultimate Car Wash",
    description: "Review and manage customer memberships.",
  },
  "/dashboard/wash-services": {
    title: "Wash Services | Ultimate Car Wash",
    description: "Manage wash service options and details.",
  },
  "/dashboard/slots": {
    title: "Booking Slots | Ultimate Car Wash",
    description: "Manage available appointment time slots.",
  },
  "/dashboard/workers": {
    title: "Worker Management | Ultimate Car Wash",
    description: "Manage car wash workers and assignments.",
  },
  "/dashboard/attendance": {
    title: "Attendance Reports | Ultimate Car Wash",
    description: "Review worker attendance reports.",
  },
  "/dashboard/payments": {
    title: "Payment Transactions | Ultimate Car Wash",
    description: "Review car wash payment transactions.",
  },
  "/dashboard/customers": {
    title: "Customer Management | Ultimate Car Wash",
    description: "Review and manage customer accounts.",
  },
  "/dashboard/booking-assignment": {
    title: "Booking Assignments | Ultimate Car Wash",
    description: "Assign car wash bookings to workers.",
  },
  "/worker": {
    title: "Worker Dashboard | Ultimate Car Wash",
    description: "View assigned car wash work and updates.",
  },
  "/bookings": {
    title: "Assigned Bookings | Ultimate Car Wash",
    description: "Review your assigned car wash bookings.",
  },
  "/profile": {
    title: "Worker Profile | Ultimate Car Wash",
    description: "View your worker account profile.",
  },
  "/worker/attendance": {
    title: "Worker Attendance | Ultimate Car Wash",
    description: "Record and review your work attendance.",
  },
  "/worker/attendance/report": {
    title: "Attendance Report | Ultimate Car Wash",
    description: "Review your worker attendance history.",
  },
  "/customer": {
    title: "Customer Dashboard | Ultimate Car Wash",
    description: "Manage your car wash account and bookings.",
  },
  "/customer/profile": {
    title: "Customer Profile | Ultimate Car Wash",
    description: "View and manage your customer profile.",
  },
  "/customer/society": {
    title: "My Society | Ultimate Car Wash",
    description: "Manage the society linked to your customer account.",
  },
  "/customer/flat": {
    title: "My Flat | Ultimate Car Wash",
    description: "Manage your registered flat details.",
  },
  "/customer/car": {
    title: "My Cars | Ultimate Car Wash",
    description: "Manage vehicles registered to your account.",
  },
  "/customer/book-service": {
    title: "Book a Car Wash | Ultimate Car Wash",
    description: "Choose a service and schedule a car wash appointment.",
  },
  "/customer/bookings": {
    title: "My Bookings | Ultimate Car Wash",
    description: "Review your upcoming and previous car wash bookings.",
  },
  "/customer/status": {
    title: "Work Status | Ultimate Car Wash",
    description: "Track the status of your car wash service.",
  },
  "/customer/memberships": {
    title: "My Memberships | Ultimate Car Wash",
    description: "Review your car wash membership details.",
  },
};

const pageMetadata = (pathname: string) => {
  if (routeMetadata[pathname]) return routeMetadata[pathname];

  if (pathname.startsWith("/dashboard/editService/")) {
    return {
      title: "Edit Service | Ultimate Car Wash",
      description: "Update the details of a car wash service.",
    };
  }

  return {
    title: "Page Not Found | Ultimate Car Wash",
    description: "The requested page could not be found.",
  };
};

const setMetaContent = (
  attribute: "name" | "property",
  key: string,
  content: string,
) => {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
};

const RouteMetadata = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPath = pathname.replace(/\/+$/, "") || "/";
    const { title, description } = pageMetadata(normalizedPath);
    document.title = title;
    setMetaContent("name", "description", description);
    setMetaContent("property", "og:title", title);
    setMetaContent("property", "og:description", description);
    setMetaContent(
      "property",
      "og:image",
      `${window.location.origin}/ultimate-car-wash-logo-8-300x116.png`,
    );
    setMetaContent(
      "property",
      "og:image:alt",
      "Ultimate Car Wash and Valet Centre logo",
    );
    setMetaContent("name", "twitter:title", title);
    setMetaContent("name", "twitter:description", description);
    setMetaContent(
      "name",
      "twitter:image",
      `${window.location.origin}/ultimate-car-wash-logo-8-300x116.png`,
    );
  }, [pathname]);

  return <Outlet />;
};

export default RouteMetadata;
