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
  FaStar,
} from "react-icons/fa";

// import { Button } from "@/components/atoms/Button/Button";
// import { Input } from "@/components/atoms/Input/Input";
import { fetchFeaturedClinics } from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Clinic } from "@/types";

// Images
import HeaderBanner from "@/assets/HeaderBanner.svg";
import LayeredBG from "@/assets/LayeredBg.svg";
import PlusIcon from "@/assets/Icons/PlusIcon.svg";
import CalendarIcon from "@/assets/Icons/CalendarIcon.svg";
import TickIcon from "@/assets/Icons/TickIcon.svg";
import GiftConfidenceImg from "@/assets/GiftConfidenceImg.svg";
import TopRatedClinicImg from "@/assets/TopRatedClinicImg.svg";
import OnlineClinicHome from "@/assets/OnlineClinicHome.svg";
// Treatment Icons
import DermaIcon from "@/assets/Icons/TreatmentIcons/DermaIcon.svg";
import CosmeticIcon from "@/assets/Icons/TreatmentIcons/CosmeticIcon.svg";
import BodyIcon from "@/assets/Icons/TreatmentIcons/BodyIcon.svg";
import HairIcon from "@/assets/Icons/TreatmentIcons/HairIcon.svg";
import DentistIcon from "@/assets/Icons/TreatmentIcons/Dentisticon.svg";
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

