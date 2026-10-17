import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ArrowRight,
  Sparkles,
  Wand2,
  Scissors,
  Microscope,
  Loader2,
  Smile,
  User,
  Mail,
  Eye,
  Flower2,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useCategoryTree, PublicCategory, PublicTreatment } from "@/hooks/useCategoryTree";
import { getImageUrl } from "@/utils/imageUrl";

// Clinical visual assets
import HeroBg from "@/assets/Treatments_Hero.png";

// Fallback Treatment Assets
import RhinoplastyImg from "@/assets/Treatments/rhinoplasty_elite.png";
import BotoxImg from "@/assets/Treatments/botox_elite.png";
import HairImg from "@/assets/Treatments/hair_transplant_elite.png";
import FillersImg from "@/assets/Treatments/fillers_elite.png";
import EyesImg from "@/assets/Treatments/eyes_surgery_elite.png";
import RejuvenationImg from "@/assets/Treatments/rejuvenation_elite.png";
import PrpImg from "@/assets/Treatments/prp_therapy_elite.png";
import BeardTransplantImg from "@/assets/Treatments/beard_transplant_elite.png";

const getFallbackImg = (name: string): string => {
  const n = (name || "").toLowerCase();
  if (n.includes("botox") || n.includes("wrinkle")) return BotoxImg;
  if (n.includes("filler") || n.includes("lip")) return FillersImg;
  if (n.includes("rhinoplasty") || n.includes("nose")) return RhinoplastyImg;
  if (n.includes("hair") || n.includes("transplant") || n.includes("fue")) return HairImg;
  if (n.includes("eye") || n.includes("bleph")) return EyesImg;
  if (n.includes("skin") || n.includes("rejuvenation") || n.includes("peel") || n.includes("facial") || n.includes("hydra")) return RejuvenationImg;
  if (n.includes("prp")) return PrpImg;
  if (n.includes("beard")) return BeardTransplantImg;
  return BotoxImg;
};

const getCategoryIcon = (name: string) => {
  const n = (name || "").toLowerCase();
  if (n.includes("περιποίηση") || n.includes("aesthetic") || n.includes("care") || n.includes("skincare") || n.includes("αισθητική &")) {
    return <Flower2 size={26} className="stroke-[2.2]" />;
  }
  if (n.includes("προσώπου") || n.includes("face") || n.includes("facial") || n.includes("ιατρική προσώπου")) {
    return <Smile size={26} className="stroke-[2.2]" />;
  }
  if (n.includes("hair") || n.includes("μαλλιά") || n.includes("τριχωτό") || n.includes("αποτρίχωση")) {
    return <Scissors size={26} className="stroke-[2.2]" />;
  }
  if (n.includes("derm") || n.includes("skin") || n.includes("δέρμα") || n.includes("δερματολογ")) {
    return <Microscope size={26} className="stroke-[2.2]" />;
  }
  if (n.includes("plastic") || n.includes("cosmet") || n.includes("surgical") || n.includes("πλαστική") || n.includes("χειρουργική")) {
    return <Wand2 size={26} className="stroke-[2.2]" />;
  }
  if (n.includes("eye") || n.includes("μάτι")) {
    return <Eye size={26} className="stroke-[2.2]" />;
  }
  return <Sparkles size={26} className="stroke-[2.2]" />;
};

const getProcedureSubtitle = (name: string, isGreek: boolean): string => {
  const n = (name || "").toLowerCase();
  if (n.includes("botox") || n.includes("wrinkle")) return isGreek ? "Anti-Wrinkle" : "Anti-Wrinkle";
  if (n.includes("filler") || n.includes("lip")) return isGreek ? "Volume & Contour" : "Volume & Contour";
  if (n.includes("rhino") || n.includes("nose")) return isGreek ? "Nose Reshaping" : "Nose Reshaping";
  if (n.includes("hair") || n.includes("fue")) return isGreek ? "FUE & DHI Technique" : "FUE & DHI Technique";
  if (n.includes("eye") || n.includes("bleph")) return isGreek ? "Eyelid Rejuvenation" : "Eyelid Rejuvenation";
  if (n.includes("prp")) return isGreek ? "Platelet-Rich Plasma" : "Platelet-Rich Plasma";
  if (n.includes("hydra") || n.includes("facial") || n.includes("peel") || n.includes("skin")) return isGreek ? "Deep Cleanse & Glow" : "Deep Cleanse & Glow";
  return isGreek ? "Clinical Protocol" : "Clinical Protocol";
};

