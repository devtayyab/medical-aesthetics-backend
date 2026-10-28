import React, { useEffect, useState } from"react";
import { useNavigate } from"react-router-dom";
import { useDispatch, useSelector } from"react-redux";
import { publicCatalogAPI } from"@/services/api";
import {
 FaApple,
 FaGooglePlay,
 FaStar,
 FaBook,
 FaTh,
 FaMapMarkerAlt
} from"react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from"@/components/organisms/SearchBar";
import {
  ArrowRight,
  Sparkles,
  Mail,
  ShieldCheck,
  Info,
  Lock
} from "lucide-react";
import toast from "react-hot-toast";



// import { Button } from"@/components/atoms/Button/Button";
// import { Input } from"@/components/atoms/Input/Input";
import { fetchFeaturedClinics, searchClinics } from"@/store/slices/clientSlice";
import type { RootState, AppDispatch } from"@/store";
import type { Clinic } from"@/types";

// Images
import HeaderBanner from"@/assets/HomeHeroBanner.png";
import LayeredBG from"@/assets/LayeredBg.svg";
import PlusIcon from"@/assets/Icons/PlusIcon.svg";
import CalendarIcon from"@/assets/Icons/CalendarIcon.svg";
import TickIcon from"@/assets/Icons/TickIcon.svg";
import GiftConfidenceImg from "@/assets/image copy 3.png";
import TopRatedClinicImg from "@/assets/image copy 4.png";
import OnlineClinicHome from"@/assets/OnlineClinicHome.svg";
// Distinct Category Icons matching the 9 reference categories
import DermaIcon from "@/assets/Icons/TreatmentIcons/DermaIcon.svg";
import BodyIcon from "@/assets/Icons/TreatmentIcons/BodyIcon.svg";
import CosmeticIcon from "@/assets/Icons/TreatmentIcons/CosmeticIcon.svg";
import Dentisticon from "@/assets/Icons/TreatmentIcons/Dentisticon.svg";
import HairIcon from "@/assets/Icons/TreatmentIcons/HairIcon.svg";
import SpaAestheticsIcon from "@/assets/Icons/TreatmentIcons/SpaAestheticsIcon.svg";
import FacialMedicineIcon from "@/assets/Icons/TreatmentIcons/FacialMedicineIcon.svg";
import GynecologyIcon from "@/assets/Icons/TreatmentIcons/GynecologyIcon.svg";
import LongevityIcon from "@/assets/Icons/TreatmentIcons/LongevityIcon.svg";
import { useCategoryTree, useTopTreatments } from "@/hooks/useCategoryTree";
import { getImageUrl } from "@/utils/imageUrl";
import HomeMobAppImg from "@/assets/HomeMobAppImg.svg";

export const getCategoryDistinctIcon = (name: string, apiIcon?: string | null): string => {
  if (apiIcon && (apiIcon.startsWith('http') || apiIcon.startsWith('/') || apiIcon.startsWith('data:'))) {
    return apiIcon;
  }
  const n = (name || '').toLowerCase().trim();

  // 1. Spa & Skincare: ΑΙΣΘΗΤΙΚΗ & ΠΕΡΙΠΟΙΗΣΗ, Aesthetics & Care, Skincare, Beauty
  if (n.includes('περιποιηση') || n.includes('αισθητικη &') || n.includes('aesthetics &') || n.includes('skincare') || n.includes('facial care') || n.includes('beauty')) {
    return SpaAestheticsIcon;
  }
  // 2. Facial Aesthetic Medicine: ΑΙΣΘΗΤΙΚΗ ΙΑΤΡΙΚΗ ΠΡΟΣΩΠΟΥ, Facial Aesthetic Medicine
  if (n.includes('προσωπου') || n.includes('facial') || n.includes('face') || n.includes('botox') || n.includes('filler')) {
    return FacialMedicineIcon;
  }
  // 3. Body Aesthetic Medicine: ΑΙΣΘΗΤΙΚΗ ΙΑΤΡΙΚΗ ΣΩΜΑΤΟΣ, Body Aesthetic Medicine
  if (n.includes('σωματοσ') || n.includes('body') || n.includes('contour') || n.includes('liposuction')) {
    return BodyIcon;
  }
  // 4. Gynecology: ΑΙΣΘΗΤΙΚΗ ΚΑΙ ΕΠΑΝΟΡΘΩΤΙΚΗ ΓΥΝΑΙΚΟΛΟΓΙΑ, Gynecology
  if (n.includes('γυναικολογια') || n.includes('gynecology') || n.includes('intimate')) {
    return GynecologyIcon;
  }
  // 5. Dermatology: ΔΕΡΜΑΤΟΛΟΓΙΑ, Dermatology, Medical Dermatology
  if (n.includes('δερματολογια') || n.includes('derma') || n.includes('skin')) {
    return DermaIcon;
  }
  // 6. Longevity & Wellness: ΜΑΚΡΟΖΩΙΑ & ΕΥΕΞΙΑ, Longevity & Wellness
  if (n.includes('μακροζωια') || n.includes('ευεξια') || n.includes('longevity') || n.includes('wellness')) {
    return LongevityIcon;
  }
  // 7. Hair Removal: ΜΟΝΙΜΗ ΑΠΟΤΡΙΧΩΣΗ, Αποτρίχωση, Hair Removal, Laser Hair Removal, Hair
  if (n.includes('αποτριχωση') || n.includes('hair removal') || n.includes('laser') || n.includes('hair') || n.includes('μαλλια')) {
    return HairIcon;
  }
  // 8. Dentistry: ΟΔΟΝΤΙΑΤΡΙΚΗ, Dentistry, Dental
  if (n.includes('οδοντιατρικη') || n.includes('dental') || n.includes('dentist') || n.includes('teeth')) {
    return Dentisticon;
  }
  // 9. Plastic Surgery: ΠΛΑΣΤΙΚΗ ΧΕΙΡΟΥΡΓΙΚΗ, Plastic Surgery
  if (n.includes('πλαστικη') || n.includes('χειρουργικη') || n.includes('plastic') || n.includes('surgery')) {
    return CosmeticIcon;
  }
  return DermaIcon;
};

