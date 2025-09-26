import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaStethoscope,
  FaHospital,
  FaSearch,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaApple,
  FaGooglePlay,
} from "react-icons/fa";

// import { Button } from "@/components/atoms/Button/Button";
// import { Input } from "@/components/atoms/Input/Input";
import { fetchFeaturedClinics } from "@/store/slices/clinicsSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Clinic } from "@/types";

// Images
import HeaderBanner from "@/assets/HeaderBanner.svg";
import LayeredBG from "@/assets/LayeredBG.svg";
import PlusIcon from "@/assets/Icons/PlusIcon.svg";
import CalendarIcon from "@/assets/Icons/CalendarIcon.svg";
import TickIcon from "@/assets/Icons/TickIcon.svg";
import GiftConfidenceImg from "@/assets/GiftConfidenceImg.svg";
import TopRatedClinicImg from "@/assets/TopRatedClinicImg.svg";
import OnlineClinicHome from "@/assets/OnlineClinicHome.svg";
import DermaIcon from "@/assets/Icons/TreatmentIcons/DermaIcon.svg";
import CosmeticIcon from "@/assets/Icons/TreatmentIcons/CosmeticIcon.svg";
import BodyIcon from "@/assets/Icons/TreatmentIcons/BodyIcon.svg";
import HairIcon from "@/assets/Icons/TreatmentIcons/HairIcon.svg";
import DentistIcon from "@/assets/Icons/TreatmentIcons/DentistIcon.svg";
import HomeMobAppImg from "@/assets/HomeMobAppImg.svg";

const treatmentSteps = [
  {
    id: "choose",
    name: "Choose a Treatment",
    description: "Dermatology, Plastic Surgery, Skin Treatments, or Aesthetics",
    icon: PlusIcon,
  },
  {
    id: "schedule",
    name: "Pick Date & Time",
    description: "Select the day and time that works best for you",
    icon: CalendarIcon,
  },
  {
    id: "confirm",
    name: "Confirm Your Appointment",
    description: "Book your consultation or treatment with a certified clinic",
    icon: TickIcon,
  },
];

