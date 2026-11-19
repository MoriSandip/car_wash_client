import { useState } from "react";
import { Link } from "react-router-dom";

const ProfileDropdown = ({
  image,
  role,
  handelLogout,
}: {
  image: string;
  role: string;
  handelLogout: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const profilePath =
    role === "WORKER"
      ? "/profile"
      : role === "CUSTOMER" || role === "customer"
        ? "/customer/profile"
        : undefined;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-label="Open account menu"
        className="w-9 h-9 md:w-14 md:h-14 rounded-full overflow-hidden focus:outline-none"
      >
        <img
          src={image}
          alt="Profile Image"
          width={40}
          height={40}
          className="w-full h-full object-cover object-center"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
          {profilePath ? (
            <Link
              to={profilePath}
              onClick={() => setIsOpen(false)}
              className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Profile
            </Link>
          ) : null}
          {role === "admin" ? (
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handelLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