const categories = [
  {
    id: "dermatology",
    name: "Dermatology",
    description: "Skin health and medical treatments",
    icon: DermaIcon,
  },
  {
    id: "plastic-surgery",
    name: "Plastic Surgery",
    description: "Cosmetic and reconstructive procedures",
    icon: CosmeticIcon,
  },
  {
    id: "aesthetics",
    name: "Aesthetics",
    description: "Non-surgical beauty treatments",
    icon: BodyIcon,
  },
  {
    id: "hair",
    name: "Hair Treatments",
    description: "Hair restoration and removal",
    icon: HairIcon,
  },
  {
    id: "dentistry",
    name: "Dentistry",
    description: "Dental aesthetics and health",
    icon: DentistIcon,
  },
  {
    id: "wellness",
    name: "Wellness",
    description: "Holistic health and wellness",
    icon: BodyIcon,
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();



  const { featuredClinics, isLoading } = useSelector(
    (state: RootState) => state.client
  );

  const [searchQuery, setSearchQuery] = React.useState("");
  const [location, setLocation] = React.useState("");

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
        className="relative bg-cover bg-center min-h-[400px] sm:min-h-[550px] flex items-center"
        style={{
          backgroundImage: `url(${HeaderBanner})`,
        }}
      >
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 gap-8 items-center h-full px-4 sm:px-6 py-10 sm:py-0">
          <div className="w-full max-w-[600px] mx-auto bg-white shadow-xl rounded-2xl px-5 py-8 sm:px-8 sm:py-10 border border-gray-100">
            <h2 className="text-[#33373F] text-2xl sm:text-[32px] font-bold text-center mb-6 sm:mb-8 leading-tight">What would you like to improve?</h2>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 sm:py-4 bg-gray-50 focus-within:bg-white focus-within:border-lime-400 focus-within:ring-2 focus-within:ring-lime-100 transition-all">
                <FaSearch className="text-gray-400 mr-3 text-lg" />
                <input
                  type="text"
                  placeholder="Find Treatments (e.g. Botox)"
                  className="w-full outline-none text-gray-700 bg-transparent placeholder-gray-400 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 sm:py-4 bg-gray-50 focus-within:bg-white focus-within:border-lime-400 focus-within:ring-2 focus-within:ring-lime-100 transition-all">
                <FaMapMarkerAlt className="text-gray-400 mr-3 text-lg" />
                <input
                  type="text"
                  placeholder="Location (e.g. London)"
                  className="w-full outline-none text-gray-700 bg-transparent placeholder-gray-400 text-base"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="!mt-6 sm:!mt-8 w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-[#CBFF38] text-[#203400] hover:bg-[#bce633] transition-all shadow-md hover:shadow-lg transform active:scale-[0.99]"
              >
                <FaSearch /> Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Popular Categories Section */}
      <section className="py-12 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#33373F]">Popular Categories</h2>
              <p className="text-gray-600 mt-1">Explore top treatments by category</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="flex flex-col items-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-[#CBFF38] transition-all group"
              >
                <div className="size-16 bg-[#F7FAFC] rounded-full flex items-center justify-center mb-4 group-hover:bg-[#CBFF38] transition-colors">
                  <img src={category.icon} alt={category.name} className="size-8" />
                </div>
                <span className="font-semibold text-[#33373F] text-sm">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Clinics Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#33373F]">Featured Clinics</h2>
              <p className="text-gray-600 mt-1">Top-rated clinics recommended for you</p>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="text-lime-600 font-medium hover:text-lime-700 transition"
            >
              See All Clinics &rarr;
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
            </div>
          ) : featuredClinics && featuredClinics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredClinics.map((clinic) => (
                <div
                  key={clinic.id}
                  onClick={() => handleClinicSelect(clinic)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group border border-gray-100 flex flex-col h-full"
                >
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    <img
                      src={clinic.images && clinic.images.length > 0 ? clinic.images[0] : "https://placehold.co/600x400?text=Clinic"}
                      alt={clinic.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-md text-xs font-semibold shadow-sm flex items-center gap-1">
                      <FaStar className="text-yellow-400" />
                      <span>{clinic.rating ? clinic.rating.toFixed(1) : "New"}</span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{clinic.name}</h3>
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <FaMapMarkerAlt className="mr-1 text-gray-400" />
                      <span>{clinic.address.city}, {clinic.address.country}</span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">
                      {clinic.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                      <span className="text-gray-400 text-xs">
                        {clinic.reviewCount || 0} review{clinic.reviewCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-lime-600 font-medium text-sm group-hover:underline">
                        View Details
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              <p>No featured clinics found.</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-[#586271] text-xl uppercase tracking-wider font-medium mb-2">How It Works</h2>
            <h3 className="text-[#33373F] text-2xl sm:text-3xl font-bold">
              3 Steps to Your Treatment
            </h3>
          </div>

          <div className="flex flex-col lg:flex-row justify-center items-center gap-8 mt-10 relative">
            {treatmentSteps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="w-full max-w-[300px] text-center group hover:-translate-y-2 transition-all duration-300 relative z-10 p-4">
                  <div className="size-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-gray-50 group-hover:border-[#CBFF38] transition-colors">
                    <img src={step.icon} alt={step.name} className="w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.name}
                  </h3>
                  <p className="text-base text-gray-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {index < treatmentSteps.length - 1 && (
                  <div
                    className="hidden lg:block w-[100px] h-[2px] mt-[-60px]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to right, #E2E8F0 0 10px, transparent 10px 15px)",
                    }}
                  ></div>
                )}
                {/* Mobile connector line */}
                {index < treatmentSteps.length - 1 && (
                  <div
                    className="block lg:hidden h-[40px] w-[2px]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to bottom, #E2E8F0 0 10px, transparent 10px 15px)",
                    }}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative bg-cover bg-center py-16 px-4 -scale-x-100 overflow-hidden"
        style={{ backgroundImage: `url(${LayeredBG})` }}
      >
        <div className="max-w-[1200px] mx-auto px-0 sm:px-4 w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 -scale-x-100">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col transform transition hover:scale-[1.01] duration-300">
            <img
              src={GiftConfidenceImg}
              alt="Gift Confidence"
              className="w-full h-[200px] sm:h-[240px] object-cover"
            />
            <div className="p-6 sm:p-8 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Gift Confidence
              </h3>
              <p className="text-gray-600 text-base leading-relaxed flex-1 mb-6">
                Give the gift of expert medical beauty treatments — from
                dermatology to aesthetic enhancements.
              </p>
              <button className="w-fit inline-flex items-center justify-center border-2 border-[#5F8B00] text-[#5F8B00] hover:bg-[#5F8B00] hover:text-white transition-all font-bold px-6 py-3 rounded-xl text-sm">
                Send a Gift Card
                <span className="ml-2">→</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col transform transition hover:scale-[1.01] duration-300">
            <img
              src={TopRatedClinicImg}
              alt="Find Clinics"
              className="w-full h-[200px] sm:h-[240px] object-cover"
            />
            <div className="p-6 sm:p-8 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Top-Rated Clinics
              </h3>
              <p className="text-gray-600 text-base leading-relaxed flex-1 mb-6">
                Discover clinics recognized for excellence. Backed by real patient reviews, so you can book with confidence.
              </p>
              <button className="w-fit inline-flex items-center justify-center border-2 border-[#5F8B00] text-[#5F8B00] hover:bg-[#5F8B00] hover:text-white transition-all font-bold px-6 py-3 rounded-xl text-sm">
                Explore Top Clinics
                <span className="ml-2">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#1A202C] text-white py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Own a medical <br /> <span className="text-[#CBFF38]">aesthetics clinic?</span>
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
              We’ll help you grow your practice and attract more patients with
              our easy-to-use booking platform.
            </p>
            <button className="inline-block bg-[#CBFF38] text-[#1A202C] px-8 py-4 rounded-xl font-bold hover:bg-white transition-colors transform hover:-translate-y-1">
              Partner With Us
            </button>
          </div>
          <div className="w-full flex justify-center lg:justify-end">
            <img
              src={OnlineClinicHome}
              alt="Online Clinic Dashboard"
              className="w-full max-w-[500px] rounded-2xl shadow-2xl border-4 border-[#2D3748]"
            />
          </div>
        </div>
      </section>

      <section className="pt-16 bg-gray-50 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="pb-12">
            <div className="text-center mb-12">
              <h2 className="text-[#33373F] text-2xl font-semibold">
                Browse by treatment
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {categories.map((category, idx) => (
                <div key={idx} className="space-y-3">
                  <div
                    className="flex items-center gap-3 border-b border-gray-200 pb-2 cursor-pointer group"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="size-[56px] bg-[#CBFF38] rounded-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                      <img src={category.icon} alt={category.name} className="p-1" />
                    </div>
                    <h3 className="text-gray-800 font-semibold group-hover:text-lime-600 transition-colors">
                      {category.name}
                    </h3>
                  </div>
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
                      <li key={i} className="hover:text-lime-600 cursor-pointer" onClick={() => navigate(`/search?category=${category.id}&location=${city}`)}>{city}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button
                onClick={() => navigate('/search')}
                className="border border-lime-600 text-lime-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-lime-50 transition flex items-center justify-center mx-auto gap-2"
              >
                View More <span className="text-lg">→</span>
              </button>
            </div>
          </div>

          <div className="pt-12 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-[#33373F] mb-4">
                Download our app
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto lg:mx-0 text-lg">
                Book treatments and find the best clinic near you with a quick
                swipe or two.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <a
                  href="#"
                  className="bg-black text-white flex items-center rounded-xl px-5 py-3 gap-3 hover:bg-gray-800 transition shadow-lg"
                  aria-label="Download on App Store"
                >
                  <FaApple size={32} />
                  <span className="text-left leading-none">
                    <span className="text-[10px] uppercase tracking-wider block mb-1">Download on the</span>
                    <span className="font-bold text-lg">App Store</span>
                  </span>
                </a>
                <a
                  href="#"
                  className="bg-black text-white flex items-center rounded-xl px-5 py-3 gap-3 hover:bg-gray-800 transition shadow-lg"
                  aria-label="Get it on Google Play"
                >
                  <FaGooglePlay size={28} />
                  <span className="text-left leading-none">
                    <span className="text-[10px] uppercase tracking-wider block mb-1">GET IT ON</span>
                    <span className="font-bold text-lg">Google Play</span>
                  </span>
                </a>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <img
                src={HomeMobAppImg}
                alt="Mobile App"
                className="w-full max-w-[400px]"
              />
            </div>
          </div>
        </div>

        <img
          src={LayeredBG}
          alt="Background"
          className="absolute bottom-0 left-0 w-full pointer-events-none select-none"
        />
      </section>
    </div>
  );
};