const getDefaultCategoryDesc = (name: string, isGreek: boolean): string => {
  const n = (name || "").toLowerCase();
  if (n.includes("αισθητική ιατρική") || n.includes("facial") || n.includes("face") || n.includes("προσώπου")) {
    return isGreek
      ? "Μη χειρουργικές και ελάχιστα επεμβατικές θεραπείες για την ποιότητα του δέρματος, τον όγκο, το περίγραμμα του προσώπου και τα σημάδια γήρανσης."
      : "Non-surgical and minimally invasive treatments for skin quality, volume, facial contouring and signs of aging.";
  }
  if (n.includes("περιποίηση") || n.includes("skincare") || n.includes("care") || n.includes("αισθητική &")) {
    return isGreek
      ? "Υπηρεσίες αισθητικής και περιποίησης προσώπου και σώματος για καθαρισμό, ενυδάτωση, ανανέωση και βελτίωση της όψης της επιδερμίδας."
      : "Aesthetic and skincare services for face and body for cleansing, hydration, renewal, and improving skin appearance.";
  }
  if (n.includes("plastic") || n.includes("χειρουργική") || n.includes("surgical")) {
    return isGreek
      ? "Χειρουργικές επεμβάσεις υψηλής ακρίβειας για τη βελτίωση, αρμονία και αποκατάσταση των χαρακτηριστικών προσώπου και σώματος."
      : "High-precision surgical refinements for facial harmony, reconstructive excellence, and aesthetic rejuvenation.";
  }
  if (n.includes("hair") || n.includes("μαλλιά") || n.includes("τριχωτό")) {
    return isGreek
      ? "Προηγμένες τεχνικές μεταμόσχευσης μαλλιών FUE & DHI και εξειδικευμένες θεραπείες ενδυνάμωσης του τριχωτού της κεφαλής."
      : "Advanced FUE and DHI hair restoration techniques delivering maximum density, natural hairline and clinical precision.";
  }
  return isGreek
    ? "Κλινικές θεραπείες και πρωτόκολλα υψηλών προδιαγραφών από πιστοποιημένους ιατρούς και κλινικές του δικτύου BeautyDoctors."
    : "High-standard clinical treatments and protocols by certified doctors and clinics of the BeautyDoctors network.";
};

