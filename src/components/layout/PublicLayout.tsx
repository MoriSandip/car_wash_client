import { Outlet } from "react-router-dom";
import Navbar from "@/pages/navbar/Navbar";
import Footer from "@/pages/Footer/Footer";

const PublicLayout = () => (
  <>
    <Navbar />
    <div className="pt-28">
      <Outlet />
      <Footer />
    </div>
  </>
);

export default PublicLayout;
