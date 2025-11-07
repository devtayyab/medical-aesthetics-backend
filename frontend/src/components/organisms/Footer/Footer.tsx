import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import SiteLogo from "@/assets/SiteLogo.png";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#2D3748] ">
      <div
    className="
      w-full max-w-[1440px] h-auto  sm:px-[156px]  py-12" >
        {/* Middle Content */}
        <div className="grid grid-cols-1 py-12 gap-[62px] lg:grid-cols-2 lg:gap-16">
          {/* Left Side */}
          <div className="w-full h-auto gap-9 lg:max-w-none">
            <Link
              to="/"
              className="text-[2rem] font-medium text-white no-underline tracking-tight flex items-center"
            >
              <img src={SiteLogo} alt="Site Logo" className="w-[200px]" />
            </Link>
            <p className="mt-4  text-[18px] text-center text-white lg:text-left">
              Lorem ipsum, dolor sit amet consectetur adipisicing elit.
              Praesentium natus quod eveniet aut perferendis distinctio iusto
              repudiandae, provident velit earum?
            </p>
          </div>

          {/* Right Side */}
          <div className="grid grid-cols-1  gap-4 text-center lg:grid-cols-3 lg:text-left">
            {/* Services */}
            <div>
              <strong className="font-semibold text-[20px] text-[#CBFF38]">
                Overview
              </strong>
              <ul className="mt-6 space-y-[10px]">
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
              <ul className="mt-6 space-y-[10px]">
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
              <ul className="mt-6 space-y-[10px]">
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
                    Privacy Police
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
        <div className="  w-full h-auto flex flex-wrap justify-center md:justify-between  items-center border-t border-[#586271] py-12 ">
         <div className="flex flex-wrap gap-2 sm:gap-4 md:gap-6 lg:gap-8 py-4 md:py-6">
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-[7px] bg-white text-[#2D3748] transition hover:bg-blue-600 hover:text-white"
            >
              <FaFacebookF size={18} />
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-[7px] bg-white text-[#2D3748] transition hover:bg-black hover:text-white"
            >
              <FaXTwitter size={18} />
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-[7px] bg-white text-[#2D3748] transition hover:bg-blue-700 hover:text-white"
            >
              <FaLinkedinIn size={18} />
            </a>
          </div>
          <form>
            <div className="flex justify-between  w-auto h-auto items-center gap-3">
              <label className="text-white w-[85px] h-[22px]" htmlFor="email">
                Newsletter
              </label>

              <input
                className=" w-full h-auto  rounded-[12px] border focus:outline-none border-[#8B95A5] focus:border-white bg-transparent  p-3  gap-4 text-white font-medium"
                id="email"
                type="email"
                placeholder="Enter your Email"
              />

              <button
                type="submit"
                className="rounded-[12px] bg-[#CBFF38] px-4 py-3 font-medium gap-2 text-[#2D3748] transition hover:bg-lime-400"
              >
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </div>
    </footer>
  );
};