// Curated 9 Popular Categories matching the reference design exactly
export const REFERENCE_POPULAR_CATEGORIES = [
  { id: 'cat-spa', nameEl: 'ΑΙΣΘΗΤΙΚΗ & ΠΕΡΙΠΟΙΗΣΗ', nameEn: 'Aesthetics & Care', icon: SpaAestheticsIcon },
  { id: 'cat-face', nameEl: 'ΑΙΣΘΗΤΙΚΗ ΙΑΤΡΙΚΗ ΠΡΟΣΩΠΟΥ', nameEn: 'Facial Aesthetic Medicine', icon: FacialMedicineIcon },
  { id: 'cat-body', nameEl: 'ΑΙΣΘΗΤΙΚΗ ΙΑΤΡΙΚΗ ΣΩΜΑΤΟΣ', nameEn: 'Body Aesthetic Medicine', icon: BodyIcon },
  { id: 'cat-gyn', nameEl: 'ΑΙΣΘΗΤΙΚΗ ΚΑΙ ΕΠΑΝΟΡΘΩΤΙΚΗ ΓΥΝΑΙΚΟΛΟΓΙΑ', nameEn: 'Aesthetic & Reconstructive Gynecology', icon: GynecologyIcon },
  { id: 'cat-derma', nameEl: 'ΔΕΡΜΑΤΟΛΟΓΙΑ', nameEn: 'Dermatology', icon: DermaIcon },
  { id: 'cat-longevity', nameEl: 'ΜΑΚΡΟΖΩΙΑ & ΕΥΕΞΙΑ', nameEn: 'Longevity & Wellness', icon: LongevityIcon },
  { id: 'cat-hair', nameEl: 'ΜΟΝΙΜΗ ΑΠΟΤΡΙΧΩΣΗ', nameEn: 'Permanent Hair Removal', icon: HairIcon },
  { id: 'cat-dentist', nameEl: 'ΟΔΟΝΤΙΑΤΡΙΚΗ', nameEn: 'Dentistry', icon: Dentisticon },
  { id: 'cat-surgery', nameEl: 'ΠΛΑΣΤΙΚΗ ΧΕΙΡΟΥΡΓΙΚΗ', nameEn: 'Plastic Surgery', icon: CosmeticIcon },
];

