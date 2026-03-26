import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Search, MapPin, Calendar as CalendarIcon, Clock, ChevronDown } from "lucide-react";

export interface SearchBarProps {
  onSearch: (filters: {
    query: string;
    location?: string;
    category?: string;
    search_date?: string | null;
    search_time_window?: string | null;
  }) => void;
  className?: string;
  initialFilters?: {
    query?: string;
    location?: string;
    category?: string;
    search_date?: string | null;
    search_time_window?: string | null;
  };
}

// Treatment categories and items for autocomplete
const SUGGESTIONS = {
  categories: [
    { id: "c1", name: "Hair Removal", count: 120 },
    { id: "c2", name: "Injectables", count: 85 },
    { id: "c3", name: "Skin Care", count: 210 },
    { id: "c4", name: "Body", count: 45 },
    { id: "c5", name: "Surgery", count: 12 },
    { id: "c6", name: "Dental", count: 32 },
  ],
  treatments: [
    { id: "t1", name: "Botox Treatment", category: "Injectables" },
    { id: "t2", name: "Dermal Fillers", category: "Injectables" },
    { id: "t3", name: "Laser Hair Removal", category: "Hair Removal" },
    { id: "t4", name: "Chemical Peel", category: "Skin Care" },
    { id: "t5", name: "HydraFacial", category: "Skin Care" },
    { id: "t6", name: "Fat Dissolving", category: "Body" },
  ],
  clinics: [
    { id: "cl1", name: "Luxe Aesthetics London" },
    { id: "cl2", name: "SkinHealth Clinic" },
  ]
};

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  className,
  initialFilters,
}) => {
  const [query, setQuery] = useState(initialFilters?.query || "");
  const [location, setLocation] = useState(initialFilters?.location || "");
  const [searchDate, setSearchDate] = useState<string | null>(initialFilters?.search_date || null);
  const [searchTimeWindow, setSearchTimeWindow] = useState<string | null>(initialFilters?.search_time_window || null);

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Temporary state for the date/time popover
  const [tempDate, setTempDate] = useState<string | null>(searchDate);
  const [tempTime, setTempTime] = useState<string | null>(searchTimeWindow);

  const [dateMode, setDateMode] = useState<'preset' | 'custom'>('preset');
  const [timeMode, setTimeMode] = useState<'any' | 'custom'>('any');

  const searchRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const setPresetDate = (days: number) => {
    setDateMode('preset');
    const d = new Date();
    d.setDate(d.getDate() + days);
    setTempDate(d.toISOString().split("T")[0]);
  };

  const applyDateTime = () => {
    setSearchDate(tempDate);
    setSearchTimeWindow(timeMode === 'any' ? null : tempTime);
    setShowDatePicker(false);
  };

  const getDisplayDateTime = () => {
    if (!searchDate && !searchTimeWindow) return "Any date, Any time";
    const dateStr = searchDate ? new Date(searchDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Any date";

    let timeStr = "Any time";
    if (searchTimeWindow === "morning") timeStr = "Morning (8am - 12pm)";
    else if (searchTimeWindow === "afternoon") timeStr = "Afternoon (12pm - 5pm)";
    else if (searchTimeWindow === "evening") timeStr = "Evening (5pm+)";
    else if (searchTimeWindow) timeStr = searchTimeWindow;

    return `${dateStr}, ${timeStr}`;
  };

  const handleSearchClick = () => {
    onSearch({
      query,
      location,
      search_date: searchDate,
      search_time_window: searchTimeWindow
    });
  };

  return (
    <div className={`bg-white rounded-[24px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-[520px] z-20 border border-gray-100 ${className || ""}`}>
      <div className="flex flex-col gap-6">

        {/* S1: Treatment / Service */}
        <div className="relative" ref={searchRef}>
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block px-1">What</label>
          <div className="border-2 border-gray-100 focus-within:border-black rounded-2xl p-4 flex items-center transition-all bg-gray-50 group hover:bg-white hover:border-gray-200">
            <Search className="text-gray-400 w-5 h-5 mr-4 shrink-0 group-focus-within:text-black transition-colors" />
            <input
              className="w-full outline-none font-black text-lg text-gray-900 bg-transparent placeholder:text-gray-300 placeholder:italic"
              placeholder="Search treatments / clinics"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowAutocomplete(true);
              }}
              onFocus={() => setShowAutocomplete(true)}
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showAutocomplete && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-2">
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest px-3 py-2">
                  Browse by Category
                </div>
                {SUGGESTIONS.categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-lime-50 rounded-lg text-sm font-bold text-gray-700 transition-colors flex items-center justify-between group"
                    onClick={() => {
                      setQuery(c.name);
                      setShowAutocomplete(false);
                      onSearch({ query: c.name, category: c.name });
                    }}
                  >
                    <span className="group-hover:text-lime-700">{c.name}</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-lime-600 bg-gray-50 px-2 py-0.5 rounded-md">{c.count} venues</span>
                  </button>
                ))}

                <div className="text-xs font-black text-gray-400 uppercase tracking-widest px-3 py-2 mt-2 border-t border-gray-100 pt-3">
                  Popluar Treatments
                </div>
                {SUGGESTIONS.treatments.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm font-semibold text-gray-700 transition-colors flex items-center justify-between"
                    onClick={() => {
                      setQuery(t.name);
                      setShowAutocomplete(false);
                      onSearch({ query: t.name, location, search_date: searchDate, search_time_window: searchTimeWindow });
                    }}
                  >
                    <span>{t.name}</span>
                    <span className="text-[10px] text-gray-400">{t.category}</span>
                  </button>
                ))}

                <div className="text-xs font-black text-gray-400 uppercase tracking-widest px-3 py-2 mt-2 border-t border-gray-100 pt-3">
                  Clinics
                </div>
                {SUGGESTIONS.clinics.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm font-semibold text-gray-700 transition-colors"
                    onClick={() => {
                      setQuery(c.name);
                      setShowAutocomplete(false);
                      onSearch({ query: c.name, location, search_date: searchDate, search_time_window: searchTimeWindow });
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* S2: Location */}
        <div className="relative">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block px-1">Where</label>
          <div className="border-2 border-gray-100 focus-within:border-black rounded-2xl p-4 flex items-center transition-all bg-gray-50 group hover:bg-white hover:border-gray-200">
            <MapPin className="text-gray-400 w-5 h-5 mr-4 shrink-0 group-focus-within:text-black transition-colors" />
            <input
              className="w-full outline-none font-black text-lg text-gray-900 bg-transparent placeholder:text-gray-300 placeholder:italic"
              placeholder="Area or Postcode"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            {/* Use My Location Button */}
            <button
              type="button"
              onClick={() => {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    // Coordinates would be passed to parent search
                    console.log("Locating...", pos.coords);
                    setLocation("Current Location");
                  });
                }
              }}
              className="ml-2 p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-all"
              title="Use my current location"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.31-7.31l-1.41 1.41M6.1 17.9l-1.41 1.41m12.62 0l1.41 1.41M6.1 6.1L4.69 7.51"/></svg>
            </button>
          </div>
        </div>

        {/* S3: Date & Time */}
        <div className="relative" ref={dateRef}>
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block px-1">When</label>
          <div
            className="border-2 border-gray-100 hover:border-black rounded-2xl p-4 flex items-center justify-between transition-all bg-gray-50 hover:bg-white cursor-pointer group"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <div className="flex items-center">
              <CalendarIcon className="text-gray-400 w-5 h-5 mr-4 shrink-0 group-hover:text-black transition-colors" />
              <div className={`font-black text-lg ${searchDate || searchTimeWindow ? 'text-gray-900' : 'text-gray-300 italic'} truncate`}>
                {getDisplayDateTime()}
              </div>
            </div>
            <ChevronDown className="text-gray-400 w-5 h-5 shrink-0 group-hover:text-black transition-colors" />
          </div>

          {/* Date Picker Popover */}
          {showDatePicker && (
            <div className="absolute top-14 left-0 w-full md:w-[600px] mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-[60]">

              <div className="flex flex-col md:flex-row gap-6">
                {/* Date Section */}
                <div className="flex-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">Date</label>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className={`justify-start py-3 px-4 text-sm font-bold border-2 rounded-xl transition-all ${tempDate === new Date().toISOString().split("T")[0] && dateMode === 'preset' ? 'border-[#CBFF38] bg-lime-50 text-lime-800' : 'border-gray-100 text-gray-600 hover:border-gray-300'}`}
                      onClick={() => setPresetDate(0)}
                    >
                      Today
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`justify-start py-3 px-4 text-sm font-bold border-2 rounded-xl transition-all ${tempDate === new Date(Date.now() + 86400000).toISOString().split("T")[0] && dateMode === 'preset' ? 'border-[#CBFF38] bg-lime-50 text-lime-800' : 'border-gray-100 text-gray-600 hover:border-gray-300'}`}
                      onClick={() => setPresetDate(1)}
                    >
                      Tomorrow
                    </Button>

                    {dateMode !== 'custom' ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-start py-3 px-4 text-sm font-bold border-2 border-gray-100 text-gray-600 hover:border-gray-300 rounded-xl transition-all"
                        onClick={() => setDateMode('custom')}
                      >
                        Pick date...
                      </Button>
                    ) : (
                      <div className="relative border-2 border-[#CBFF38] rounded-xl p-3 flex items-center bg-lime-50/50 mt-1 animate-in fade-in slide-in-from-top-2">
                        <CalendarIcon className="text-lime-700 w-5 h-5 mr-3 shrink-0" />
                        <input
                          type="date"
                          className="w-full bg-transparent outline-none text-sm font-bold text-gray-800"
                          value={tempDate || ''}
                          onChange={(e) => setTempDate(e.target.value)}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Section */}
                <div className="flex-1 md:border-l md:border-t-0 border-t border-gray-100 md:pl-6 pt-5 md:pt-0">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">Time</label>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className={`justify-start py-3 px-4 text-sm font-bold border-2 rounded-xl transition-all ${timeMode === 'any' ? 'border-[#CBFF38] bg-lime-50 text-lime-800' : 'border-gray-100 text-gray-600 hover:border-gray-300'}`}
                      onClick={() => { setTimeMode('any'); setTempTime(null); }}
                    >
                      Any time
                    </Button>

                    {timeMode !== 'custom' ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-start py-3 px-4 text-sm font-bold border-2 border-gray-100 text-gray-600 hover:border-gray-300 rounded-xl transition-all"
                        onClick={() => { setTimeMode('custom'); setTempTime("morning"); }}
                      >
                        Pick time...
                      </Button>
                    ) : (
                      <div className="relative border-2 border-[#CBFF38] rounded-xl p-3 flex items-center bg-lime-50/50 mt-1 animate-in fade-in slide-in-from-top-2">
                        <Clock className="text-lime-700 w-5 h-5 mr-3 shrink-0" />
                        <select
                          className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 cursor-pointer"
                          value={tempTime || "morning"}
                          onChange={(e) => setTempTime(e.target.value)}
                        >
                          <option value="morning">Morning (8am - 12pm)</option>
                          <option value="afternoon">Afternoon (12pm - 5pm)</option>
                          <option value="evening">Evening (5pm on)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black"
                  onClick={() => { setTempDate(null); setTempTime(null); setSearchDate(null); setSearchTimeWindow(null); setShowDatePicker(false); }}
                >
                  Reset
                </button>
                <Button
                  type="button"
                  className="flex-1 bg-black text-white hover:bg-gray-800 py-4 rounded-xl font-bold transition-all shadow-md active:scale-95"
                  onClick={applyDateTime}
                >
                  Apply Selection
                </Button>
              </div>

            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          type="button"
          onClick={handleSearchClick}
          className="w-full bg-[#CBFF38] text-black hover:bg-black hover:text-white py-5 rounded-2xl flex items-center justify-center font-black uppercase tracking-widest text-base transition-all duration-300 shadow-xl shadow-[#CBFF38]/20 mt-4 active:scale-95"
        >
          Search Availability
        </Button>
      </div>
    </div>
  );
};
