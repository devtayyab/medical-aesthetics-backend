import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, Calendar as CalendarIcon, Clock, ChevronDown, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { css } from "@emotion/css";
import { clinicsAPI } from "@/services/api";

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

const containerStyle = css`
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 50px 100px rgba(0,0,0,0.15);
  border: 1px solid rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 500px;
`;

const searchInputBlock = css`
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #F1F5F9;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: #FAFAFA;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const inputLabel = css`
  font-size: 14px;
  font-weight: 700;
  color: #1E293B;
  display: block;
`;

const inputSubLabel = css`
  font-size: 11px;
  font-weight: 500;
  color: #94A3B8;
  display: block;
`;

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  className,
  initialFilters,
}) => {
  const [query, setQuery] = useState(initialFilters?.query || "");
  const [searchDate, setSearchDate] = useState<string | null>(initialFilters?.search_date || null);
  const [searchTimeWindow, setSearchTimeWindow] = useState<string | null>(initialFilters?.search_time_window || null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const dateRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDatePicker(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowAutocomplete(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 1) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await clinicsAPI.getSuggestions(query);
        setSuggestions(response.data || []);
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearchClick = (selectedQuery?: string) => {
    onSearch({
      query: selectedQuery || query,
      search_date: searchDate,
      search_time_window: searchTimeWindow
    });
    setShowAutocomplete(false);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    handleSearchClick(suggestion);
  };

  return (
    <div className={`${containerStyle} ${className || ""}`}>
      {/* Query Block */}
      <div className="relative" ref={searchRef}>
        <div
          className={searchInputBlock}
        >
          <div className="size-12 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-gray-500">
            <Search size={20} />
          </div>
          <div className="flex-1">
            <input
              className="w-full bg-transparent outline-none font-bold text-gray-900 placeholder:text-gray-900"
              placeholder="Search Treatments"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!showAutocomplete) setShowAutocomplete(true);
              }}
              onFocus={() => setShowAutocomplete(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchClick();
              }}
            />
            <span className={inputSubLabel}>
              Choose your privilege
            </span>
          </div>
        </div>

        <AnimatePresence>
          {showAutocomplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl z-[100] p-2 border border-gray-100 overflow-hidden"
            >
              {/* Suggestions List */}
              <div className="max-h-[300px] overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin size-5 border-2 border-lime-500 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-1">
                    <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Privileges Found</p>
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#CBFF38]/10 text-left transition-colors group rounded-xl"
                      >
                        <Sparkles size={14} className="text-[#CBFF38] group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold text-gray-700">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                ) : query.length > 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No matching privileges found
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500 italic">
                    Type to see privilege suggestions...
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSearchClick()}
                className="w-full bg-[#CBFF38] text-black h-12 rounded-xl font-black uppercase text-[10px] tracking-widest italic flex items-center justify-center gap-2 mt-2"
              >
                Search Now <Search size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Date Block */}
      <div className="relative" ref={dateRef}>
        <div
          className={searchInputBlock}
          onClick={() => setShowDatePicker(!showDatePicker)}
        >
          <div className="size-12 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-gray-500">
            <CalendarIcon size={20} />
          </div>
          <div className="flex-1">
            <span className={inputLabel}>
              {searchDate ? new Date(searchDate).toLocaleDateString() : "Select Date"}
            </span>
            <span className={inputSubLabel}>Choose your visit date</span>
          </div>
        </div>

        <AnimatePresence>
          {showDatePicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl z-[100] p-4 border border-gray-100"
            >
              <input
                type="date"
                className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold"
                value={searchDate || ""}
                onChange={(e) => { setSearchDate(e.target.value); setShowDatePicker(false); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

