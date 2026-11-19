import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="inline-block w-40">
              <img
                src="https://i.ibb.co/W0Cx1nT/ultimate-car-wash-logo-8-300x116.png"
                alt="Ultimate Car Wash"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-300">
              Book reliable car wash and detailing services for your vehicle.
            </p>
          </div>

          <nav aria-label="Company">
            <h2 className="font-medium">Company</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link className="hover:text-teal-400" to="/about">
                  About Us
                </Link>
              </li>
              <li>
                <Link className="hover:text-teal-400" to="/contact">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Services">
            <h2 className="font-medium">Services</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link className="hover:text-teal-400" to="/service">
                  Browse Services
                </Link>
              </li>
              <li>
                <Link className="hover:text-teal-400" to="/customer/register">
                  Book a Service
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-medium">Get in touch</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  className="hover:text-teal-400"
                  href="mailto:mdekramulhassan168@gmail.com"
                >
                  mdekramulhassan168@gmail.com
                </a>
              </li>
              <li>
                <a className="hover:text-teal-400" href="tel:+8801762477828">
                  01762477828
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-700 pt-6 text-sm text-gray-400">
          <p>&copy; 2024 Md Ekramul Hassan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
