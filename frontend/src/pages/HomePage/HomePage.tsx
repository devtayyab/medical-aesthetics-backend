import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaStethoscope,
  FaApple,
  FaGooglePlay,
  FaStar,
  FaBook,
  FaTh,
  FaMapMarkerAlt
} from "react-icons/fa";
import { SearchBar } from "@/components/organisms/SearchBar";
import {
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  CalendarCheck,
  MousePointerClick,
  Lock,
  Syringe
} from "lucide-react";

const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const origin = baseUrl.replace(/\/api$/, '');
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
};


// import { Button } from "@/components/atoms/Button/Button";
// import { Input } from "@/components/atoms/Input/Input";
import { fetchFeaturedClinics, searchClinics } from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Clinic } from "@/types";

// Images
import HeaderBanner from "@/assets/HeroBanner_Premium.png";
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

// Premium Assets
import BotoxImg from "@/assets/Botox.jpg";
import RhinoplastyElite from "@/assets/Treatments/rhinoplasty_elite.png";
import BotoxElite from "@/assets/Treatments/botox_elite.png";
import HairElite from "@/assets/Treatments/hair_transplant_elite.png";
import FillersElite from "@/assets/Treatments/fillers_elite.png";
import EyesElite from "@/assets/Treatments/eyes_surgery_elite.png";
import RejuvenationElite from "@/assets/Treatments/rejuvenation_elite.png";
import PrpElite from "@/assets/Treatments/prp_therapy_elite.png";
import BeardElite from "@/assets/Treatments/beard_transplant_elite.png";

const getFallbackImage = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('botox') || n.includes('wrinkle')) return BotoxElite;
    if (n.includes('filler') || n.includes('lip')) return FillersElite;
    if (n.includes('rhinoplasty') || n.includes('nose')) return RhinoplastyElite;
    if (n.includes('hair') || n.includes('transplant')) return HairElite;
    if (n.includes('eye') || n.includes('bleph')) return EyesElite;
    if (n.includes('skin') || n.includes('rejuvenation') || n.includes('peel') || n.includes('facial')) return RejuvenationElite;
    if (n.includes('prp')) return PrpElite;
    if (n.includes('beard')) return BeardElite;
    return BotoxImg;
};

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

