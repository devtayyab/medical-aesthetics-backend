import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchClinics } from "@/store/slices/clientSlice";
import { RootState, AppDispatch } from "@/store";
import { SearchBar } from "@/components/organisms/SearchBar";
import { ClinicCard } from "@/components/molecules/ClinicCard/ClinicCard";
import { Button } from "@/components/atoms/Button/Button";
import { FaHospital, FaMap, FaList, FaStar, FaChevronDown, FaMapMarkedAlt } from "react-icons/fa";

export const Search: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clinics, isLoading, total } = useSelector(
    (state: RootState) => state.client
  );

  const [showDesktopMap, setShowDesktopMap] = useState<boolean>(true);
  const [showMobileMap, setShowMobileMap] = useState<boolean>(false);

  const query = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const category = searchParams.get("category") || "";
  const searchDate = searchParams.get("search_date") || "";
  const searchTimeWindow = searchParams.get("search_time_window") || "";

  useEffect(() => {
    dispatch(
      searchClinics({
        query,
        location,
        category,
        search_date: searchDate,
        search_time_window: searchTimeWindow,
      } as any)
    );
  }, [dispatch, query, location, category, searchDate, searchTimeWindow]);

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
      {/* Top Search Summary Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm w-full">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-col md:flex-row items-center gap-4 justify-between">
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
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar border-t border-gray-100">
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-300 text-sm font-bold text-gray-700 hover:border-black transition-colors whitespace-nowrap">
            Sort by: Recommended <FaChevronDown size={10} />
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-300 text-sm font-bold text-gray-700 hover:border-black transition-colors whitespace-nowrap">
            Price range <FaChevronDown size={10} />
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-300 text-sm font-bold text-gray-700 hover:border-black transition-colors whitespace-nowrap">
            Rating <FaChevronDown size={10} />
          </button>
          {searchDate && (
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-lime-500 bg-lime-50 text-sm font-bold text-lime-800 whitespace-nowrap">
              Available on {getDisplayDate()}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto flex w-full relative">

        {/* Left Column: List */}
        <div className={`w-full ${showDesktopMap ? 'lg:w-[55%] xl:w-[60%]' : 'lg:w-[100%]'} transition-all duration-300 p-4 md:p-6 lg:p-8 min-h-screen pb-24`}>

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
              {clinics.length > 0 ? (
                clinics.map((clinic, index) => (
                  <ClinicCard
                    key={clinic.id}
                    clinic={clinic}
                    index={index}
                    onSelect={() => navigate(`/clinic/${clinic.id}`)}
                    searchQuery={query}
                    searchDate={searchDate}
                  />
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <div className="size-20 bg-white rounded-full flex items-center justify-center text-gray-200 mx-auto mb-4 border border-gray-100 shadow-sm">
                    <FaHospital size={32} />
                  </div>
                  <h3 className="text-xl font-black text-gray-400 uppercase">No clinics found</h3>
                  <p className="text-gray-400 text-sm mt-2 font-medium">Try adjusting your area or dates.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Map (Desktop) */}
        {showDesktopMap && (
          <div className="hidden lg:block lg:w-[45%] xl:w-[40%] bg-[#DEE1E6] h-[calc(100vh-140px)] sticky top-[140px] border-l border-gray-200 relative overflow-hidden">
            {/* Mock Map Background */}
            <div className="absolute inset-0" style={{ backgroundImage: 'url("https://maps.googleapis.com/maps/api/staticmap?center=London&zoom=13&size=800x800&key=MOCK_KEY")', backgroundSize: 'cover' }}>
              {/* Mock Pins */}
              {clinics.map((c, i) => (
                <div
                  key={c.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                  style={{ top: `${30 + i * 15}%`, left: `${40 + i * 12}%` }}
                  onClick={() => navigate(`/clinic/${c.id}`)}
                >
                  <div className="bg-black text-white px-3 py-1.5 rounded-lg shadow-xl font-black text-sm whitespace-nowrap group-hover:scale-110 transition-transform">
                    £49+
                  </div>
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black"></div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

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
          <div className="flex-1 relative" style={{ backgroundImage: 'url("https://maps.googleapis.com/maps/api/staticmap?center=London&zoom=13&size=800x800&key=MOCK_KEY")', backgroundSize: 'cover' }}>
            {/* Mock Pins */}
            {clinics.map((c, i) => (
              <div
                key={c.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                style={{ top: `${30 + i * 15}%`, left: `${40 + i * 12}%` }}
                onClick={() => navigate(`/clinic/${c.id}`)}
              >
                <div className="bg-black text-white px-3 py-1.5 rounded-lg shadow-xl font-black text-sm whitespace-nowrap group-hover:scale-110 transition-transform">
                  £49+
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black"></div>
              </div>
            ))}

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
                      <span className="text-xs font-bold text-gray-900">{clinic?.rating || '4.9'}</span>
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
  );
};
