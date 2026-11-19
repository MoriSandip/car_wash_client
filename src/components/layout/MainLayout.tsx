import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div>
       <div className="bg-white">
        <Outlet />
      </div>
     </div>
  );
};

export default MainLayout;
