import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  MapPin,
  Star,
  TrendingUp,
  CheckCircle,
  Calendar,
  UserCheck,
  Rotate3D,
} from "lucide-react";
import {
  FaStethoscope,
  FaHospital,
  FaSearch,
  FaMapMarkerAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import { Button } from "@/components/atoms/Button/Button";
// import { Input } from "@/components/atoms/Input/Input";
import { Card } from "@/components/atoms/Card/Card";
import { ClinicCard } from "@/components/molecules/ClinicCard/ClinicCard";
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

const treatmentSteps = [
  {
    id: "choose",
    name: "Choose a Category",
    description: "Dermatology, Plastic Surgery, Skin Treatments, or Aesthetics",
    // icon: <Search size={32} />,
    icon: PlusIcon,
  },
  {
    id: "schedule",
    name: "Pick Date & Time",
    description: "Select the day and time that works best for you",
    // icon: <Calendar size={32} />,
    icon: CalendarIcon,
  },
  {
    id: "confirm",
    name: "Confirm Your Appointment",
    description: "Book your consultation or treatment with a certified clinic",
    // icon: <CheckCircle size={32} />,
    icon: TickIcon,
  },
];

const categories = [
  {
    id: "dermatology",
    name: "Dermatology",
    description: "Skin health and medical treatments",
    icon: "🔬",
  },
  {
    id: "plastic-surgery",
    name: "Plastic Surgery",
    description: "Cosmetic and reconstructive procedures",
    icon: "✨",
  },
  {
    id: "aesthetics",
    name: "Aesthetics",
    description: "Non-surgical beauty treatments",
    icon: "💫",
  },
  {
    id: "wellness",
    name: "Wellness",
    description: "Holistic health and wellness",
    icon: "🌿",
  },
];

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
          <div className="max-w-[70%] bg-white shadow-lg rounded-xl px-6 py-7">
            {/* Tabs */}
            <div className="flex border border-[#2D3748] rounded-[16px] overflow-hidden mb-6">
              <button className="flex-1 flex items-center justify-center gap-2 py-[10px] bg-[#2D3748] text-white font-medium">
                <FaStethoscope /> Treatments
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-[10px] bg-white text-gray-700 font-medium border-l">
                <FaHospital /> Clinics
              </button>
            </div>

            {/* Search form */}
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Services */}
              <div className="flex items-center border rounded-lg px-3 py-4">
                <FaSearch className="text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="Search for treatments"
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
                  placeholder="Enter postcode"
                  className="w-full outline-none text-gray-700"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Date */}
              <div className="flex items-center border rounded-lg px-3 py-4">
                <FaCalendarAlt className="text-gray-500 mr-2" />
                <input
                  type="date"
                  className="w-full outline-none text-gray-700"
                />
              </div>

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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 md:grid-cols-2 gap-12 -scale-x-100">
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

      {/* Stats Section */}
      <section className="py-16 bg-[#71809633] text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center"></div>
        </div>
      </section>
    </div>
  );
};
