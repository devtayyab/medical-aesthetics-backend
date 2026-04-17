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
  Maximize2, Settings2, Sparkles, ChevronUp, Tag
} from "lucide-react";
import { ClinicMap } from "@/components/organisms/ClinicMap/ClinicMap";
import { motion, AnimatePresence } from "framer-motion";
import { css } from "@emotion/css";

// Assets
import SearchHero from "@/assets/Search_Hero.png";
import BotoxElite from "@/assets/Treatments/botox_elite.png";

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
  padding: 8px 18px;
  border-radius: 100px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.2s ease;
  background: ${active ? '#CBFF38' : 'white'};
  color: ${active ? '#000' : '#475569'};
  border: 1px solid ${active ? '#CBFF38' : '#F1F5F9'};
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  position: relative;

  &:hover {
    border-color: #CBFF38;
    transform: translateY(-2px);
  }
`;

const dropdownContent = css`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 10px;
  background: white;
  min-width: 220px;
  border-radius: 24px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.12);
  border: 1px solid #F1F5F9;
  z-index: 999;
  padding: 10px;
  backdrop-filter: blur(20px);
`;

const dropdownItem = (active: boolean) => css`
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 12px;
  transition: all 0.2s ease;
  color: ${active ? '#000' : '#64748B'};
  background: ${active ? '#F8FAFC' : 'transparent'};

  &:hover {
    background: #F8FAFC;
    color: #000;
  }
`;

const featuredResultCard = css`
  background: #111827;
  border-radius: 32px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  @media (min-width: 1024px) {
    flex-direction: row;
  }
  box-shadow: 0 50px 100px rgba(0,0,0,0.1);
  margin-bottom: 40px;
  border: 1px solid rgba(255,255,255,0.05);
