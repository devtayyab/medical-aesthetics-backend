import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Phone, Mail } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#2D3748]">
      <div className="mx-auto max-w-[1200px] px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        {/* Middle Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
          {/* Left Side */}
          <div className="mx-auto max-w-sm lg:max-w-none">
            <Link
              to="/"
              className="text-[2rem] font-medium text-white no-underline tracking-tight flex items-center"
            >
              <span className="text-[#CBFF38]">med</span>logo
            </Link>
            <p className="mt-4 text-[18px] text-center text-white lg:text-left">
              Our aesthetics platform is dedicated to providing high-quality treatments and personalized care. Explore our range of services to find the perfect solution for your beauty and wellness needs.
            </p>
          </div>

          {/* Right Side */}
          <div className="grid grid-cols-1 gap-8 text-center lg:grid-cols-3 lg:text-left">
            {/* Overview */}
            <div>
              <strong className="font-semibold text-[20px] text-[#CBFF38]">
                Overview
              </strong>
              <ul className="mt-6 space-y-[10px]">
                <li>
                  <Link
                    to="/treatments"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    Treatments
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    All Services
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    Latest Articles
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <strong className="font-semibold text-[20px] text-[#CBFF38]">
                Company
              </strong>
              <ul className="mt-6 space-y-[10px]">
                <li>
                  <Link
                    to="/"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    About us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-white transition hover:text-[#CBFF38]"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <strong className="font-semibold text-[20px] text-[#CBFF38]">
                Contact Us
              </strong>
              <ul className="mt-6 space-y-[10px]">
                <li>
                  <a
                    href="tel:6948880498"
                    className="text-white transition hover:text-[#CBFF38] decoration-none no-underline"
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="flex items-center gap-2">
                       <Phone size={14} className="text-[#CBFF38]" /> 6948880498
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@beautydoctors.gr"
                    className="text-white transition hover:text-[#CBFF38] decoration-none no-underline"
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="flex items-center gap-2">
                       <Mail size={14} className="text-[#CBFF38]" /> info@beautydoctors.gr
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 flex flex-wrap justify-center md:justify-between gap-7 items-center border-t border-[#586271] pt-8">
          <div className="flex space-x-[10px]">
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
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="flex justify-between items-center gap-3">
              <label className="text-white text-xs font-bold uppercase tracking-wider" htmlFor="email">
                Newsletter
              </label>

              <input
                className="w-full rounded-[12px] border focus:outline-none border-[#8B95A5] focus:border-white bg-transparent px-5 py-3 pe-32 text-white font-medium"
                id="email"
                type="email"
                placeholder="john@doe.com"
              />

              <button
                type="submit"
                className="rounded-[12px] bg-[#CBFF38] px-5 py-3 font-black text-xs uppercase tracking-widest text-[#2D3748] transition hover:bg-lime-400"
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