// Premium Assets
import BotoxImg from"@/assets/Botox.jpg";
import RhinoplastyElite from"@/assets/Treatments/rhinoplasty_elite.png";
import BotoxElite from"@/assets/Treatments/botox_elite.png";
import HairElite from"@/assets/Treatments/hair_transplant_elite.png";
import FillersElite from"@/assets/Treatments/fillers_elite.png";
import EyesElite from"@/assets/Treatments/eyes_surgery_elite.png";
import RejuvenationElite from"@/assets/Treatments/rejuvenation_elite.png";
import PrpElite from"@/assets/Treatments/prp_therapy_elite.png";
import BeardElite from"@/assets/Treatments/beard_transplant_elite.png";

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
 id:"choose",
 name:"Explore Treatments & Choose a Provider",
 nameEl:"Δείτε θεραπείες και επιλέξτε ιατρό ή κλινική",
 description:"Dermatology, Plastic Surgery, Skin Treatments, or Aesthetics",
 descriptionEl:"Δερματολογία, Πλαστική Χειρουργική, Θεραπείες Δέρματος ή Αισθητική",
 icon: PlusIcon,
 },
 {
 id:"schedule",
 name:"Select Date & Time",
 nameEl:"Επιλέξτε ημερομηνία και ώρα",
 description:"Select the day and time that works best for you",
 descriptionEl:"Επιλέξτε την ημέρα και την ώρα που σας εξυπηρετεί καλύτερα",
 icon: CalendarIcon,
 },
 {
 id:"confirm",
 name:"Confirm Your Appointment",
 nameEl:"Επιβεβαιώστε το ραντεβού σας",
 description:"Book your consultation or treatment with a participating clinic",
 descriptionEl:"Ολοκληρώστε την κράτηση της επίσκεψης ή της θεραπείας σας",
 icon: TickIcon,
 },
];


