import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#2D3748] w-full mt-6">
      <div className="pt-16 pb-8 px-4 sm:px-6 lg:px-12">
        {/* Middle Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side */}
          <div className="max-w-md lg:max-w-lg">
            <Link
              to="/"
              className="text-[2rem] font-medium text-white tracking-tight flex items-start"
            >
              <span className="text-[#CBFF38]">med</span>logo
            </Link>
            <p className="mt-4 text-[16px] text-white text-left leading-relaxed">
              Lorem ipsum, dolor sit amet consectetur adipisicing elit.
              Praesentium natus quod eveniet aut perferendis distinctio iusto
              repudiandae, provident velit earum?
            </p>
          </div>

          {/* Right Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Services */}
            <div>
              <strong className="font-semibold text-[20px] text-[#CBFF38]">
                Overview
              </strong>
              <ul className="mt-6 space-y-3">
                <li>
                  <Link
                    to="#"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    Medicines
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    Healthcare Devices
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    Health Progress
                  </Link>
                </li>
              </ul>
            </div>

            {/* About */}
            <div>
              <strong className="font-semibold text-[20px] text-[#CBFF38]">
                Company
              </strong>
              <ul className="mt-6 space-y-3">
                <li>
                  <Link
                    to="#"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    About us
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    Services
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <strong className="font-semibold text-[20px] text-[#CBFF38]">
                Explore
              </strong>
              <ul className="mt-6 space-y-3">
                <li>
                  <Link
                    to="#"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    Blogs & Feeds
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 border-t border-[#586271] pt-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Social Icons */}
            <div className="flex space-x-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#2D3748] transition hover:bg-blue-600 hover:text-white"
              >
                <FaFacebookF size={18} />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#2D3748] transition hover:bg-black hover:text-white"
              >
                <FaXTwitter size={18} />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#2D3748] transition hover:bg-blue-700 hover:text-white"
              >
                <FaLinkedinIn size={18} />
              </a>
            </div>

            {/* Newsletter */}
            <form className="w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label
                  className="text-white whitespace-nowrap"
                  htmlFor="email"
                >
                  Newsletter
                </label>

                <input
                  className="w-full sm:w-72 rounded-xl border border-[#8B95A5] bg-transparent px-5 py-3 text-white font-medium focus:outline-none focus:border-white"
                  id="email"
                  type="email"
                  placeholder="john@doe.com"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#CBFF38] px-4 py-3 font-medium text-[#2D3748] transition hover:bg-lime-400 w-full sm:w-auto"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
};
