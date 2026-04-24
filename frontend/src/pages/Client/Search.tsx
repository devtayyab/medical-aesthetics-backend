import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { searchClinics } from "@/store/slices/clientSlice";
import { RootState, AppDispatch } from "@/store";
import { SearchBar } from "@/components/organisms/SearchBar";
import { ClinicCard } from "@/components/molecules/ClinicCard/ClinicCard";
import { TreatmentCard } from "@/components/molecules/TreatmentCard/TreatmentCard";
import { 
  MapPin, X, Filter, ChevronDown, List, Map as MapIcon, 
  Star, Search as SearchIcon, Calendar, Info, ArrowRight,
  Maximize2, Settings2, Sparkles, ChevronUp, Tag, Check
} from "lucide-react";
import { ClinicMap } from "@/components/organisms/ClinicMap/ClinicMap";
import { motion, AnimatePresence } from "framer-motion";
import { css, injectGlobal } from "@emotion/css";

// Assets
import SearchHero from "@/assets/Search_Hero.png";
import BotoxElite from "@/assets/Treatments/botox_elite.png";

// Clean UI: Hide scrollbars
injectGlobal`
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

const searchHeader = (isExpanded: boolean) => css`
  background: #121212;
  position: relative;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  padding: ${isExpanded ? '60px 0 80px' : '20px 0'};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-image: url(${SearchHero});
    background-size: cover;
    background-position: center 30%;
    opacity: 0.15;
  }
`;

const filterPill = (active: boolean) => css`
  padding: 10px 22px;
  border-radius: 40px;
  font-size: 11px;
  font-weight: 700;
  transition: all 0.2s ease;
  background: ${active ? '#F8FAFC' : 'white'};
  color: ${active ? '#000' : '#64748B'};
  border: 1.5px solid ${active ? '#E2E8F0' : '#F1F5F9'};
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    border-color: #CBFF38;
    background: #F8FAFC;
  }
`;

const featuredHeroStyle = css`
  background: white;
  border-radius: 40px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  @media (min-width: 1024px) {
    flex-direction: row;
  }
  box-shadow: 0 40px 100px rgba(0,0,0,0.08);
  margin-bottom: 50px;
  border: 1px solid #F1F5F9;
  height: auto;
  min-height: 480px;
