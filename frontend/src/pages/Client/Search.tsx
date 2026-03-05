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
import { ClinicMap } from "@/components/organisms/ClinicMap/ClinicMap";

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

  const [activeTab, setActiveTab] = useState<'treatments' | 'clinics'>('treatments');

  // Filter and Sort states
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'distance'>('recommended');
  const [priceFilter, setPriceFilter] = useState<'any' | 'under-50' | '50-100' | 'over-100'>('any');
  const [ratingFilter, setRatingFilter] = useState<'any' | '4.5-plus' | '4.0-plus'>('any');

  const [openDropdown, setOpenDropdown] = useState<'sort' | 'price' | 'rating' | null>(null);

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

  // Computed lists
  const filteredTreatments = useMemo(() => {
    let result = [...treatments];

    // Filter
    if (priceFilter !== 'any') {
      result = result.filter(t => {
        const price = t.fromPrice || 0;
        if (priceFilter === 'under-50') return price < 50;
        if (priceFilter === '50-100') return price >= 50 && price <= 100;
        if (priceFilter === 'over-100') return price > 100;
        return true;
      });
    }

    // Sort
    if (sortBy === 'price-asc') result.sort((a, b) => (a.fromPrice || 0) - (b.fromPrice || 0));
    if (sortBy === 'price-desc') result.sort((a, b) => (b.fromPrice || 0) - (a.fromPrice || 0));
    return result;
  }, [treatments, sortBy, priceFilter]);

  const filteredClinics = useMemo(() => {
    let result = [...clinics];

    // Filter
    if (ratingFilter !== 'any') {
      result = result.filter(c => {
        const r = c.rating || 4.9;
        if (ratingFilter === '4.5-plus') return r >= 4.5;
        if (ratingFilter === '4.0-plus') return r >= 4.0;
        return true;
      });
    }

    // Sort
    if (sortBy === 'rating') result.sort((a, b) => (b.rating || 4.9) - (a.rating || 4.9));
    return result;
  }, [clinics, sortBy, ratingFilter]);

  const query = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const category = searchParams.get("category") || "";
  const searchDate = searchParams.get("search_date") || "";
  const searchTimeWindow = searchParams.get("search_time_window") || "";

  const mapCenter = useMemo(() => {
    if (userCoords) return [userCoords.lat, userCoords.lng] as [number, number];
    const clinicWithCoords = clinics.find(c => c.latitude && c.longitude);
    if (clinicWithCoords) {
      return [clinicWithCoords.latitude!, clinicWithCoords.longitude!] as [number, number];
    }
    return [51.505, -0.09] as [number, number]; // London
  }, [userCoords, clinics]);

  useEffect(() => {
    dispatch(
      searchClinics({
        query,
        location,
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
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.set(key === 'query' ? 'q' : key, filters[key]);
    });
    setSearchParams(params);
  };

  const getDisplayDate = () => {
    if (searchDate) {
      return new Date(searchDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }
    return "Any date";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Split Layout Container */}
      <div className="flex flex-col lg:flex-row w-full min-h-screen relative">

        {/* Left Col: Results + Search Summary */}
        <div className={`flex flex-col min-w-0 transition-all duration-300 ${showDesktopMap ? 'lg:w-[55%] xl:w-[60%]' : 'w-full'}`}>

          {/* Top Search Summary Header (Sticky below Global Header) */}
          <div className="bg-white border-b border-gray-200 sticky top-[112px] z-40 shadow-sm w-full">
            <div className="max-w-full px-4 py-3 flex flex-col md:flex-row items-center gap-4 justify-between">
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

            {/* Filter Chips Row */}
            <div className="max-w-full px-4 py-3 flex flex-wrap items-center gap-3 border-t border-gray-100 relative">
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold transition-colors whitespace-nowrap ${sortBy !== 'recommended' ? 'border-lime-500 bg-lime-50 text-lime-800' : 'border-gray-300 text-gray-700 hover:border-black'}`}
                >
                  Sort by: {sortBy === 'recommended' ? 'Recommended' : sortBy === 'distance' ? 'Closest' : sortBy === 'price-asc' ? 'Price: Low' : sortBy === 'price-desc' ? 'Price: High' : 'Rating'} <FaChevronDown size={10} />
                </button>
                {openDropdown === 'sort' && (
                  <div className="absolute top-10 left-0 bg-white border border-gray-200 rounded-xl shadow-xl w-48 py-2 z-50">
                    {(['recommended', 'distance', 'price-asc', 'price-desc', 'rating'] as const).map(option => (
                      <button key={option}
                        className={`block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 ${(sortBy === option || (option === 'distance' && !userCoords)) ? 'text-lime-700 font-bold' : 'text-gray-700'} ${option === 'distance' && !userCoords ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (option === 'distance' && !userCoords) return;
                          setSortBy(option);
                          setOpenDropdown(null);
                        }}
                      >
                        {option === 'recommended' ? 'Recommended' : option === 'distance' ? (userCoords ? 'Closest to you' : 'Enter location to sort by distance') : option === 'price-asc' ? 'Price: Low to High' : option === 'price-desc' ? 'Price: High to Low' : 'Highest Rating'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold transition-colors whitespace-nowrap ${priceFilter !== 'any' ? 'border-lime-500 bg-lime-50 text-lime-800' : 'border-gray-300 text-gray-700 hover:border-black'}`}
                >
                  Price range {priceFilter !== 'any' && `(${priceFilter.replace('-', ' ')})`} <FaChevronDown size={10} />
                </button>
                {openDropdown === 'price' && (
                  <div className="absolute top-10 left-0 bg-white border border-gray-200 rounded-xl shadow-xl w-40 py-2 z-50">
                    <button className={`block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 ${priceFilter === 'any' ? 'text-lime-700 font-bold' : 'text-gray-700'}`} onClick={() => { setPriceFilter('any'); setOpenDropdown(null); }}>Any price</button>
                    <button className={`block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 ${priceFilter === 'under-50' ? 'text-lime-700 font-bold' : 'text-gray-700'}`} onClick={() => { setPriceFilter('under-50'); setOpenDropdown(null); }}>Under £50</button>
                    <button className={`block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 ${priceFilter === '50-100' ? 'text-lime-700 font-bold' : 'text-gray-700'}`} onClick={() => { setPriceFilter('50-100'); setOpenDropdown(null); }}>£50 - £100</button>
                    <button className={`block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 ${priceFilter === 'over-100' ? 'text-lime-700 font-bold' : 'text-gray-700'}`} onClick={() => { setPriceFilter('over-100'); setOpenDropdown(null); }}>Over £100</button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'rating' ? null : 'rating')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold transition-colors whitespace-nowrap ${ratingFilter !== 'any' ? 'border-lime-500 bg-lime-50 text-lime-800' : 'border-gray-300 text-gray-700 hover:border-black'}`}
                >
                  Rating {ratingFilter !== 'any' && `(${ratingFilter.split('-')[0]}+)`} <FaChevronDown size={10} />
                </button>
                {openDropdown === 'rating' && (
                  <div className="absolute top-10 left-0 bg-white border border-gray-200 rounded-xl shadow-xl w-32 py-2 z-50">
                    <button className={`block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 ${ratingFilter === 'any' ? 'text-lime-700 font-bold' : 'text-gray-700'}`} onClick={() => { setRatingFilter('any'); setOpenDropdown(null); }}>Any rating</button>
                    <button className={`block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 ${ratingFilter === '4.0-plus' ? 'text-lime-700 font-bold' : 'text-gray-700'}`} onClick={() => { setRatingFilter('4.0-plus'); setOpenDropdown(null); }}>4.0+ Stars</button>
                    <button className={`block w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 ${ratingFilter === '4.5-plus' ? 'text-lime-700 font-bold' : 'text-gray-700'}`} onClick={() => { setRatingFilter('4.5-plus'); setOpenDropdown(null); }}>4.5+ Stars</button>
                  </div>
                )}
              </div>
              {searchDate && (
                <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-lime-500 bg-lime-50 text-sm font-bold text-lime-800 whitespace-nowrap">
                  Available on {getDisplayDate()}
                </button>
              )}
            </div>
          </div>

          <div className="p-4 md:p-6 lg:p-8 flex-1">

            <div className="mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black text-gray-900 leading-tight">
                  {query || category ? `${query || category} in ${location || 'London'}` : 'Top Clinics & Treatments'}
                </h1>
                <p className="text-gray-500 text-sm mt-1">{total} venues found</p>
              </div>
            </div>

            {/* Category Navigation (Treatwell Style) */}
            <div className="flex gap-3 overflow-x-auto mb-10 pb-2 no-scrollbar border-b border-gray-50">
              {['All', 'Hair Removal', 'Injectables', 'Skin Care', 'Body', 'Surgery', 'Dental'].map(cat => (
                <button
                  key={cat}
                  className={`px-5 py-2.5 rounded-full text-sm font-black uppercase tracking-widest transition-all border ${(cat === 'All' && !category) || category === cat
                    ? 'bg-black text-white border-black shadow-lg'
                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                    }`}
                  onClick={() => handleSearch({ category: cat === 'All' ? '' : cat, q: query })}
                >
                  {cat}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[250px] bg-gray-50 animate-pulse rounded-2xl border border-gray-100"></div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Tab Navigation */}
                <div className="flex gap-8 border-b border-gray-100 pb-0">
                  <button
                    onClick={() => setActiveTab('treatments')}
                    className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'treatments'
                      ? 'text-gray-900'
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    Treatments <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full ml-1 text-gray-500">{filteredTreatments.length}</span>
                    {activeTab === 'treatments' && (
                      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-lime-500 rounded-t-lg"></span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('clinics')}
                    className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'clinics'
                      ? 'text-gray-900'
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    Clinics <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full ml-1 text-gray-500">{filteredClinics.length}</span>
                    {activeTab === 'clinics' && (
                      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-lime-500 rounded-t-lg"></span>
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'treatments' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {filteredTreatments.length > 0 ? (
                      <div className="flex flex-col gap-6">
                        {filteredTreatments.map((treatment) => (
                          <TreatmentCard
                            key={treatment.id}
                            treatment={treatment}
                            onSelect={() => {
                              if (treatment.clinicsCount === 1 && treatment.singleClinicId && treatment.singleServiceId) {
                                navigate(`/appointment/booking?clinicId=${treatment.singleClinicId}&serviceIds=${treatment.singleServiceId}`);
                              } else {
                                navigate(`/treatment/${treatment.id}`);
                              }
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <div className="size-20 bg-white rounded-full flex items-center justify-center text-gray-200 mx-auto mb-4 border border-gray-100 shadow-sm">
                          <FaList size={32} />
                        </div>
                        <h3 className="text-xl font-black text-gray-400 uppercase">No treatments found</h3>
                        <p className="text-gray-400 text-sm mt-2 font-medium">Try adjusting your category or keyword.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'clinics' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {filteredClinics.length > 0 ? (
                      <div className="flex flex-col gap-6">
                        {filteredClinics.map((clinic, index) => (
                          <ClinicCard
                            key={clinic.id}
                            clinic={clinic}
                            index={index}
                            onSelect={() => navigate(`/clinic/${clinic.id}`)}
                            searchQuery={query}
                            searchDate={searchDate}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <div className="size-20 bg-white rounded-full flex items-center justify-center text-gray-200 mx-auto mb-4 border border-gray-100 shadow-sm">
                          <FaHospital size={32} />
                        </div>
                        <h3 className="text-xl font-black text-gray-400 uppercase">No clinics found</h3>
                        <p className="text-gray-400 text-sm mt-2 font-medium">Try adjusting your area or keyword.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Map (Desktop) */}
        {showDesktopMap && (
          <aside className="hidden lg:block lg:w-[45%] xl:w-[40%] bg-[#DEE1E6] h-[calc(100vh-112px)] sticky top-[112px] border-l border-gray-200 relative overflow-hidden z-[45]">
            <ClinicMap clinics={clinics} center={mapCenter} zoom={13} />
          </aside>
        )}

        {/* Mobile Map Overlay Tab */}
        <div className="fixed bottom-0 left-0 w-full p-4 z-50 lg:hidden pointer-events-none flex justify-center">
          <button
            onClick={() => setShowMobileMap(true)}
            className="pointer-events-auto bg-black text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold hover:scale-105 transition-transform"
          >
            <FaMap /> Map
          </button>
        </div>

        {/* Mobile Map Full Screen Mode */}
        {showMobileMap && (
          <div className="fixed inset-0 bg-[#DEE1E6] z-[70] flex flex-col">
            <div className="bg-white p-4 shadow-md flex items-center justify-between pb-6">
              <h3 className="font-black text-lg">Map View</h3>
              <button onClick={() => setShowMobileMap(false)} className="font-bold text-gray-500 bg-gray-100 px-4 py-2 rounded-full text-sm">Close</button>
            </div>
            <div className="flex-1 relative">
              <ClinicMap clinics={clinics} center={mapCenter} zoom={13} />

              {/* Mobile Map Cards Scroller */}
              <div className="absolute bottom-6 left-0 flex gap-4 overflow-x-auto px-4 w-full snap-x snap-mandatory no-scrollbar pb-4">
                {clinics.slice(0, 5).map(clinic => (
                  <div key={clinic.id} onClick={() => navigate(`/clinic/${clinic.id}`)} className="min-w-[85vw] snap-center bg-white rounded-2xl shadow-xl p-3 flex gap-4 animate-in slide-in-from-bottom border border-gray-100">
                    <div className="size-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={clinic.images?.[0] || 'https://placehold.co/200x200'} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="font-black text-[15px] text-gray-900 truncate">{clinic.name}</h4>
                      <div className="flex items-center gap-1 my-1">
                        <span className="text-xs font-bold text-gray-900">{clinic?.rating ? Number(clinic.rating).toFixed(1) : '4.9'}</span>
                        <FaStar className="text-yellow-400" size={12} />
                        <span className="text-xs text-gray-400">({clinic?.reviewCount || 120})</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{clinic.address?.city} • 1.2m</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