// const categories = [
//   {
//     id: "dermatology",
//     name: "Dermatology",
//     description: "Skin health and medical treatments",
//     icon: "🔬",
//   },
//   {
//     id: "plastic-surgery",
//     name: "Plastic Surgery",
//     description: "Cosmetic and reconstructive procedures",
//     icon: "✨",
//   },
//   {
//     id: "aesthetics",
//     name: "Aesthetics",
//     description: "Non-surgical beauty treatments",
//     icon: "💫",
//   },
//   {
//     id: "wellness",
//     name: "Wellness",
//     description: "Holistic health and wellness",
//     icon: "🌿",
//   },
// ];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { featuredClinics, isLoading } = useSelector(
    (state: RootState) => state.clinics
  );

  const [searchQuery, setSearchQuery] = React.useState("");
  const [location, setLocation] = React.useState("");

  // useEffect(() => {
  //   dispatch(fetchFeaturedClinics());
  // }, [dispatch]);

  const { isAuthenticated, isLoading: authLoading } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log("HomePage: Dispatching fetchFeaturedClinics");
      dispatch(fetchFeaturedClinics());
    }
  }, [dispatch, isAuthenticated, authLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("location", location);
    navigate(`/search?${params.toString()}`);
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/search?category=${categoryId}`);
  };

  const handleClinicSelect = (clinic: Clinic) => {
    navigate(`/clinic/${clinic.id}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center min-h-[550px]"
        style={{
          backgroundImage: `url(${HeaderBanner})`,
          alignContent: "center",
        }}
      >
        {/* Container with max-width */}
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 gap-8 items-center h-full px-6">
          {/* Left: White search box */}
          <div className="w-[55%] mx-auto bg-white shadow-lg rounded-xl px-6 py-7">
            {/* Tabs */}
            {/* <div className="flex border border-[#2D3748] rounded-[16px] overflow-hidden mb-6">
              <button className="flex-1 flex items-center justify-center gap-2 py-[10px] bg-[#2D3748] text-white font-medium">
                <FaStethoscope /> Treatments
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-[10px] bg-white text-gray-700 font-medium border-l">
                <FaHospital /> Clinics
              </button>
            </div> */}
            <h2 className="text-[#33373F] text-[32px] font-semibold text-center mb-7">What would you like to improve?</h2>

            {/* Search form */}
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Services */}
              <div className="flex items-center border rounded-lg px-3 py-4">
                <FaSearch className="text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="Find Treatments"
                  className="w-full outline-none text-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="flex items-center border rounded-lg px-3 py-4">
                <FaMapMarkerAlt className="text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="Find Cliinic"
                  className="w-full outline-none text-gray-700"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Date */}
              {/* <div className="flex items-center border rounded-lg px-3 py-4">
                <FaCalendarAlt className="text-gray-500 mr-2" />
                <input
                  type="date"
                  className="w-full outline-none text-gray-700"
                />
              </div> */}

              {/* Search button */}
              <button
                type="submit"
                className="!mt-7 w-full py-3 rounded-lg font-medium text-lg flex items-center justify-center gap-2 bg-[#CBFF38] text-[#33373F] hover:bg-lime-300 transition"
              >
                <FaSearch /> Search
              </button>
            </form>
          </div>

          {/* Right: Doctor image full height */}
          {/* <div className="flex justify-center"></div> */}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-[#586271] text-xl">How It Works</h2>
            <h3 className="text-[#33373F] text-2xl font-semibold mb-2">
              3 Steps to Your Treatment
            </h3>
          </div>

          <div className="flex justify-center items-start flex-wrap gap-8 mt-10">
            {treatmentSteps.map((step, index) => (
              <React.Fragment key={index}>
                {/* Box */}
                <div className="w-full lg:w-[240px] text-center group hover:-translate-y-2 transition-all duration-300">
                  <div className="w-fit bg-white rounded-[24px] flex items-center justify-center mx-auto mb-6 px-[30px] py-[26px] text-white shadow-lg group-hover:border-[1px] group-hover:border-[#5F8B00]">
                    <img src={step.icon} alt={step.name} className="w-[48px]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.name}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Divider (only between boxes) */}
                {index < treatmentSteps.length - 1 && (
                  <div
                    className="hidden lg:block w-[100px] h-[2px] self-start mt-[52px]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to right, #9CA3AF 0 10px, transparent 10px 15px)",
                    }}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative bg-cover bg-center min-h-[550px] flex items-center justify-center px-4 -scale-x-100"
        style={{ backgroundImage: `url(${LayeredBG})` }}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-5 lg:px-6 w-full grid grid-cols-1 md:grid-cols-2 gap-12 -scale-x-100 mb-12 md:mb-0">
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            <img
              src={GiftConfidenceImg}
              alt="Gift Confidence"
              className="w-full h-[241px] object-cover"
            />
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Gift Confidence, Not Just Care
              </h3>
              <p className="mt-2 text-gray-600 text-sm flex-1">
                Give the gift of expert medical beauty treatments — from
                dermatology to aesthetic enhancements — and help your loved ones
                feel their best.
              </p>
              <button className="mt-4 w-fit inline-flex items-center justify-center border border-green-600 text-green-700 hover:bg-green-50 font-medium px-4 py-2 rounded-md text-sm">
                Send a Treatment Gift Card
                <span className="ml-2">→</span>
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            <img
              src={TopRatedClinicImg}
              alt="Find Clinics"
              className="w-full h-[241px] object-cover"
            />
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Find Trusted, Top-Rated Clinics
              </h3>
              <p className="mt-2 text-gray-600 text-sm flex-1">
                Discover clinics recognized for their excellence in dermatology,
                plastic surgery, and aesthetic medicine. Backed by real patient
                reviews, so you can book with confidence.
              </p>
              <button className="mt-4 w-fit inline-flex items-center justify-center border border-green-600 text-green-700 hover:bg-green-50 font-medium px-4 py-2 rounded-md text-sm">
                Explore Top Clinics
                <span className="ml-2">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Online Clinic Dashboard Section */}
      <section className="bg-[#71809633] text-white py-12 sm:pt-12 sm:pb-0 lg:pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 sm:gap-6">
          <div className="w-full lg:w-[585px] ml-auto px-5  sm:pl-10 sm:pr-0 lg:pl-5 flex flex-col justify-center space-y-6">
            <h2 className="text-[27px] sm:text-[32px] md:text-4xl font-bold text-[#33373F]">
              Own a medical aesthetics clinic? <br /> Bring it online.
            </h2>
            <p className="text-[#33373F] text-md leading-[22px] max-w-lg">
              We’ll help you grow your practice (and attract more patients) with
              our easy-to-use booking platform for dermatology, plastic surgery,
              and aesthetic treatments.
            </p>
            <button className="w-fit bg-[#2D3748] text-white px-6 py-3 rounded-[12px] font-medium hover:bg-gray-800 transition">
              Partner With Us
            </button>
          </div>
          <div className="w-0 sm:w-full">
            <img
              src={OnlineClinicHome}
              alt="Online Clinic Dashboard"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Browse By Treatment & Download our App*/}
      <section className="pt-16 bg-gray-50 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Browse By Treatment */}
          <div className="pb-12">
            {/* Section Title */}
            <div className="text-center mb-12">
              <h2 className="text-[#33373F] text-2xl font-semibold">
                Browse by treatment
              </h2>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {[
                { icon: DermaIcon, title: "Dermatology" },
                { icon: CosmeticIcon, title: "Cosmetic Surgery" },
                { icon: BodyIcon, title: "Body Contouring" },
                { icon: HairIcon, title: "Hair Treatments" },
                { icon: DentistIcon, title: "Dental Aesthetics" },
                { icon: BodyIcon, title: "Body Contouring" },
              ].map((item, idx) => (
                <div key={idx} className="space-y-3">
                  {/* Title with Icon */}
                  <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
                    <div className="size-[56px] bg-[#CBFF38] rounded-sm flex items-center justify-center">
                      <img src={item.icon} alt={item.title} className="p-1" />
                    </div>
                    <h3 className="text-gray-800 font-semibold">
                      {item.title}
                    </h3>
                  </div>
                  {/* Cities */}
                  <ul className="space-y-1 text-gray-700">
                    {[
                      "London",
                      "Edinburgh",
                      "Leeds",
                      "Liverpool",
                      "Bristol",
                      "Glasgow",
                      "Manchester",
                    ].map((city, i) => (
                      <li key={i}>{city}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Button */}
            <div className="text-center mt-12">
              <button className="border border-lime-600 text-lime-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-lime-50 transition flex items-center justify-center mx-auto gap-2">
                View More <span className="text-lg">→</span>
              </button>
            </div>
          </div>

          {/* Download App */}
          <div className="pt-12 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-semibold text-[#33373F] mb-2">
                Download our app
              </h2>
              <p className="text-[#33373F] mb-10 max-w-md mx-auto lg:mx-0">
                Book treatments and find the best clinic near you with a quick
                swipe or two.
              </p>

              {/* Store Buttons */}
              <div className="flex justify-center lg:justify-start gap-4">
                <a
                  href="#"
                  className="bg-black text-white flex items-center rounded-[8px] px-4 py-2 gap-2"
                  aria-label="Download on App Store"
                >
                  <FaApple size={28} />
                  <span className="text-left leading-tight text-[10px] tracking-wider">
                    Download on the <br />
                    <span className="font-semibold text-[20px]">App Store</span>
                  </span>
                </a>
                <a
                  href="#"
                  className="bg-black text-white flex items-center rounded-[8px] px-4 py-2 gap-2"
                  aria-label="Get it on Google Play"
                >
                  <FaGooglePlay size={26} />
                  <span className="text-left leading-tight text-[10px] tracking-wider">
                    GET IT ON <br />
                    <span className="font-semibold text-[20px]">Google Play</span>
                  </span>
                </a>
              </div>
            </div>

            {/* Right Content - Mobile Image */}
            <div className="flex justify-center lg:justify-end">
              <img
                src={HomeMobAppImg}
                alt="Mobile App"
                className="w-fit"
              />
            </div>
          </div>
        </div>

        {/* Background Layered SVG only at bottom */}
        <img
          src={LayeredBG}
          alt="Background"
          className="absolute bottom-0 left-0 w-full pointer-events-none select-none"
        />
      </section>
    </div>
  );
};