const getFallbackProcedures = (name: string, isGreek: boolean): PublicTreatment[] => {
  const n = (name || "").toLowerCase();
  if (n.includes("body") || n.includes("σώμα") || n.includes("cellulite") || n.includes("contour")) {
    return [
      { id: "cryo", name: "CRYOLIPOLYSIS", shortDescription: isGreek ? "Κρυολιπόλυση" : "Fat Freezing" },
      { id: "ems", name: "BODY SCULPTING", shortDescription: isGreek ? "Μυϊκή Τόνωση" : "Muscle Tone & Tightening" }
    ];
  }
  if (n.includes("derm") || n.includes("δέρμα") || n.includes("skin")) {
    return [
      { id: "laser-co2", name: "FRACTIONAL LASER", shortDescription: isGreek ? "Ανάπλαση Δέρματος" : "Resurfacing" },
      { id: "meso", name: "MESOTHERAPY", shortDescription: isGreek ? "Ενυδάτωση & Booster" : "Skin Booster" }
    ];
  }
  if (n.includes("αισθητική ιατρική") || n.includes("facial") || n.includes("face") || n.includes("προσώπου")) {
    return [
      { id: "botox", name: "BOTOX", shortDescription: "Anti-Wrinkle" },
      { id: "fillers", name: "DERMAL FILLERS", shortDescription: "Volume & Contour" }
    ];
  }
  if (n.includes("περιποίηση") || n.includes("skincare") || n.includes("care") || n.includes("αισθητική &")) {
    return [
      { id: "hydra", name: "HYDRAFACIAL", shortDescription: "Deep Cleanse & Glow" },
      { id: "peel", name: "CHEMICAL PEEL", shortDescription: "Skin Renewal" }
    ];
  }
  if (n.includes("plastic") || n.includes("χειρουργική") || n.includes("surgical")) {
    return [
      { id: "rhino", name: "RHINOPLASTY", shortDescription: "Nose Reshaping" },
      { id: "bleph", name: "BLEPHAROPLASTY", shortDescription: "Eyelid Rejuvenation" }
    ];
  }
  if (n.includes("hair") || n.includes("μαλλιά") || n.includes("τριχωτό")) {
    return [
      { id: "hair-transplant", name: "HAIR TRANSPLANT", shortDescription: "FUE & DHI Technique" },
      { id: "prp", name: "PRP HAIR THERAPY", shortDescription: "Follicle Strengthening" }
    ];
  }
  return [
    { id: "botox", name: "BOTOX", shortDescription: "Anti-Wrinkle" },
    { id: "fillers", name: "DERMAL FILLERS", shortDescription: "Volume & Contour" }
  ];
};

const getCategoryLabel = (name: string, isGreek: boolean) => {
  const lower = (name || "").toLowerCase().trim();
  if (lower === "hair removal" || lower === "μόνιμη αποτρίχωση" || lower === "αποτρίχωση") {
    return isGreek ? "ΑΠΟΤΡΙΧΩΣΗ LASER" : "LASER HAIR REMOVAL";
  }
  return name;
};

// Rich fallback categories representing the design mockup
const DEFAULT_MOCKUP_CATEGORIES: PublicCategory[] = [
  {
    id: "cat-aesthetic-care",
    name: "ΑΙΣΘΗΤΙΚΗ & ΠΕΡΙΠΟΙΗΣΗ",
    description: "Υπηρεσίες αισθητικής και περιποίησης προσώπου και σώματος για καθαρισμό, ενυδάτωση, ανανέωση και βελτίωση της όψης της επιδερμίδας.",
    treatments: [
      { id: "hydra", name: "HYDRAFACIAL", shortDescription: "Deep Cleanse & Glow" },
      { id: "peel", name: "CHEMICAL PEEL", shortDescription: "Skin Renewal" }
    ]
  },
  {
    id: "cat-facial-medicine",
    name: "ΑΙΣΘΗΤΙΚΗ ΙΑΤΡΙΚΗ ΠΡΟΣΩΠΟΥ",
    description: "Μη χειρουργικές και ελάχιστα επεμβατικές θεραπείες για την ποιότητα του δέρματος, τον όγκο, το περίγραμμα του προσώπου και τα σημάδια γήρανσης.",
    treatments: [
      { id: "botox", name: "BOTOX", shortDescription: "Anti-Wrinkle" },
      { id: "fillers", name: "DERMAL FILLERS", shortDescription: "Volume & Contour" }
    ]
  },
  {
    id: "cat-plastic-surgery",
    name: "ΠΛΑΣΤΙΚΗ ΧΕΙΡΟΥΡΓΙΚΗ",
    description: "Χειρουργικές επεμβάσεις υψηλής ακρίβειας για τη βελτίωση, αρμονία και αποκατάσταση των χαρακτηριστικών προσώπου και σώματος.",
    treatments: [
      { id: "rhino", name: "RHINOPLASTY", shortDescription: "Nose Reshaping" },
      { id: "bleph", name: "BLEPHAROPLASTY", shortDescription: "Eyelid Rejuvenation" }
    ]
  },
  {
    id: "cat-hair-restoration",
    name: "ΜΕΤΑΜΟΣΧΕΥΣΗ ΜΑΛΛΙΩΝ",
    description: "Προηγμένες τεχνικές μεταμόσχευσης μαλλιών FUE & DHI και εξειδικευμένες θεραπείες ενδυνάμωσης του τριχωτού της κεφαλής.",
    treatments: [
      { id: "hair-transplant", name: "HAIR TRANSPLANT", shortDescription: "FUE & DHI Technique" },
      { id: "prp", name: "PRP HAIR THERAPY", shortDescription: "Follicle Strengthening" }
    ]
  }
];