const mainCategories = [
  {
    id: "treatments",
    name: "Treatments",
    description: "Browse treatments by category",
    icon: <Syringe className="text-3xl" />,
    link: "/treatments"
  },
  {
    id: "articles",
    name: "Articles",
    description: "Read about latest trends",
    icon: <FaBook className="text-3xl" />,
    link: "/blog" // Placeholder or search redirect
  },
  {
    id: "other",
    name: "Other Services",
    description: "Explore more services",
    icon: <FaTh className="text-3xl" />,
    link: "/services" // Placeholder
  }
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();



  const { featuredClinics, isLoading, treatments, error } = useSelector(
    (state: RootState) => state.client
  );





  useEffect(() => {
    dispatch(fetchFeaturedClinics());
    // Fetch treatments for the featured section
    dispatch(searchClinics({ limit: 6 }));
  }, [dispatch]);

  const handleSearch = (filters: any) => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.location) params.set("location", filters.location);
    if (filters.date) params.set("date", filters.date);
    if (filters.time) params.set("time", filters.time);
    navigate(`/search?${params.toString()}`);
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/search?category=${categoryId}`);
  };

  const handleTreatmentSelect = (treatment: any) => {
    navigate(`/search?q=${treatment.name}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="relative w-full bg-cover bg-no-repeat flex items-center"
        style={{ 
          backgroundImage: `url(${HeaderBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          height: '70vh',
          minHeight: '520px'
        }}
      >
        <div className="absolute inset-0 bg-white/10 lg:bg-transparent" />

        {/* Content Overlay */}
        <div className="relative z-10 w-full">
          <div className="max-w-[1200px] mx-auto w-full px-6">
            <div className="flex flex-col max-w-xl">
              <h1 className="text-black text-2xl sm:text-[40px] font-black mb-1 leading-tight uppercase tracking-tight">
                BOOK YOUR NEXT <br />
                <span className="text-[#A3E635] whitespace-nowrap">BEAUTY TREATMENT</span>
              </h1>

              <p className="text-gray-700 text-sm mb-4 max-w-md leading-snug font-medium">
                Book your appointment easily and quickly
                with specialized doctors and modern treatments.
              </p>

              <div className="w-full max-w-[480px]">
                <SearchBar
                  onSearch={handleSearch}
                  className="!shadow-2xl border-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Categories Section (New Requirement) */ }
  <section className="py-10 bg-white border-b border-gray-100">
    <div className="max-w-[1200px] mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mainCategories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigate(cat.link)}
            className="cursor-pointer bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#CBFF38] transition-all flex items-center gap-4 group"
          >
            <div className="size-14 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-[#CBFF38] group-hover:text-black transition-colors">
              {cat.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-lime-700 transition-colors">{cat.name}</h3>
              <p className="text-gray-500 text-sm">{cat.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* Popular Categories Section */ }
  <section className="py-12 bg-white">
    <div className="max-w-[1200px] mx-auto px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#33373F]">Popular Categories</h2>
          <p className="text-gray-600 mt-1">Explore top privileges by category</p>
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

  {/* Featured Clinics Section */ }
  <section className="py-12 bg-gray-50">
    <div className="max-w-[1200px] mx-auto px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#33373F]">Featured Treatments</h2>
          <p className="text-gray-600 mt-1">Top-rated treatments recommended for you</p>
        </div>
        <button
          onClick={() => navigate('/treatments')}
          className="text-lime-600 font-medium hover:text-lime-700 transition"
        >
          See All Treatments <ArrowRight className="inline-block ml-1 h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
        </div>
      ) : treatments && treatments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {treatments.map((treatment) => (
            <div
              key={treatment.id}
              onClick={() => handleTreatmentSelect(treatment)}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group border border-gray-100 flex flex-col h-full"
            >
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <img
                  src={(!treatment.imageUrl || treatment.imageUrl.includes('placehold')) ? getFallbackImage(treatment.name) : getImageUrl(treatment.imageUrl)}
                  alt={treatment.name}
                  onError={(e: any) => {
                    e.target.src = getFallbackImage(treatment.name);
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-md text-xs font-semibold shadow-sm flex items-center gap-1">
                  <FaStar className="text-yellow-400" />
                  <span>5.0</span>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-lime-600 italic">
                    {treatment.category || "Aesthetic"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 uppercase italic tracking-tight">{treatment.name}</h3>
                <div className="flex items-center text-gray-500 text-sm mb-3">
                  <p className="text-gray-600 text-xs line-clamp-2">
                    {treatment.shortDescription || "Elite clinical treatment protocols for anatomical perfection."}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Price Starting From</span>
                    <span className="text-lg font-black text-gray-900 italic tracking-tighter">€{treatment.fromPrice || "49.00"}</span>
                  </div>
                  <span className="text-lime-600 font-black text-[10px] uppercase tracking-widest italic group-hover:underline">
                    Book Now
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 bg-white rounded-xl border border-dashed border-red-200">
          <p className="font-bold">Error loading treatments:</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => dispatch(searchClinics({ limit: 6 }))}
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest"
          >
            Retry Sync
          </button>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
          <p>No featured treatments found.</p>
          <button 
            onClick={() => dispatch(searchClinics({ limit: 6 }))}
            className="mt-4 px-6 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
          >
            Refresh Catalog
          </button>
        </div>
      )}
    </div>
  </section>

  {/* How It Works Section */ }
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
              <button className="w-fit inline-flex items-center justify-center border-2 border-[#5F8B00] text-[#5F8B00] hover:bg-[#5F8B00] hover:text-white transition-all font-bold px-6 py-3 rounded-xl text-sm gap-2">
                Send a Gift Card
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col transform transition hover:scale-[1.01] duration-300">
            <img
              src={TopRatedClinicImg}
              alt="Discover Treatments"
              className="w-full h-[200px] sm:h-[240px] object-cover"
            />
            <div className="p-6 sm:p-8 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Top-Rated Treatments
              </h3>
              <p className="text-gray-600 text-base leading-relaxed flex-1 mb-6">
                Discover elite aesthetic protocols recognized for excellence. Backed by clinical science and expert results.
              </p>
              <button 
                onClick={() => navigate('/treatments')}
                className="w-fit inline-flex items-center justify-center border-2 border-[#5F8B00] text-[#5F8B00] hover:bg-[#5F8B00] hover:text-white transition-all font-bold px-6 py-3 rounded-xl text-sm gap-2"
              >
                Explore Top Treatments
                <ArrowRight className="h-4 w-4" />
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
              We'll help you grow your practice and attract more patients with
              our easy-to-use booking platform.
            </p>
            <a 
              href="mailto:info@beautydoctors.gr?subject=Clinic%20Partnership%20Inquiry"
              className="inline-block bg-[#CBFF38] text-[#1A202C] px-8 py-4 rounded-xl font-bold hover:bg-white transition-colors transform hover:-translate-y-1 no-underline"
            >
              Partner With Us
            </a>
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
                      "Athens",
                      "Thessaloniki",
                      "Patras",
                      "Heraklion",
                      "Larissa",
                      "Volos",
                      "Ioannina",
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
                View More <ArrowRight className="h-4 w-4" />
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
    </div >
  );
};
