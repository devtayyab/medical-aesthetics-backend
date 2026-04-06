import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchClinics } from "@/store/slices/clientSlice";
import { RootState, AppDispatch } from "@/store";
import { SearchBar } from "@/components/organisms/SearchBar";
import { ClinicCard } from "@/components/molecules/ClinicCard/ClinicCard";
import { TreatmentCard } from "@/components/molecules/TreatmentCard/TreatmentCard";
import { Button } from "@/components/atoms/Button/Button";
import { FaHospital, FaMap, FaList, FaStar, FaChevronDown, FaMapMarkedAlt } from "react-icons/fa";
import { MapPin, X } from "lucide-react";
import { ClinicMap } from "@/components/organisms/ClinicMap/ClinicMap";

export const Search: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clinics, treatments, isLoading, total } = useSelector(
    (state: RootState) => state.client
  );

  const [showDesktopMap, setShowDesktopMap] = useState<boolean>(false);
  const [showMobileMap, setShowMobileMap] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedClinicForMap, setSelectedClinicForMap] = useState<any | null>(null);

  const [activeTab, setActiveTab] = useState<'treatments' | 'clinics'>('treatments');

  // Search states
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [category, setCategory] = useState<string | undefined>(searchParams.get("category") || undefined);
  const [searchDate, setSearchDate] = useState<string | null>(searchParams.get("search_date") || null);
  const [searchTimeWindow, setSearchTimeWindow] = useState<string | null>(searchParams.get("search_time_window") || null);

  // Filter and Sort states
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'distance'>('recommended');
  const [priceFilter, setPriceFilter] = useState<'any' | 'under-50' | '50-100' | 'over-100'>('any');
  const [ratingFilter, setRatingFilter] = useState<'any' | '4.5-plus' | '4.0-plus'>('any');

  const [openDropdown, setOpenDropdown] = useState<'sort' | 'price' | 'rating' | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);

  // Detect location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserCoords(coords);
          setSortBy('distance');
        },
        (error) => {
          console.warn("Geolocation denied or failed:", error);
        }
      );
    }
  }, []);

  // Computed lists: Flatten treatments to show individual services (Clinic - Treatment - Price)
  const filteredTreatments = useMemo(() => {
    const masterServices = treatments.flatMap((t: any) => {
      const offerings = t.offerings || [];
      return offerings
        .filter((o: any) => o.isActive && o.clinic?.isActive)
        .map((o: any) => ({
          ...t,
          id: `${t.id}|${o.id}`,
          treatmentId: t.id,
          offeringId: o.id,
          clinic: o.clinic,
          fromPrice: Number(o.price),
          availableAt: [o.clinic.name],
          clinicsCount: 1,
          duration: o.durationMinutes
        }));
    });

    const venueServices = clinics.flatMap((c: any) => {
      const servicesFromVenue = c.services || c.offerings || [];
      return servicesFromVenue
        .filter((s: any) => s.isActive)
        .map((s: any) => ({
          ...(s.treatment || {}),
          name: s.treatment?.name || s.name || 'Treatment',
          category: s.treatment?.category || 'Service',
          id: `${s.treatmentId || s.id}|${s.id}`,
          treatmentId: s.treatmentId || s.id,
          offeringId: s.id,
          clinic: c,
          fromPrice: Number(s.price),
          availableAt: [c.name],
          clinicsCount: 1,
          duration: s.durationMinutes
        }));
    });

    const groupedByTreatment = new Map();
    [...masterServices, ...venueServices].forEach(item => {
      const tid = item.treatmentId;
      if (!groupedByTreatment.has(tid)) {
        groupedByTreatment.set(tid, {
          ...item,
          id: tid,
          fromPrice: Number(item.fromPrice),
          availableAt: item.availableAt || [],
          clinicsCount: 1,
          offerings: [item]
        });
      } else {
        const existing = groupedByTreatment.get(tid);
        existing.fromPrice = Math.min(existing.fromPrice, Number(item.fromPrice));
        if (item.availableAt?.[0] && !existing.availableAt.includes(item.availableAt[0])) {
           existing.availableAt.push(item.availableAt[0]);
           existing.clinicsCount++;
        }
        existing.offerings.push(item);
      }
    });

    let result = Array.from(groupedByTreatment.values());

    if (result.length === 0) {
      result = treatments.map(t => ({
        ...t,
        id: t.id,
        fromPrice: 0,
        availableAt: [],
        clinicsCount: 0,
        offerings: []
      }));
    }

    if (priceFilter !== 'any') {
      result = result.filter(s => {
        const price = s.fromPrice || 0;
        if (priceFilter === 'under-50') return price < 50;
        if (priceFilter === '50-100') return price >= 50 && price <= 100;
        if (priceFilter === 'over-100') return price > 100;
        return true;
      });
    }

    if (sortBy === 'price-asc') result.sort((a, b) => (a.fromPrice || 0) - (b.fromPrice || 0));
    if (sortBy === 'price-desc') result.sort((a, b) => (b.fromPrice || 0) - (a.fromPrice || 0));
    
    return result;
  }, [treatments, clinics, sortBy, priceFilter]);

  const filteredClinics = useMemo(() => {
    let result = [...clinics];
    if (ratingFilter !== 'any') {
      result = result.filter(c => {
        const r = c.rating || 4.9;
        if (ratingFilter === '4.5-plus') return r >= 4.5;
        if (ratingFilter === '4.0-plus') return r >= 4.0;
        return true;
      });
    }
    if (sortBy === 'rating') result.sort((a, b) => (b.rating || 4.9) - (a.rating || 4.9));
    return result;
  }, [clinics, sortBy, ratingFilter]);

  const mapCenter = useMemo(() => {
    if (selectedClinicForMap) return [selectedClinicForMap.latitude, selectedClinicForMap.longitude] as [number, number];
    if (userCoords) return [userCoords.lat, userCoords.lng] as [number, number];
    const clinicWithCoords = clinics.find(c => c.latitude && c.longitude);
    if (clinicWithCoords) {
      return [clinicWithCoords.latitude!, clinicWithCoords.longitude!] as [number, number];
    }
    return [51.505, -0.09] as [number, number];
  }, [userCoords, clinics, selectedClinicForMap]);

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
    if (filters.search_date !== undefined) setSearchDate(filters.search_date);
    if (filters.search_time_window !== undefined) setSearchTimeWindow(filters.search_time_window);

    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.set(key === 'query' ? 'q' : key, filters[key]);
    });
    setSearchParams(params);
    setIsSearchExpanded(false);
  };

  const getDisplayDate = () => {
    if (searchDate) {
      return new Date(searchDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }
    return "Any date";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col lg:flex-row w-full min-h-screen relative">
        <div className={`flex flex-col min-w-0 transition-all duration-300 ${showDesktopMap ? 'lg:w-[55%] xl:w-[60%]' : 'w-full'}`}>
          <div className="bg-white border-b border-gray-200 sticky top-[64px] z-40 shadow-sm w-full transition-all duration-300">
            <div className="px-4 py-2.5 flex items-center justify-between gap-4">
              <div
                className={`flex-1 flex items-center gap-2 cursor-pointer transition-all ${!isSearchExpanded ? 'bg-gray-50/80 p-1.5 rounded-2xl hover:bg-gray-100 border border-gray-100' : ''}`}
                onClick={() => !isSearchExpanded && setIsSearchExpanded(true)}
              >
                {!isSearchExpanded ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-xl shadow-sm border border-gray-100">
                      <FaHospital className="text-lime-600 size-3" />
                      <span className="text-[10px] font-black uppercase tracking-tight text-gray-900 truncate max-w-[120px]">
                        {query || 'All treatments'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-xl shadow-sm border border-gray-100">
                      <MapPin size={10} className="text-gray-400" />
                      <span className="text-[10px] font-black uppercase tracking-tight text-gray-900 truncate max-w-[100px]">
                        {location || 'Any area'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-xl shadow-sm border border-gray-100">
                      <FaChevronDown size={8} className="text-gray-400" />
                      <span className="text-[10px] font-black uppercase tracking-tight text-gray-900 whitespace-nowrap">
                        {getDisplayDate()}
                      </span>
                    </div>
                  </>
                ) : (
                  <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none px-2">Modify Search</h2>
                )}
              </div>
              <button
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 tracking-widest px-2"
              >
                {isSearchExpanded ? 'Hide' : 'Change'}
              </button>
            </div>

            {isSearchExpanded && (
              <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                  <div className="w-full md:w-auto flex-1">
                    <SearchBar
                      initialFilters={{ query, location, category, search_date: searchDate, search_time_window: searchTimeWindow }}
                      onSearch={handleSearch}
                      className="!p-2 !shadow-none border border-gray-200"
                    />
                  </div>
                  <div className="hidden lg:flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="font-bold flex items-center gap-2 rounded-xl text-gray-700 hover:text-black border-gray-200"
                      onClick={() => setShowDesktopMap(!showDesktopMap)}
                    >
                      {showDesktopMap ? <><FaList /> Hide map</> : <><FaMapMarkedAlt /> Show map</>}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="max-w-full px-4 pt-4 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {['All', 'Hair Removal', 'Injectables', 'Skin Care', 'Body', 'Surgery', 'Dental'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  const val = cat === 'All' ? undefined : cat;
                  setCategory(val);
                  handleSearch({ category: val, query, location, search_date: searchDate, search_time_window: searchTimeWindow });
                }}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                  ((!category && cat === 'All') || category === cat)
                    ? 'border-black bg-black text-white shadow-md'
                    : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="max-w-full px-4 py-3 flex flex-wrap items-center gap-3 border-b border-gray-100 relative">
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${sortBy !== 'recommended' ? 'border-lime-400 bg-lime-50 text-lime-900' : 'border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}
              >
                Sort: {sortBy === 'recommended' ? 'Recommended' : sortBy === 'distance' ? 'Closest' : sortBy === 'price-asc' ? 'Price: Low' : sortBy === 'price-desc' ? 'Price: High' : 'Rating'} <FaChevronDown size={8} />
              </button>
              {openDropdown === 'sort' && (
                <div className="absolute top-10 left-0 bg-white border border-gray-100 rounded-2xl shadow-2xl w-48 py-3 z-50">
                  {(['recommended', 'distance', 'price-asc', 'price-desc', 'rating'] as const).map(option => (
                    <button key={option}
                      className={`block w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 ${(sortBy === option) ? 'text-lime-700' : 'text-gray-400'}`}
                      onClick={() => { setSortBy(option); setOpenDropdown(null); }}
                    >
                      {option === 'recommended' ? 'Recommended' : option === 'distance' ? 'Closest to you' : option === 'price-asc' ? 'Price: Low' : option === 'price-desc' ? 'Price: High' : 'Highest Rating'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${priceFilter !== 'any' ? 'border-lime-400 bg-lime-50 text-lime-900' : 'border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}
              >
                Price {priceFilter !== 'any' && `(${priceFilter})`} <FaChevronDown size={8} />
              </button>
              {openDropdown === 'price' && (
                <div className="absolute top-10 left-0 bg-white border border-gray-100 rounded-2xl shadow-2xl w-40 py-3 z-50">
                  {['any', 'under-50', '50-100', 'over-100'].map(p => (
                    <button key={p} className={`block w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 ${priceFilter === p ? 'text-lime-700' : 'text-gray-400'}`} onClick={() => { setPriceFilter(p as any); setOpenDropdown(null); }}>
                      {p === 'any' ? 'Any price' : p.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {searchDate && (
              <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-lime-500 bg-lime-50 text-[10px] font-black uppercase tracking-widest text-lime-800">
                Available on {getDisplayDate()}
              </button>
            )}
          </div>

          <div className="p-4 md:p-6 lg:p-8 flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-gray-900 leading-tight">
                {query || category ? `${query || category} in ${location || 'London'}` : 'Top Clinics & Treatments'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">{total} venues found</p>
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => <div key={i} className="h-[250px] bg-gray-50 animate-pulse rounded-2xl border border-gray-100"></div>)}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-0">
                  <div className="flex gap-8">
                    <button
                      onClick={() => setActiveTab('treatments')}
                      className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'treatments' ? 'text-gray-900' : 'text-gray-400'}`}
                    >
                      Treatments <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full ml-1">{filteredTreatments.length}</span>
                      {activeTab === 'treatments' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-lime-500 rounded-t-lg"></span>}
                    </button>
                    <button
                      onClick={() => setActiveTab('clinics')}
                      className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'clinics' ? 'text-gray-900 font-bold' : 'text-gray-400 font-medium hover:text-gray-600'}`}
                    >
                      Clinics <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full ml-1">{filteredClinics.length}</span>
                      {activeTab === 'clinics' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-lime-500 rounded-t-lg"></span>}
                    </button>
                  </div>
                  {activeTab === 'clinics' && sortBy === 'distance' && !userCoords && !location && (
                    <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl animate-in slide-in-from-right-4 duration-500">
                      <MapPin size={12} className="text-indigo-600 animate-bounce" />
                      <span className="text-[10px] font-black uppercase italic text-indigo-700 tracking-tight">Enter your area to sort by distance</span>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  {activeTab === 'treatments' ? (
                    <div className="space-y-6">
                      {filteredTreatments.map((t: any) => (
                        <TreatmentCard 
                          key={t.id} 
                          treatment={t} 
                          onSelect={() => {
                            navigate(`/treatment/${t.id}`);
                          }} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredClinics.map((c, idx) => (
                        <ClinicCard 
                          key={c.id} 
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {showDesktopMap && (
          <aside className="hidden lg:block lg:w-[45%] xl:w-[40%] bg-gray-100 h-[calc(100vh-112px)] sticky top-[112px] border-l border-gray-200 animate-in slide-in-from-right duration-300">
            <div className="relative h-full">
              <button 
                onClick={() => setShowDesktopMap(false)}
                className="absolute top-4 left-4 z-[1000] bg-white size-10 rounded-full shadow-xl flex items-center justify-center text-gray-400 hover:text-black hover:scale-110 transition-all border border-gray-100"
              >
                <X size={20} />
              </button>
              <ClinicMap clinics={clinics} center={mapCenter} zoom={13} />
            </div>
          </aside>
        )}

        <div className="fixed bottom-0 left-0 w-full p-4 z-50 lg:hidden pointer-events-none flex justify-center">
          <button onClick={() => setShowMobileMap(true)} className="pointer-events-auto bg-black text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold transform transition active:scale-95">
            <FaMap /> Map
          </button>
        </div>

        {showMobileMap && (
          <div className="fixed inset-0 bg-white z-[70] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-black text-lg">Map View</h3>
              <button onClick={() => setShowMobileMap(false)} className="bg-gray-100 px-4 py-2 rounded-full font-bold">Close</button>
            </div>
            <div className="flex-1 relative">
              <ClinicMap clinics={clinics} center={mapCenter} zoom={13} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