const CategoryCard: React.FC<{ category: PublicCategory; idx: number; isGreek: boolean }> = ({ category, idx, isGreek }) => {
  const navigate = useNavigate();
  const subs = category.children || [];

  const rawTreatments: PublicTreatment[] = React.useMemo(() => {
    const seen = new Set<string>();
    const out: PublicTreatment[] = [];
    for (const t of [...(category.treatments || []), ...(category.children || []).flatMap((s) => s.treatments || [])]) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        out.push(t);
      }
    }
    return out;
  }, [category]);

  const procedures = rawTreatments.length > 0 
    ? rawTreatments.slice(0, 4) 
    : getFallbackProcedures(category.name, isGreek);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08 }}
      className="bg-white/80 hover:bg-white/95 backdrop-blur-md rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 border border-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.12)] hover:border-[#CBFF38] transition-all duration-300 flex flex-col justify-between group"
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="size-14 sm:size-16 rounded-2xl bg-black text-[#CBFF38] flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform">
              {category.icon ? <span>{category.icon}</span> : getCategoryIcon(category.name)}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-black uppercase text-gray-900 tracking-tight leading-snug group-hover:text-black">
                <span className="notranslate" translate="no">{getCategoryLabel(category.name, isGreek)}</span>
              </h3>
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                ELITE CLINICAL SPECIALTY
              </p>
            </div>
          </div>
          <div
            onClick={() => navigate(`/search?category=${encodeURIComponent(category.name)}`)}
            className="size-9 rounded-full bg-white/80 border border-gray-150 flex items-center justify-center text-gray-400 group-hover:bg-[#CBFF38] group-hover:text-black group-hover:border-[#CBFF38] transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-[13px] text-gray-600 font-medium leading-relaxed mt-4 sm:mt-5">
          {category.description || getDefaultCategoryDesc(category.name, isGreek)}
        </p>

        {/* Subcategories (if any) */}
        {subs.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100/60">
            <div className="flex flex-wrap gap-1.5">
              {subs.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => navigate(`/search?category=${encodeURIComponent(sub.name)}`)}
                  className="px-3 py-1 bg-white/90 hover:bg-[#CBFF38] hover:text-black border border-gray-150 rounded-full text-[10px] font-bold tracking-wider text-gray-700 transition-all cursor-pointer shadow-2xs"
                >
                  {sub.icon ? `${sub.icon} ` : ""}{sub.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Featured Procedures Section */}
      {procedures.length > 0 && (
        <div className="mt-6 pt-5 border-t border-gray-100/60">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748b] mb-3">
            {isGreek ? "FEATURED PROCEDURES" : "FEATURED PROCEDURES"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {procedures.map((t, pIdx) => (
              <div
                key={t.id || pIdx}
                onClick={() => navigate(`/search?query=${encodeURIComponent(t.name)}`)}
                className="bg-white/85 hover:bg-white border border-gray-150/80 hover:border-[#CBFF38] rounded-2xl p-2.5 flex items-center gap-3 transition-all cursor-pointer shadow-2xs group/proc"
              >
                <div className="size-11 sm:size-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center shadow-2xs">
                  <img
                    src={t.imageUrl ? getImageUrl(t.imageUrl) : getFallbackImg(t.name)}
                    onError={(e: any) => { e.target.src = getFallbackImg(t.name); }}
                    className="w-full h-full object-cover group-hover/proc:scale-110 transition-transform duration-300"
                    alt={t.name}
                  />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-black uppercase tracking-tight text-gray-900 leading-snug truncate">
                    {t.name}
                  </h5>
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider truncate mt-0.5">
                    {t.shortDescription || getProcedureSubtitle(t.name, isGreek)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const Treatments: React.FC = () => {
  const navigate = useNavigate();
  const [showConsultModal, setShowConsultModal] = useState(false);
  const { categories, loading } = useCategoryTree({ withTreatments: true });

  const [isGreek, setIsGreek] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem("preferredLang") === "el"
  );

  useEffect(() => {
    const handleLang = () => {
      setIsGreek(localStorage.getItem("preferredLang") === "el");
    };
    window.addEventListener("storage", handleLang);
    const interval = setInterval(handleLang, 1000);
    return () => {
      window.removeEventListener("storage", handleLang);
      clearInterval(interval);
    };
  }, []);

  const displayCategories = categories && categories.length > 0 
    ? categories 
    : DEFAULT_MOCKUP_CATEGORIES;

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] overflow-x-hidden flex flex-col justify-between">
      {/* Background Hero Banner - Sized so image stays sharp, unzoomed, and the clinic room & chair are fully visible */}
      <div className="absolute top-0 inset-x-0 h-[650px] sm:h-[750px] md:h-[820px] lg:h-[880px] z-0 pointer-events-none overflow-hidden">
        <img
          src={HeroBg}
          className="w-full h-full object-cover object-[60%_40%] sm:object-[58%_45%]"
          style={{ filter: "none", imageRendering: "auto" }}
          alt="Clinical Treatments Hero"
        />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent pointer-events-none" />
      </div>

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
                <button onClick={() => setShowConsultModal(false)} className="text-gray-400 hover:text-black transition-colors cursor-pointer">
                  <Sparkles size={24} className="text-[#CBFF38]" />
                </button>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-gray-900 mb-2">
                {isGreek ? "Επικοινωνήστε μαζί μας" : "Connect with us"}
              </h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-10">
                {isGreek ? "Επίσημη Επικοινωνία BeautyDoctors" : "BeautyDoctors Official Correspondence"}
              </p>

              <div className="space-y-4">
                <a
                  href="mailto:info@beautydoctors.gr?subject=Professional%20Inquiry"
                  onClick={() => {
                    try {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText("info@beautydoctors.gr");
                      }
                    } catch {}
                    toast.success("Copied info@beautydoctors.gr to clipboard!", { id: "email-copy-treatments" });
                  }}
                  className="w-full group p-4 sm:p-6 bg-gray-50 hover:bg-black rounded-3xl flex items-center gap-4 sm:gap-6 transition-all duration-300 border border-transparent cursor-pointer"
                >
                  <div className="size-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 group-hover:scale-110 transition-transform shadow-sm">
                    <Mail size={24} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-black uppercase text-gray-900 text-lg group-hover:text-[#CBFF38]">
                      {isGreek ? "Επικοινωνία μέσω Email" : "Email Inquiry"}
                    </h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-300">
                      info@beautydoctors.gr
                    </p>
                  </div>
                </a>
              </div>

              <p className="text-center mt-10 text-[9px] font-black uppercase tracking-widest text-gray-300">
                <span className="notranslate">BeautyDoctors</span> Official Network
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-24">
        {/* Top Header Section (Pushed down cards with generous spacing so clinic room & chair are fully visible) */}
        <div className="mb-28 sm:mb-36 md:mb-48 lg:mb-56">
          {/* Breadcrumb / Category Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-3 text-gray-400 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]"
          >
            <Link to="/" className="text-gray-950 border-b border-gray-950 pb-0.5 hover:text-black">
              {isGreek ? "ΑΡΧΙΚΗ" : "HOME"}
            </Link>
            <span className="text-[#84cc16] sm:text-[#a3e635]">
              {isGreek ? "ΘΕΡΑΠΕΙΕΣ & ΥΠΗΡΕΣΙΕΣ" : "TREATMENTS & SERVICES"}
            </span>
          </motion.div>

          {/* Heading - Restored Previous Wording */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-gray-900 leading-tight"
          >
            {isGreek ? (
              <>
                ΑΝΑΚΑΛΥΨΤΕ <span className="text-[#84cc16] sm:text-[#CBFF38]">ΘΕΡΑΠΕΙΕΣ ΚΑΙ ΥΠΗΡΕΣΙΕΣ</span>
              </>
            ) : (
              <>
                DISCOVER <span className="text-[#84cc16] sm:text-[#CBFF38]">TREATMENTS AND SERVICES</span>
              </>
            )}
          </motion.h1>

          {/* Subtitle - Restored Previous Wording */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-gray-600 mt-4 font-bold text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed"
          >
            {isGreek
              ? "Ενημερωθείτε για θεραπείες και υπηρεσίες που διατίθενται από συμμετέχοντες ιατρούς, κλινικές και παρόχους υπηρεσιών αισθητικής."
              : "Explore information about treatments and services available through participating doctors, clinics and aesthetic service providers."}
          </motion.p>

          {/* Disclaimer */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-gray-500 mt-3 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed italic border-l-2 border-[#CBFF38] pl-3"
          >
            {isGreek
              ? "«Η επιλογή ιατρικής θεραπείας αποτελεί εκδήλωση ενδιαφέροντος. Η καταλληλότητα και το τελικό θεραπευτικό πλάνο καθορίζονται από τον θεράποντα ιατρό μετά από ιατρική αξιολόγηση.»"
              : "“Selecting a medical treatment indicates your Treatment of Interest. Suitability and the final treatment plan are determined by the treating doctor following medical assessment.”"}
          </motion.p>
        </div>

        {/* 2-Column Clinical Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {loading && (
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 size={44} className="animate-spin text-[#CBFF38]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Clinical Protocols...</p>
            </div>
          )}

          {!loading && displayCategories.map((cat, idx) => (
            <CategoryCard key={cat.id || idx} category={cat} idx={idx} isGreek={isGreek} />
          ))}

          {/* Inquiry Banner Card (Full Width in Grid) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 bg-[#1A1A1A] rounded-[32px] sm:rounded-[36px] p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[260px] sm:min-h-[320px] border border-white/10 mt-4"
          >
            <div className="relative z-10 max-w-2xl mx-auto">
              <Sparkles className="text-[#CBFF38] mx-auto mb-4" size={36} />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-4 leading-tight">
                {isGreek ? "ΧΡΕΙΑΖΕΣΤΕ ΒΟΗΘΕΙΑ ΣΤΗΝ ΑΝΑΖΗΤΗΣΗ ΣΑΣ;" : "NEED HELP EXPLORING CLINICAL PROTOCOLS?"}
              </h2>
              <p className="text-gray-300 font-medium max-w-xl mx-auto mb-6 text-xs sm:text-sm leading-relaxed">
                {isGreek
                  ? "Επικοινωνήστε με την ομάδα της BeautyDoctors για πληροφορίες σχετικά με τις διαθέσιμες θεραπείες, τους συνεργαζόμενους ιατρούς και τις κρατήσεις ραντεβού."
                  : "Contact the BeautyDoctors team for information about clinical protocols, partner clinics, and consultation bookings."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowConsultModal(true)}
                  className="px-8 h-12 bg-[#CBFF38] hover:bg-white text-black rounded-xl font-black text-xs uppercase tracking-[0.18em] transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  {isGreek ? "ΕΠΙΚΟΙΝΩΝΗΣΤΕ ΜΑΖΙ ΜΑΣ" : "CONTACT BEAUTYDOCTORS"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/contact")}
                  className="px-8 h-12 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-black text-xs uppercase tracking-[0.18em] transition-all cursor-pointer"
                >
                  {isGreek ? "ΚΕΝΤΡΟ ΥΠΟΣΤΗΡΙΞΗΣ" : "SUPPORT CENTER"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Treatments;