const mainCategories = [
 {
 id:"treatments",
 name:"Treatments",
 description:"Browse treatments by category",
 icon: <Sparkles size={28} />,
 link:"/treatments"
 },
 {
 id:"articles",
 name:"Articles",
 description:"Read about latest trends",
 icon: <FaBook className="text-3xl" />,
 link:"/blog" // Placeholder or search redirect
 },
 {
 id:"other",
 name:"Other Services",
 description:"Explore more services",
 icon: <FaTh className="text-3xl" />,
 link:"/services" // Placeholder
 }
];

 export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [showConsultModal, setShowConsultModal] = useState(false);

  const { featuredClinics, isLoading, treatments, error } = useSelector(
    (state: RootState) => state.client
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

 // Super-admin-managed categories + top treatments (replaces hardcoded lists)
 const { categories: dynamicCategories, loading: categoriesLoading } = useCategoryTree();
 const { treatments: topTreatments, loading: topLoading } = useTopTreatments(8);
 const [clinicCities, setClinicCities] = useState<string[]>([]);
 const [isGreek, setIsGreek] = useState<boolean>(
   () => typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el'
 );

 const getCategoryLabel = (name: string) => {
   const lower = (name || '').toLowerCase().trim();
   if (lower === 'hair removal' || lower === 'μόνιμη αποτρίχωση' || lower === 'αποτρίχωση') {
     return isGreek ? 'Αποτρίχωση' : 'Hair Removal';
   }
   return name;
 };

 useEffect(() => {
   const handleLang = () => {
     setIsGreek(localStorage.getItem('preferredLang') === 'el');
   };
   window.addEventListener('storage', handleLang);
   const interval = setInterval(handleLang, 1000);
   return () => {
     window.removeEventListener('storage', handleLang);
     clearInterval(interval);
   };
 }, []);

 useEffect(() => {
   publicCatalogAPI.getCities()
     .then(res => setClinicCities(res.data || []))
     .catch(() => setClinicCities(['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Ioannina']));
 }, []);
 // Prefer the curated"Top Treatments"; fall back to live search results when none are featured.
  // Memoized 9 categories for Popular Categories (guarantees 9 visually differentiated items matching Image 2)
  const popularCategoriesList = React.useMemo(() => {
    return REFERENCE_POPULAR_CATEGORIES.map((refCat) => {
      const matched = dynamicCategories?.find(dc => {
        const dcn = dc.name.toLowerCase();
        return dcn.includes(refCat.nameEn.toLowerCase()) || 
               refCat.nameEl.toLowerCase().includes(dcn) ||
               (refCat.nameEn.toLowerCase().includes('skincare') && dcn.includes('aesthetic')) ||
               (refCat.nameEn.toLowerCase().includes('dermatology') && dcn.includes('derma'));
      });
      return {
        id: matched ? matched.id : refCat.id,
        name: isGreek ? refCat.nameEl : refCat.nameEn,
        icon: refCat.icon,
        rawName: matched ? matched.name : (isGreek ? refCat.nameEl : refCat.nameEn),
      };
    });
  }, [dynamicCategories, isGreek]);

  // Browse by treatment categories (3 distinct columns with separate icons matching Image 1)
  const browseCategoriesList = React.useMemo(() => {
    const defaultCols = [
      { id: 'b-spa', name: isGreek ? 'ΑΙΣΘΗΤΙΚΗ & ΠΕΡΙΠΟΙΗΣΗ' : 'Aesthetics & Care', icon: SpaAestheticsIcon },
      { id: 'b-face', name: isGreek ? 'ΑΙΣΘΗΤΙΚΗ ΙΑΤΡΙΚΗ ΠΡΟΣΩΠΟΥ' : 'Facial Aesthetic Medicine', icon: FacialMedicineIcon },
      { id: 'b-body', name: isGreek ? 'ΑΙΣΘΗΤΙΚΗ ΙΑΤΡΙΚΗ ΣΩΜΑΤΟΣ' : 'Body Aesthetic Medicine', icon: BodyIcon },
    ];
    if (dynamicCategories && dynamicCategories.length >= 3) {
      return dynamicCategories.slice(0, 3).map((c, i) => ({
        id: c.id,
        name: isGreek ? getCategoryLabel(c.name) : c.name,
        icon: getCategoryDistinctIcon(c.name, c.icon) || defaultCols[i % defaultCols.length].icon,
        children: c.children || [],
        rawName: c.name,
      }));
    }
    return defaultCols.map(c => ({
      ...c,
      children: [],
      rawName: c.name,
    }));
  }, [dynamicCategories, isGreek]);

  const referenceBrowseCities = [
    'Cyprus', 'Egkomi', 'Άνω Γλυφάδα', 'Αγία Παρασκευή-Αθήνα', 'Αθήνα-Κολωνάκι',
    'Αμπελόκηποι-Αθήνα', 'Γαλάτσι', 'Θεσσαλονίκη', 'Κολωνάκι-Αθήνα', 'Μέγαρο Μουσικής-Αθήνα',
    'Νέα Ιωνία', 'Νέα Μάκρη', 'Νέα Σμύρνη', 'Παγκράτι', 'Πειραιάς', 'Περιστέρι', 'Πλατεία Μαβίλη-Αθήνα'
  ];

 const displayTreatments: any[] = topTreatments.length > 0 ? topTreatments : (treatments || []);

 useEffect(() => {
 dispatch(fetchFeaturedClinics());
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

 const handleCategoryClick = (categoryName: string) => {
 navigate(`/search?category=${encodeURIComponent(categoryName)}`);
 };

 const handleTreatmentSelect = (treatment: any) => {
 navigate(`/search?q=${treatment.name}`);
 };

 return (
 <div>
 <AnimatePresence>
 {showConsultModal && (
 <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setShowConsultModal(false)}
 className="absolute inset-0 bg-black/60 backdrop-blur-md"
 />
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="bg-white w-[90%] sm:w-full max-w-md rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 relative z-10 shadow-2xl overflow-hidden border border-gray-100"
 >
 <div className="absolute top-0 right-0 p-6">
 <button onClick={() => setShowConsultModal(false)} className="text-gray-400 hover:text-black transition-colors">
 <Sparkles size={24} className="text-[#CBFF38]" />
 </button>
 </div>

 <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 mb-2">Connect with us</h2>
 <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-10">Professional Consultation Protocols</p>

 <div className="space-y-4">
 <a
 href="mailto:info@beautydoctors.gr?subject=Professional%20Consultation%20Request"
 onClick={() => {
   try {
     if (navigator.clipboard) {
       navigator.clipboard.writeText("info@beautydoctors.gr");
     }
   } catch {}
   toast.success("Copied info@beautydoctors.gr to clipboard!", { id: "email-copy-home" });
 }}
 className="w-full group p-6 bg-gray-50 hover:bg-black rounded-3xl flex items-center gap-6 transition-all duration-300 border border-transparent cursor-pointer"
 >
 <div className="size-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 group-hover:scale-110 transition-transform shadow-sm">
 <Mail size={24} />
 </div>
 <div className="text-left">
 <h4 className="font-black uppercase text-gray-900 text-lg group-hover:text-[#CBFF38]">Email Inquiry</h4>
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-300">Official Correspondence</p>
 </div>
 </a>
 </div>

 <p className="text-center mt-10 text-[9px] font-black uppercase tracking-widest text-gray-300"><span className="notranslate">Beauty & Doctors</span> Official Network</p>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Hero Section */}
 <section 
 className="relative w-full bg-cover bg-no-repeat bg-[82%_center] sm:bg-[85%_center] md:bg-[88%_center] lg:bg-center flex items-center min-h-[660px] lg:min-h-[740px]"
 style={{ 
 backgroundImage: `url(${HeaderBanner})`
 }}
 >
 <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent sm:from-white/70 sm:via-white/30 md:from-white/20 md:via-transparent md:to-transparent pointer-events-none" />

 {/* Content Overlay */}
 <div className="relative z-10 w-full py-12 md:py-20">
 <div className="max-w-[1280px] mx-auto w-full px-5 sm:px-8 lg:px-12">
 <div className="flex flex-col max-w-xl">
  <div className="mb-6">
   <h1 className="text-gray-950 text-2xl sm:text-4xl md:text-[44px] lg:text-[48px] font-black mb-3 leading-[1.12] uppercase tracking-tight notranslate" translate="no">
   {isGreek ? 'ΒΡΕΙΤΕ ΤΗΝ ΣΩΣΤΗ' : 'FIND THE RIGHT'} <br />
   <span className="text-[#A3E635] inline-block">{isGreek ? 'ΘΕΡΑΠΕΙΑ ΓΙΑ ΕΣΑΣ' : 'TREATMENT FOR YOU'}</span>
   </h1>

  <p className="text-gray-700 text-xs sm:text-sm md:text-[15px] max-w-lg leading-relaxed font-medium">
  Connect with participating doctors and clinics for medical assessment and personalized treatment planning.
  </p>
  </div>

 <div className="w-full max-w-[500px]">
 <SearchBar
 onSearch={handleSearch}
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

 {/* Popular Categories Section — Dynamic */ }
 <section className="py-12 bg-white">
 <div className="max-w-[1200px] mx-auto px-6">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
 <div>
 <h2 className="text-2xl font-bold text-[#33373F]">Popular Categories</h2>
 <p className="text-gray-600 mt-1">Explore top treatments by category</p>
 </div>
 <button
 onClick={() => navigate('/treatments')}
 className="text-lime-600 font-medium hover:text-lime-700 transition text-sm"
 >
 View All <ArrowRight className="inline-block ml-1 h-4 w-4" />
 </button>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
 {popularCategoriesList.map((category, index) => (
 <button
 key={category.id}
 onClick={() => handleCategoryClick(category.rawName || category.name)}
 className="relative flex flex-col items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md hover:border-[#CBFF38] transition-all group min-h-[175px] overflow-hidden"
 >
 {index === 0 && (
 <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none rounded-tl-3xl border-t-2 border-l-2 border-[#CBFF38]" />
 )}
 <div className="size-16 sm:size-20 rounded-full bg-slate-50/70 border border-slate-100/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
 <img src={category.icon} alt={category.name} className="size-10 sm:size-12 object-contain" />
 </div>
 <span className="font-bold text-[#1E293B] text-[11px] sm:text-[12px] text-center leading-snug uppercase tracking-tight line-clamp-2 px-1">
 {category.name}
 </span>
 <div className="w-8 h-1 bg-[#CBFF38] rounded-full mt-3 opacity-90 group-hover:w-12 transition-all" />
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
 <p className="text-gray-600 mt-1">Explore selected treatments and medical services.</p>
 </div>
 <button
 onClick={() => navigate('/treatments')}
 className="text-lime-600 font-medium hover:text-lime-700 transition"
 >
 See All Treatments <ArrowRight className="inline-block ml-1 h-4 w-4" />
 </button>
 </div>

 {(isLoading || topLoading) && displayTreatments.length === 0 ? (
 <div className="flex justify-center py-12">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
 </div>
 ) : displayTreatments.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 {displayTreatments.map((treatment) => (
 <div
 key={treatment.serviceId || treatment.id}
 onClick={() => handleTreatmentSelect(treatment)}
 className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group border border-gray-100 flex flex-col h-full"
 >
 <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
 <img
 src={(!treatment.imageUrl || treatment.imageUrl.includes('placehold')) ? getFallbackImage(treatment.name) : getImageUrl(treatment.imageUrl)}
 alt={treatment.name}
 onError={(e: any) => {
 e.target.src = getFallbackImage(treatment.name);
 }}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
 />
 {treatment.rating ? (
 <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-md text-xs font-semibold shadow-sm flex items-center gap-1">
 <FaStar className="text-yellow-400" />
 <span>{Number(treatment.rating).toFixed(1)}</span>
 </div>
 ) : null}
 </div>
 <div className="p-5 flex flex-col flex-1">
 <div className="flex items-center gap-2 mb-1">
 <span className="text-[10px] font-black uppercase tracking-widest text-lime-600">
 {treatment.category || treatment.categoryRef?.name ||"Aesthetic"}
 </span>
 </div>
 <h3 className="text-lg font-bold text-gray-900 mb-1 tracking-tight">{treatment.name}</h3>
 <div className="flex items-center text-gray-500 text-sm mb-3">
 <p className="text-gray-600 text-xs line-clamp-2">
 {treatment.shortDescription ||"Elite clinical treatment protocols for anatomical perfection."}
 </p>
 </div>
 <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
 <div className="flex flex-col">
 {isAuthenticated && treatment.fromPrice ? (
 <>
 <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Price Starting From</span>
 <span className="text-lg font-black text-gray-900 tracking-tighter">€{treatment.fromPrice}</span>
 </>
 ) : !isAuthenticated ? (
 <span 
 onClick={(e) => { e.stopPropagation(); navigate('/login'); }}
 className="text-[9px] font-black uppercase text-lime-600 hover:text-black tracking-widest flex items-center gap-1 cursor-pointer transition-colors"
 title={isGreek ? "Σύνδεση για εμφάνιση τιμής" : "Login to view price"}
 >
 <Lock size={11} className="text-lime-600 shrink-0" />
 <span>{isGreek ? "Σύνδεση για τιμές" : "Login to view price"}</span>
 </span>
 ) : (
 <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">View Details</span>
 )}
 </div>
 <span className="text-lime-600 font-black text-[10px] uppercase tracking-widest group-hover:underline">
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
 <h2 className="text-[#586271] text-xl uppercase tracking-wider font-medium mb-2">
 {isGreek ? 'Πώς Λειτουργεί' : 'How It Works'}
 </h2>
 <h3 className="text-[#33373F] text-2xl sm:text-3xl font-bold">
 {isGreek ? '3 βήματα για το ραντεβού σας' : '3 Steps to Your Appointment'}
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
 {isGreek ? step.nameEl : step.name}
 </h3>
 <p className="text-base text-gray-500 leading-relaxed">
 {isGreek ? step.descriptionEl : step.description}
 </p>
 </div>

 {index < treatmentSteps.length - 1 && (
 <div
 className="hidden lg:block w-[100px] h-[2px] mt-[-60px]"
 style={{
 backgroundImage:"repeating-linear-gradient(to right, #E2E8F0 0 10px, transparent 10px 15px)",
 }}
 ></div>
 )}
 {/* Mobile connector line */}
 {index < treatmentSteps.length - 1 && (
 <div
 className="block lg:hidden h-[40px] w-[2px]"
 style={{
 backgroundImage:"repeating-linear-gradient(to bottom, #E2E8F0 0 10px, transparent 10px 15px)",
 }}
 ></div>
 )}
 </React.Fragment>
 ))}
 </div>

 {/* Clinical Notice under Steps */}
 <div className="mt-12 sm:mt-16 max-w-4xl mx-auto p-4 sm:p-6 rounded-2xl bg-gray-50/80 border border-gray-200/80 shadow-xs">
 <div className="flex items-start sm:items-center gap-3.5">
 <div className="size-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#84cc16] shrink-0 shadow-xs mt-0.5 sm:mt-0">
 <Info size={16} />
 </div>
 <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed font-medium">
 {isGreek
 ? 'Η επιλογή ιατρικής θεραπείας αποτελεί εκδήλωση ενδιαφέροντος. Η πραγματοποίησή της προϋποθέτει ιατρική αξιολόγηση και ενημερωμένη συναίνεση. Ο θεράπων ιατρός μπορεί να επιβεβαιώσει, να τροποποιήσει ή να μην πραγματοποιήσει την επιλεγμένη θεραπεία.'
 : 'Selecting a medical treatment indicates your Treatment of Interest. Any medical procedure requires medical assessment and informed consent. The treating doctor may confirm, modify or decide not to perform the selected treatment.'}
 </p>
 </div>
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
 <button 
 onClick={() => navigate('/gift-card')}
 className="w-fit inline-flex items-center justify-center border-2 border-[#5F8B00] text-[#5F8B00] hover:bg-[#5F8B00] hover:text-white transition-all font-bold px-6 py-3 rounded-xl text-sm gap-2"
 >
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
 Aesthetic Treatments
 </h3>
 <p className="text-gray-600 text-base leading-relaxed flex-1 mb-6">
 Explore modern aesthetic treatments delivered by specialized medical professionals.
 </p>
 <button 
 onClick={() => navigate('/treatments')}
 className="w-fit inline-flex items-center justify-center border-2 border-[#5F8B00] text-[#5F8B00] hover:bg-[#5F8B00] hover:text-white transition-all font-bold px-6 py-3 rounded-xl text-sm gap-2"
 >
 Explore Aesthetic Treatments
 <ArrowRight className="h-4 w-4" />
 </button>
 </div>
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
 {browseCategoriesList.map((category) => {
 const subs = category.children || [];
 const citiesToShow = referenceBrowseCities;
 return (
 <div key={category.id} className="space-y-3">
 <div
 className="flex items-center gap-3 border-b border-gray-200 pb-3 cursor-pointer group"
 onClick={() => handleCategoryClick(category.rawName || category.name)}
 >
 <div className="size-[56px] bg-[#CBFF38] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform text-[#0B1120] shadow-sm flex-shrink-0">
 <img src={category.icon} alt={category.name} className="size-10 object-contain p-1" />
 </div>
 <h3 className="text-gray-900 font-bold text-sm tracking-tight group-hover:text-lime-600 transition-colors">
 <span className="notranslate" translate="no">{category.name}</span>
 </h3>
 </div>
 <ul className="space-y-1.5 text-gray-600 text-sm">
 {subs.length > 0
 ? subs.map((sub: any) => (
 <li key={sub.id} className="hover:text-lime-600 cursor-pointer transition-colors" onClick={() => handleCategoryClick(sub.name)}><span className="notranslate" translate="no">{getCategoryLabel(sub.name)}</span></li>
 ))
 : citiesToShow.map((city, i) => (
 <li
 key={i}
 className="flex items-center gap-2 hover:text-lime-600 cursor-pointer group/city transition-colors duration-150 py-0.5"
 onClick={() => navigate(`/search?category=${encodeURIComponent(category.rawName || category.name)}&location=${encodeURIComponent(city)}`)}
 >
 <FaMapMarkerAlt className="w-2.5 h-2.5 text-gray-300 group-hover/city:text-lime-500 flex-shrink-0 transition-colors" />
 <span className="hover:underline">{city}</span>
 </li>
 ))}
 </ul>
 </div>
 );
 })}
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

 <div className="py-12">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="bg-black rounded-[2rem] sm:rounded-[40px] p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[300px] sm:min-h-[400px]"
 >
 <div className="relative z-10">
 <Sparkles className="text-[#CBFF38] mx-auto mb-8" size={40} />
 <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-8 leading-tight">
 {isGreek ? (
   <>Χρειάζεστε βοήθεια <br /> <span className="text-[#CBFF38]">για το επόμενο βήμα;</span></>
 ) : (
   <>Need help choosing <br /> <span className="text-[#CBFF38]">your next step?</span></>
 )}
 </h2>
 <p className="text-gray-300 font-medium max-w-lg mx-auto mb-10 text-sm sm:text-base leading-relaxed">
 {isGreek
   ? 'Βρείτε συμμετέχοντα ιατρό ή κλινική για ιατρική αξιολόγηση και εξατομικευμένο θεραπευτικό πλάνο.'
   : 'Find a participating doctor or clinic for medical assessment and personalised treatment planning.'}
 </p>
 <button
 onClick={() => navigate('/search')}
 className="px-6 py-4 h-auto md:px-12 md:py-0 md:h-16 max-w-full bg-[#CBFF38] text-black rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-white transition-all shadow-xl active:scale-95 mx-auto"
 >
 {isGreek ? 'Βρείτε ιατρό' : 'Find a Doctor'}
 </button>
 </div>
 <div className="absolute inset-0 opacity-10">
 <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover grayscale" alt="Microscope" />
 </div>
 </motion.div>
 </div>

 {/* Clinical Principles Section */}
  <div className="my-16 bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 sm:p-10">
    <div className="max-w-3xl mx-auto text-center space-y-4">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-50 border border-lime-200 text-lime-800 text-xs font-bold uppercase tracking-wider">
        <ShieldCheck size={14} className="text-lime-600" />
        {isGreek ? 'Κλινική Διακυβέρνηση & Ασφάλεια' : 'Clinical Governance & Safety'}
      </div>
      <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-gray-900">
        {isGreek ? (
          <>Κλινικές <span className="text-[#84cc16]">Αρχές</span></>
        ) : (
          <>Clinical <span className="text-[#84cc16]">Principles</span></>
        )}
      </h2>
      <p className="text-base sm:text-lg font-bold text-gray-800">
        {isGreek ? '«Κάθε θεραπεία ξεκινά με ιατρική αξιολόγηση.»' : '“Every treatment begins with medical assessment.”'}
      </p>
      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
        {isGreek
          ? 'Για τις ιατρικές θεραπείες, η ηλεκτρονική επιλογή θεραπείας αποτελεί εκδήλωση ενδιαφέροντος. Η καταλληλότητα και το τελικό θεραπευτικό πλάνο καθορίζονται από τον θεράποντα ιατρό μετά από εξατομικευμένη ιατρική αξιολόγηση.'
          : 'For medical treatments, selecting a treatment online represents your Treatment of Interest. Treatment suitability and the final treatment plan are determined by your treating physician following individual medical assessment.'}
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100 text-left">
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
        <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center font-black text-xs">01</div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-900">
          {isGreek ? '01: Έλεγχος επαγγελματικών στοιχείων' : '01: Provider Credential Verification'}
        </h3>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          {isGreek
            ? 'Τα επαγγελματικά διαπιστευτήρια ελέγχονται από το BeautyDoctors πριν από την ενεργοποίηση του προφίλ. Η επαλήθευση δεν εγγυάται τα αποτελέσματα της θεραπείας.'
            : 'Professional credentials are checked by BeautyDoctors before profile activation. Verification does not guarantee treatment outcomes.'}
        </p>
      </div>
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
        <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center font-black text-xs">02</div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-900">
          {isGreek ? '02: Εξατομικευμένη ιατρική αξιολόγηση' : '02: Individual Medical Assessment'}
        </h3>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          {isGreek
            ? 'Ο θεράπων ιατρός σας αξιολογεί την καταλληλότητα της θεραπείας, τους κινδύνους, τις αντενδείξεις και τις εναλλακτικές λύσεις πριν από μια ιατρική πράξη.'
            : 'Your treating doctor assesses treatment suitability, risks, contraindications and alternatives before a medical procedure.'}
        </p>
      </div>
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
        <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center font-black text-xs">03</div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-900">
          {isGreek ? '03: Ανεξάρτητη κλινική κρίση' : '03: Independent Clinical Judgment'}
        </h3>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          {isGreek
            ? 'Η ιατρική αξιολόγηση και οι θεραπευτικές αποφάσεις παραμένουν αποκλειστική ευθύνη του θεράποντος επαγγελματία υγείας.'
            : 'Medical assessment and treatment decisions remain the responsibility of the treating healthcare professional.'}
        </p>
      </div>
    </div>
  </div>

  <div className="pt-12 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
    <div className="text-center lg:text-left">
      <h2 className="text-3xl font-bold text-[#33373F] mb-4">
        {isGreek ? 'Κατεβάστε την εφαρμογή μας' : 'Download our app'}
      </h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto lg:mx-0 text-lg leading-relaxed">
        {isGreek
          ? 'Ενημερωθείτε για θεραπείες, βρείτε συμμετέχοντες ιατρούς και κλινικές και διαχειριστείτε τα ραντεβού σας μέσω της εφαρμογής BeautyDoctors.'
          : 'Explore treatments, find participating doctors and clinics, and manage your appointments through the BeautyDoctors app.'}
      </p>

      <div className="flex flex-wrap justify-center lg:justify-start gap-4">
        {/* Apps are not published yet: buttons stay visible but are disabled with "coming soon" */}
        <div
          className="relative bg-black text-white flex items-center rounded-xl px-5 py-3 gap-3 opacity-60 cursor-not-allowed shadow-lg select-none"
          aria-disabled="true"
          aria-label={isGreek ? 'App Store: έρχεται σύντομα' : 'App Store: coming soon'}
          title={isGreek ? 'Έρχεται σύντομα' : 'Coming soon'}
        >
          <FaApple size={32} />
          <span className="text-left leading-none">
            <span className="text-[10px] uppercase tracking-wider block mb-1">
              {isGreek ? 'Έρχεται σύντομα στο' : 'Coming soon on the'}
            </span>
            <span className="font-bold text-lg">App Store</span>
          </span>
        </div>
        <div
          className="relative bg-black text-white flex items-center rounded-xl px-5 py-3 gap-3 opacity-60 cursor-not-allowed shadow-lg select-none"
          aria-disabled="true"
          aria-label={isGreek ? 'Google Play: έρχεται σύντομα' : 'Google Play: coming soon'}
          title={isGreek ? 'Έρχεται σύντομα' : 'Coming soon'}
        >
          <FaGooglePlay size={28} />
          <span className="text-left leading-none">
            <span className="text-[10px] uppercase tracking-wider block mb-1">
              {isGreek ? 'Έρχεται σύντομα στο' : 'Coming soon on'}
            </span>
            <span className="font-bold text-lg">Google Play</span>
          </span>
        </div>
      </div>
    </div>

    <div className="flex justify-center lg:justify-end">
      <img
        src={HomeMobAppImg}
        alt="BeautyDoctors Mobile App"
        className="w-full max-w-[380px] drop-shadow-2xl hover:scale-105 transition-transform duration-500"
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