`;

export const Search: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clinics, treatments, isLoading, total } = useSelector(
    (state: RootState) => state.client
  );
  const totalClinics = useSelector((state: RootState) => state.client.totalClinics);
  const totalTreatments = useSelector((state: RootState) => state.client.totalTreatments);

  const [showDesktopMap, setShowDesktopMap] = useState<boolean>(true);
  const [showMobileMap, setShowMobileMap] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedClinicForMap, setSelectedClinicForMap] = useState<any | null>(null);

  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll listener for minimizing header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filterPill = (isActive: boolean) => `
    px-5 py-2.5 rounded-full border text-[11px] font-bold uppercase italic tracking-wider flex items-center gap-2 transition-all duration-300
    ${isActive ? 'bg-[#121212] text-[#CBFF38] border-black shadow-lg scale-105' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:bg-gray-50'}
  `;

  const [activeTab, setActiveTab] = useState<'treatments' | 'clinics'>('clinics');

  // Search states
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [category, setCategory] = useState<string | undefined>(searchParams.get("category") || undefined);
  const [searchDate, setSearchDate] = useState<string | null>(searchParams.get("search_date") || null);
  const [searchTimeWindow, setSearchTimeWindow] = useState<string | null>(searchParams.get("search_time_window") || null);

  // Filter states
  const [sortBy, setSortBy] = useState<'recommended' | 'distance' | 'price-asc' | 'price-desc' | 'rating'>('recommended');
  const [ratingFilter, setRatingFilter] = useState<'any' | '4.5-plus' | '4.0-plus'>('any');
  const [brandsFilter, setBrandsFilter] = useState<string | null>(null);
  const [salonsFilter, setSalonsFilter] = useState<string | null>(null);
  const [instantOffer, setInstantOffer] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'sort' | 'rating' | 'brands' | 'salons' | null>(null);

  // Geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        }
      );
    }
  }, []);

  useEffect(() => {
    dispatch(
      searchClinics({
        search: query,
        location: location || undefined,
        category,
        search_date: searchDate,
        search_time_window: searchTimeWindow,
        lat: userCoords?.lat,
        lng: userCoords?.lng,
        sortBy,
        rating: ratingFilter !== 'any' ? ratingFilter : undefined,
        brand: brandsFilter || undefined,
        salon_type: salonsFilter || undefined,
        instant_offer: instantOffer || undefined,
      } as any)
    );
  }, [dispatch, query, location, category, searchDate, searchTimeWindow, userCoords, sortBy, ratingFilter, brandsFilter, salonsFilter, instantOffer]);

  const handleSearch = (filters: any) => {
    if (filters.query !== undefined) setQuery(filters.query);
    if (filters.location !== undefined) setLocation(filters.location);
    if (filters.category !== undefined) setCategory(filters.category);
    
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.set(key === 'query' ? 'q' : key, filters[key]);
    });
    setSearchParams(params);
  };

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserCoords(coords);
          // Auto-trigger search with coordinates
          dispatch(searchClinics({
            search: query,
            lat: coords.lat,
            lng: coords.lng,
            sortBy: 'distance'
          } as any));
          setSortBy('distance'); // Switch sort to distance
        },
        (error) => {
          console.error("Location access denied:", error);
          alert("Please enable location access to see clinics near you.");
        }
      );
    }
  };

  const mapCenter = useMemo(() => {
    if (selectedClinicForMap?.latitude) return [Number(selectedClinicForMap.latitude), Number(selectedClinicForMap.longitude)] as [number, number];
    if (userCoords) return [userCoords.lat, userCoords.lng] as [number, number];
    return [37.9838, 23.7275] as [number, number];
  }, [userCoords, selectedClinicForMap]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] relative">
      {/* Premium Search Header - Minimizable */}
      {activeTab === 'clinics' && (
        <header className={`bg-[#121212] transition-all duration-700 relative overflow-hidden ${isScrolled ? 'py-4 sm:py-10' : 'pt-12 pb-12 sm:pt-20 sm:pb-20'}`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${SearchHero})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <div className="container mx-auto px-4 sm:px-8 relative z-10 flex flex-col items-center justify-between gap-6 sm:gap-12">
              <div className={`w-full transition-all duration-700 ${isScrolled ? 'flex items-center justify-between gap-4' : 'text-center lg:text-left lg:w-1/2'}`}>
                 <h1 className={`text-white font-black italic tracking-tighter transition-all duration-700 mb-0 whitespace-nowrap ${isScrolled ? 'text-lg sm:text-2xl' : 'text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-8'}`}>
                    SEARCH <span className="text-[#CBFF38]">TREATMENTS</span>
                 </h1>
                 {!isScrolled && <div className="h-1 w-20 bg-[#CBFF38] mx-auto lg:mx-0 mb-8 rounded-full hidden sm:block"></div>}
                 <div className={`w-full transition-all ${isScrolled ? 'max-w-[150px] sm:max-w-md' : 'max-w-2xl mx-auto lg:mx-0'}`}>
                    <SearchBar 
                        initialFilters={{ query, location, category, search_date: searchDate }}
                        onSearch={handleSearch}
                        className={`transition-all duration-700 !max-w-none shadow-2xl ${isScrolled ? 'scale-90 origin-right' : ''}`}
                    />
                 </div>
              </div>
          </div>
        </header>
      )}

      {/* Modern Filter Pill Bar */}
      <section className="bg-white py-3 sm:py-6 border-b border-gray-100 sticky top-[72px] sm:top-[88px] z-[60] overflow-visible">
        <div className="container mx-auto px-4 sm:px-8 relative">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Main Tabs */}
              <div className="flex items-center gap-4 sm:gap-6 sm:pr-8 sm:border-r border-gray-100 h-10 flex-shrink-0 bg-white z-10 overflow-x-auto no-scrollbar">
                 <button 
                   onClick={() => setActiveTab('clinics')}
                   className={`text-[10px] sm:text-[12px] font-black uppercase tracking-widest italic whitespace-nowrap transition-all ${activeTab === 'clinics' ? 'text-black border-b-2 sm:border-b-4 border-[#CBFF38] pb-1' : 'text-gray-400'}`}
                 >
                   Clinics ({totalClinics})
                 </button>
                 <button 
                   onClick={() => setActiveTab('treatments')}
                   className={`text-[10px] sm:text-[12px] font-black uppercase tracking-widest italic whitespace-nowrap transition-all ${activeTab === 'treatments' ? 'text-black border-b-2 sm:border-b-4 border-[#CBFF38] pb-1' : 'text-gray-400'}`}
                 >
                   Treatments ({totalTreatments})
                 </button>
              </div>

              {/* Scrollable container for pills */}
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-1 flex-1 -mx-4 sm:mx-0 px-4 sm:px-0">
                 {/* Sort Ref Button */}
                 <div className="flex-shrink-0">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                      className={filterPill(sortBy !== 'recommended')}
                    >
                      <List size={12} className="text-gray-400" /> Sort
                      <ChevronDown size={12} />
                    </button>
                 </div>

                 {/* Brands Ref Button */}
                 <div className="flex-shrink-0">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === 'brands' ? null : 'brands')}
                      className={filterPill(!!brandsFilter)}
                    >
                      <Tag size={12} className="text-gray-400" /> {brandsFilter || 'Brands'}
                      <ChevronDown size={12} />
                    </button>
                 </div>
                 
                 <button 
                   onClick={requestLocation}
                   className={`flex-shrink-0 ${filterPill(!!userCoords)}`}
                 >
                   <MapPin size={12} className="text-gray-400" /> Nearby
                 </button>

                 <button 
                   onClick={() => setInstantOffer(!instantOffer)}
                   className={`flex-shrink-0 ${filterPill(instantOffer)}`}
                 >
                   <Sparkles size={12} className="text-gray-400" /> Offers
                 </button>
              </div>
           </div>

           {/* Dropdowns Rendered OUTSIDE the overflowing div */}
           <AnimatePresence>
             {openDropdown && (
               <>
                 <motion.div 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   exit={{ opacity: 0 }}
                   onClick={() => setOpenDropdown(null)} 
                   className="fixed inset-0 z-10 bg-black/5" 
                 />
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 10 }}
                   className="absolute top-full left-8 mt-2 w-64 bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-gray-100 p-3 z-20"
                 >
                   {openDropdown === 'sort' && [
                      { id: 'recommended', label: 'Recommended' },
                      { id: 'distance', label: 'Distance' },
                      { id: 'price-asc', label: 'Price: Low to High' },
                      { id: 'price-desc', label: 'Price: High to Low' },
                      { id: 'rating', label: 'Top Rated' }
                   ].map(opt => (
                      <button 
                        key={opt.id}
                        onClick={() => { setSortBy(opt.id as any); setOpenDropdown(null); }}
                        className={`w-full text-left px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-gray-50 flex items-center justify-between transition-colors ${sortBy === opt.id ? 'text-[#CBFF38] bg-[#121212]' : 'text-gray-600'}`}
                      >
                        {opt.label}
                        {sortBy === opt.id && <Check size={14} />}
                      </button>
                   ))}

                   {openDropdown === 'brands' && ['Any', 'L\'Oreal', 'Dermalogica', 'SkinCeuticals', 'La Mer'].map(brand => (
                      <button 
                        key={brand}
                        onClick={() => { setBrandsFilter(brand === 'Any' ? null : brand); setOpenDropdown(null); }}
                        className={`w-full text-left px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-gray-50 flex items-center justify-between transition-colors ${brandsFilter === brand || (brand === 'Any' && !brandsFilter) ? 'text-[#CBFF38] bg-[#121212]' : 'text-gray-600'}`}
                      >
                        {brand}
                        {((brand === 'Any' && !brandsFilter) || brandsFilter === brand) && <Check size={14} />}
                      </button>
                   ))}

                   {openDropdown === 'salons' && ['Any', 'Medical Clinic', 'Beauty Salon', 'Spa', 'Dermatology'].map(type => (
                      <button 
                        key={type}
                        onClick={() => { setSalonsFilter(type === 'Any' ? null : type); setOpenDropdown(null); }}
                        className={`w-full text-left px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-gray-50 flex items-center justify-between transition-colors ${salonsFilter === type || (type === 'Any' && !salonsFilter) ? 'text-[#CBFF38] bg-[#121212]' : 'text-gray-600'}`}
                      >
                        {type}
                        {((type === 'Any' && !salonsFilter) || salonsFilter === type) && <Check size={14} />}
                      </button>
                   ))}

                   {openDropdown === 'rating' && [
                      { id: 'any', label: 'Any Rating' },
                      { id: '4.5-plus', label: '4.5+ Stars' },
                      { id: '4.0-plus', label: '4.0+ Stars' }
                   ].map(opt => (
                      <button 
                        key={opt.id}
                        onClick={() => { setRatingFilter(opt.id as any); setOpenDropdown(null); }}
                        className={`w-full text-left px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-gray-50 flex items-center justify-between transition-colors ${ratingFilter === opt.id || (opt.id === 'any' && ratingFilter === 'any') ? 'text-[#CBFF38] bg-[#121212]' : 'text-gray-600'}`}
                      >
                        {opt.label}
                        { (ratingFilter === opt.id || (opt.id === 'any' && ratingFilter === 'any')) && <Check size={14} />}
                      </button>
                   ))}
                 </motion.div>
               </>
             )}
           </AnimatePresence>
        </div>
      </section>

      <main className={`transition-all duration-700 min-h-screen ${activeTab === 'treatments' ? 'bg-[#121212] bg-[url("https://www.transparenttextures.com/patterns/dark-matter.png")]' : 'bg-[#FDFDFD]'}`}>
        <div className="container mx-auto px-8 py-6">
            {activeTab === 'treatments' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mb-10 pt-6"
              >
                 <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white leading-tight mb-4">
                    Find the <span className="text-[#CBFF38]">therapy</span> <br/>
                    that fits you
                 </h1>
                 <p className="text-lg font-medium text-gray-400 max-w-2xl leading-relaxed">
                    Discover invasive and non-invasive treatments by specialty, need, and outcome. 
                    Experience premium aesthetic excellence.
                 </p>
              </motion.div>
            )}

            <div className={`max-w-7xl mx-auto transition-all ${activeTab === 'treatments' ? 'bg-black/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5' : ''}`}>
                {/* Results Header for Clinics */}
                {activeTab === 'clinics' && (
                  <div className="mb-8">
                     <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase">
                        {total} <span className="text-gray-400 font-bold">Results for</span> {query || 'Aesthetic Venues'}
                     </h3>
                     <p className="text-xs font-bold text-[#CBFF38] uppercase tracking-[0.3em] mt-2 bg-black inline-block px-4 py-2 rounded-lg italic">
                        Premium Selection in {location || 'International'}
                     </p>
                  </div>
                )}

                {/* Main Results Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                  {isLoading ? (
                      Array(6).fill(0).map((_, i) => <div key={i} className="h-[400px] bg-gray-50 rounded-[40px] animate-pulse border border-gray-100" />)
                  ) : (
                    activeTab === 'clinics' ? (
                      clinics.length > 0 ? (
                        clinics.map((clinic, idx) => (
                          <ClinicCard 
                            key={clinic.id} 
                            clinic={clinic} 
                            index={idx}
                            onSelect={(c) => navigate(`/clinic/${c.id}`)}
                          />
                        ))
                      ) : (
                        <div className="col-span-full py-12 text-center">
                          <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <SearchIcon className="text-gray-300" size={24} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">No results found</h3>
                          <p className="text-gray-500">Try adjusting your search filters or location.</p>
                        </div>
                      )
                    ) : (
                      <div className="col-span-full">
                        {/* Group treatments by category for the premium Greek look */}
                        {Object.entries(
                          treatments.reduce((acc: any, t: any) => {
                            const cat = t.category || 'General Aesthetics';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(t);
                            return acc;
                          }, {})
                        ).map(([category, items]: any) => (
                          <div key={category} className="mb-10">
                            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-3">
                               <div className="size-10 bg-[#CBFF38]/10 rounded-xl flex items-center justify-center text-[#CBFF38] border border-[#CBFF38]/20">
                                  <Sparkles size={16} />
                               </div>
                               <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{category}</h2>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                               {items.map((t: any) => (
                                 <TreatmentCard 
                                    key={t.id} 
                                    treatment={t} 
                                    onSelect={(treatment) => navigate(`/treatment/${treatment.id}`)} 
                                 />
                               ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
            </div>
        </div>
      </main>

      {/* Floating Map Toggle for Mobile */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 lg:hidden z-[100]">
         <button onClick={() => setShowMobileMap(true)} className="bg-black text-[#CBFF38] h-14 px-8 rounded-full shadow-2xl font-black uppercase italic tracking-widest text-[10px] flex items-center gap-3">
            <MapIcon size={18} /> View radar map
         </button>
      </div>

      <AnimatePresence>
         {showMobileMap && (
           <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 bg-white z-[1001] flex flex-col">
              <div className="p-6 bg-[#121212] text-white flex justify-between items-center">
                 <span className="font-black italic uppercase">Radar View</span>
                 <button onClick={() => setShowMobileMap(false)} className="bg-white/10 p-2 rounded-xl text-[#CBFF38]"><X size={24} /></button>
              </div>
              <div className="flex-1">
                 <ClinicMap clinics={clinics} center={mapCenter} zoom={13} />
              </div>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