`;

export const Search: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clinics, treatments, isLoading, total } = useSelector(
    (state: RootState) => state.client
  );

  const [showDesktopMap, setShowDesktopMap] = useState<boolean>(true);
  const [showMobileMap, setShowMobileMap] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedClinicForMap, setSelectedClinicForMap] = useState<any | null>(null);

  const [activeTab, setActiveTab] = useState<'treatments' | 'clinics'>('clinics');
  const [isHeaderExpanded, setIsHeaderExpanded] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<'sort' | 'price' | 'rating' | 'brands' | null>(null);

  // Search states
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [category, setCategory] = useState<string | undefined>(searchParams.get("category") || undefined);
  const [searchDate, setSearchDate] = useState<string | null>(searchParams.get("search_date") || null);
  const [searchTimeWindow, setSearchTimeWindow] = useState<string | null>(searchParams.get("search_time_window") || null);

  // Filter states
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'distance'>('recommended');
  const [priceFilter, setPriceFilter] = useState<'any' | 'under-50' | '50-100' | 'over-100'>('any');
  const [ratingFilter, setRatingFilter] = useState<'any' | '4.5-plus' | '4.0-plus'>('any');

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
      } as any)
    );
  }, [dispatch, query, location, category, searchDate, searchTimeWindow, userCoords, sortBy]);

  const handleSearch = (filters: any) => {
    if (filters.query !== undefined) setQuery(filters.query);
    if (filters.location !== undefined) setLocation(filters.location);
    if (filters.category !== undefined) setCategory(filters.category);
    
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.set(key === 'query' ? 'q' : key, filters[key]);
    });
    setSearchParams(params);
    setIsHeaderExpanded(false); // Auto-collapse on search
  };

  const mapCenter = useMemo(() => {
    if (selectedClinicForMap?.latitude) return [Number(selectedClinicForMap.latitude), Number(selectedClinicForMap.longitude)] as [number, number];
    if (userCoords) return [userCoords.lat, userCoords.lng] as [number, number];
    return [37.9838, 23.7275] as [number, number];
  }, [userCoords, selectedClinicForMap]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] relative">
      {/* Dark Elite Search Header */}
      <header className={`${searchHeader(isHeaderExpanded)} relative z-20`}>
        <div className="container mx-auto px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 justify-between">
            <div className="w-full lg:max-w-3xl">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-white text-2xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">
                   REFINING <span className="text-[#CBFF38]">YOUR SEARCH</span>
                </h1>
                <button 
                  onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                  className="lg:hidden text-[#CBFF38]"
                >
                  {isHeaderExpanded ? <ChevronUp /> : <SearchIcon />}
                </button>
              </div>
              
              <AnimatePresence>
                {isHeaderExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[40px] border border-white/10 shadow-2xl">
                      <SearchBar 
                        initialFilters={{ query, location, category, search_date: searchDate }}
                        onSearch={handleSearch}
                        className="!bg-transparent !p-0 !shadow-none !border-none text-white search-bar-elite"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="hidden lg:flex flex-col items-end gap-4">
                 <div className="flex items-center gap-3 text-white/40 text-[10px] font-black uppercase tracking-[0.2em] italic">
                    <Sparkles size={12} className="text-[#CBFF38]" />
                    Real-time Availability
                 </div>
                 <div className="flex gap-3">
                   <button 
                    onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                    className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest italic hover:bg-white/20 transition-all border border-white/10"
                   >
                      {isHeaderExpanded ? <ChevronUp size={14} /> : <SearchIcon size={14} />}
                      {isHeaderExpanded ? "Hide Filters" : "Reveal Search"}
                   </button>
                   <button 
                    onClick={() => setShowDesktopMap(!showDesktopMap)}
                    className="flex items-center gap-2 bg-[#CBFF38] text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest italic hover:bg-white transition-all shadow-xl"
                   >
                      {showDesktopMap ? <X size={14} /> : <MapIcon size={14} />}
                      {showDesktopMap ? "Hide Map Panel" : "Show Map Panel"}
                   </button>
                 </div>
            </div>
          </div>
        </div>
      </header>

      {/* Meta Filters Bar - Fixed Cascade Layering */}
      <section className="bg-white border-b border-gray-100 py-4 shadow-sm relative z-40">
        <div className="container mx-auto px-8">
           <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                 {/* Sort Filter */}
                 <div className="relative">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                      className={filterPill(sortBy !== 'recommended')}
                    >
                      <Settings2 size={12} /> Sort: {sortBy === 'recommended' ? 'Recommended' : sortBy === 'price-asc' ? 'Low Price' : sortBy === 'price-desc' ? 'High Price' : sortBy} <ChevronDown size={10} />
                    </button>
                    <AnimatePresence>
                      {openDropdown === 'sort' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={dropdownContent}>
                          {(['recommended', 'price-asc', 'price-desc', 'rating', 'distance'] as const).map(opt => (
                            <button key={opt} className={dropdownItem(sortBy === opt)} onClick={() => { setSortBy(opt); setOpenDropdown(null); }}>
                              {opt === 'recommended' ? 'Recommended' : opt === 'price-asc' ? 'Lowest Price' : opt === 'price-desc' ? 'Highest Price' : opt === 'rating' ? 'Top Rated' : 'Distance'}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>

                 {/* Brands Filter */}
                 <button className={filterPill(false)}>
                    <Tag size={12} /> Brands
                 </button>

                 {/* Instant Offer Filter */}
                 <button className={filterPill(false)}>
                    <Sparkles size={12} /> Instant Offer
                 </button>

                 {/* Price Filter */}
                 <div className="relative">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
                      className={filterPill(priceFilter !== 'any')}
                    >
                      Price Range {priceFilter !== 'any' && `(${priceFilter})`} <ChevronDown size={10} />
                    </button>
                    <AnimatePresence>
                      {openDropdown === 'price' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={dropdownContent}>
                          {['any', 'under-50', '50-100', 'over-100'].map(p => (
                            <button key={p} className={dropdownItem(priceFilter === p)} onClick={() => { setPriceFilter(p as any); setOpenDropdown(null); }}>
                              {p === 'any' ? 'Any Price' : p === 'under-50' ? 'Under €50' : p === '50-100' ? '€50 - €100' : 'Over €100'}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>

                 {/* Rating Filter */}
                 <div className="relative">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === 'rating' ? null : 'rating')}
                      className={filterPill(ratingFilter !== 'any')}
                    >
                      Rating {ratingFilter !== 'any' && `(4.5+)`} <ChevronDown size={10} />
                    </button>
                    <AnimatePresence>
                      {openDropdown === 'rating' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={dropdownContent}>
                          {['any', '4.5-plus', '4.0-plus'].map(r => (
                            <button key={r} className={dropdownItem(ratingFilter === r)} onClick={() => { setRatingFilter(r as any); setOpenDropdown(null); }}>
                               {r === 'any' ? 'Any Rating' : r === '4.5-plus' ? '4.5 Stars & Up' : '4.0 Stars & Up'}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 border-l border-gray-100 pl-6 h-8 shrink-0">
                  <button 
                    onClick={() => setActiveTab('clinics')}
                    className={`text-[10px] font-black uppercase tracking-[0.1em] italic transition-all ${activeTab === 'clinics' ? 'text-black border-b-2 border-[#CBFF38]' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Clinical Results
                  </button>
                  <button 
                    onClick={() => setActiveTab('treatments')}
                    className={`text-[10px] font-black uppercase tracking-[0.1em] italic transition-all ${activeTab === 'treatments' ? 'text-black border-b-2 border-[#CBFF38]' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Treatments
                  </button>
              </div>
           </div>
        </div>
      </section>

      <div className="flex w-full relative">
        <main className={`transition-all duration-500 flex-1 p-8 relative ${showDesktopMap ? 'lg:w-[60%] xl:w-[65%]' : 'w-full'}`}>
          <div className="max-w-6xl mx-auto">
            {/* Featured Hero Result */}
            {(query?.toLowerCase().includes('botox') || category?.toLowerCase() === 'injectables') && clinics.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className={featuredResultCard}
              >
                <div className="lg:w-[45%] h-[300px] lg:h-auto overflow-hidden relative">
                   <img src={BotoxElite} className="w-full h-full object-cover transition-all duration-700" alt="Botox" />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-60"></div>
                </div>
                <div className="lg:w-[55%] p-10 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-4">
                      <div className="flex text-[#CBFF38]">
                         {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                      </div>
                      <span className="text-white/40 text-[10px] font-black uppercase tracking-widest italic">384 Patient Reviews</span>
                   </div>
                   <h2 className="text-white text-4xl font-black uppercase italic tracking-tighter mb-4">
                      Botox <span className="text-[#CBFF38]">Therapy</span>
                   </h2>
                   <p className="text-white/70 text-sm font-bold leading-relaxed mb-8 italic">
                      Achieve smooth, youthful skin with precision injections. Botox is ideal for reducing expression lines with results lasting up to 6 months. Restore your natural radiance today.
                   </p>
                   
                   <ul className="space-y-3 mb-10">
                      <li className="flex items-center gap-3 text-white/50 text-[10px] font-black uppercase tracking-widest italic">
                         <div className="size-2 bg-[#CBFF38] rounded-full"></div> Eliminates facial wrinkles
                      </li>
                      <li className="flex items-center gap-3 text-white/50 text-[10px] font-black uppercase tracking-widest italic">
                         <div className="size-2 bg-[#CBFF38] rounded-full"></div> Reduction of forehead lines 
                      </li>
                      <li className="flex items-center gap-3 text-white/50 text-[10px] font-black uppercase tracking-widest italic">
                         <div className="size-2 bg-[#CBFF38] rounded-full"></div> Duration of action 4-6 months
                      </li>
                   </ul>
                   
                   <button className="h-16 bg-[#CBFF38] text-black px-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] italic hover:bg-white transition-all shadow-xl self-start">
                      Discover Top Centers <ArrowRight size={14} className="inline-block ml-2" />
                   </button>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-[20px] font-black uppercase italic tracking-tight text-gray-900 leading-none">
                    {total} <span className="text-gray-400">Results for</span> {query || category || 'Aesthetic Venues'}
                  </h3>
                  {location && <p className="text-[10px] font-bold text-lime-600 uppercase tracking-[0.2em] mt-2 italic">Operating in {location}, International</p>}
               </div>
            </div>

            {isLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[1, 2, 4].map(i => <div key={i} className="h-[350px] bg-gray-50 animate-pulse rounded-[32px] border border-gray-100"></div>)}
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence>
                  {activeTab === 'clinics' ? (
                     clinics.map((c, idx) => (
                      <motion.div 
                        key={c.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                         <ClinicCard
                          clinic={c}
                          index={idx}
                          searchQuery={query}
                          searchDate={searchDate || undefined}
                          onSelect={() => navigate(`/clinic/${c.id}`)}
                          onShowMap={(clinic) => {
                            setSelectedClinicForMap(clinic);
                            setShowDesktopMap(true);
                          }}
                        />
                      </motion.div>
                    ))
                  ) : (
                    treatments.map((t: any, idx) => (
                      <motion.div 
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <TreatmentCard 
                          treatment={t}
                          onSelect={() => navigate(`/treatment/${t.id}`)}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>

        {/* Dynamic Map Panel */}
        {showDesktopMap && (
          <aside className="hidden lg:block lg:w-[40%] xl:w-[35%] h-[calc(100vh-60px)] sticky top-[60px] bg-gray-100 border-l border-gray-100 animate-in slide-in-from-right duration-500 overflow-hidden">
             <div className="relative h-full w-full">
                <div className="absolute top-6 left-6 z-[1000] flex gap-2">
                   <button 
                     onClick={() => setShowDesktopMap(false)}
                     className="bg-white/90 backdrop-blur-md size-10 rounded-2xl shadow-2xl flex items-center justify-center text-gray-900 border border-white/20 hover:scale-110 transition-transform"
                   >
                     <X size={18} />
                   </button>
                </div>
                
                <div className="absolute top-6 right-6 z-[1000]">
                   <div className="bg-black/95 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/10 flex items-center gap-4">
                      <div className="size-10 bg-[#CBFF38] rounded-xl flex items-center justify-center text-black">
                         <SearchIcon size={18} />
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Interactive</p>
                         <p className="text-[10px] font-black uppercase italic tracking-widest">Map Radar</p>
                      </div>
                   </div>
                </div>

                <ClinicMap 
                  clinics={selectedClinicForMap ? [selectedClinicForMap] : clinics}
                  center={mapCenter}
                  zoom={selectedClinicForMap ? 15 : 13}
                />
             </div>
          </aside>
        )}
      </div>

      {/* Mobile Map Toggle */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 lg:hidden">
         <button 
          onClick={() => setShowMobileMap(true)}
          className="bg-black text-[#CBFF38] h-14 px-10 rounded-full shadow-2xl flex items-center gap-4 font-black text-[11px] uppercase tracking-widest italic"
         >
           <MapIcon size={18} /> View Radar Map
         </button>
      </div>

      {showMobileMap && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col">
           <div className="p-6 border-b flex justify-between items-center bg-[#121212] text-white">
              <h3 className="font-black text-sm uppercase italic tracking-widest">Search Radar</h3>
              <button 
                onClick={() => setShowMobileMap(false)} 
                className="bg-white/10 size-10 rounded-xl flex items-center justify-center text-[#CBFF38]"
              >
                <X size={20} />
              </button>
           </div>
           <div className="flex-1 relative">
              <ClinicMap clinics={clinics} center={mapCenter} zoom={13} />
           </div>
        </div>
      )}
    </div>
  );
};
