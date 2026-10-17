import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, Calendar as CalendarIcon, Clock, ChevronDown, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { css } from "@emotion/css";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";

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
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 28px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.75);
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 500px;
`;

const searchInputBlock = css`
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.6);
  transition: all 0.25s ease;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const inputLabel = css`
  font-size: 15px;
  font-weight: 700;
  color: #0F172A;
  display: block;
  text-align: left;
  line-height: 1.25;
`;

const inputSubLabel = css`
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  display: block;
  text-align: left;
  margin-top: 2px;
`;

export const SearchBar: React.FC<SearchBarProps> = ({
 onSearch,
 className,
 initialFilters,
}) => {
  const {
    query,
    setQuery,
    searchDate,
    setSearchDate,
    searchTimeWindow,
    setSearchTimeWindow,
    suggestions,
    showAutocomplete,
    setShowAutocomplete,
    isSearching,
    searchRef,
    handleSearchClick,
    handleSuggestionSelect,
  } = useSearchSuggestions({
    initialQuery: initialFilters?.query,
    initialDate: initialFilters?.search_date,
    initialTimeWindow: initialFilters?.search_time_window,
    onSearch,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDatePicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
 <div className={`${containerStyle} ${className ||""}`}>
 {/* Query Block */}
 <div className="relative" ref={searchRef}>
 <div
 className={searchInputBlock}
 style={{ borderTopLeftRadius: '28px', borderTopRightRadius: '28px' }}
 >
 <div className="size-12 bg-white/95 shadow-sm rounded-2xl flex items-center justify-center text-gray-600 flex-shrink-0">
 <Search size={20} />
 </div>
 <div className="flex-1 text-left">
 <input
 className="w-full bg-transparent outline-none font-bold text-gray-900 placeholder:text-gray-900 text-left text-[15px]"
 placeholder="Search Treatments"
 autoComplete="one-time-code"
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
 Choose your treatment
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
 <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Treatments Found</p>
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
 No matching treatments found
 </div>
 ) : (
 <div className="p-4 text-center text-sm text-gray-500">
 Type to see treatment suggestions...
 </div>
 )}
 </div>

 <button
 onClick={() => handleSearchClick()}
 className="w-full bg-[#CBFF38] text-black h-12 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 mt-2"
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
 style={{ borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px' }}
 >
 <div className="size-12 bg-white/95 shadow-sm rounded-2xl flex items-center justify-center text-gray-600 flex-shrink-0">
 <CalendarIcon size={20} />
 </div>
 <div className="flex-1 text-left">
 <span className={inputLabel}>
 {searchDate ? new Date(searchDate).toLocaleDateString() :"Select Date"}
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
 <div className="mb-4">
 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Select Visit Date</p>
 <input
 type="date"
 className="w-full p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl outline-none font-bold text-gray-900 focus:border-[#CBFF38] transition-colors"
 value={searchDate ||""}
 onChange={(e) => { 
 setSearchDate(e.target.value); 
 // Don't close immediately so they can see the selection
 }}
 />
 </div>
 <div className="grid grid-cols-2 gap-2">
 <button 
 onClick={() => { 
 setSearchDate(null); 
 setShowDatePicker(false); 
 onSearch({
 query: query,
 search_date: null,
 search_time_window: searchTimeWindow
 });
 }}
 className="h-10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
 >
 Clear
 </button>
 <button 
 onClick={() => {
 setShowDatePicker(false);
 onSearch({
 query: query,
 search_date: searchDate,
 search_time_window: searchTimeWindow
 });
 }}
 className="h-10 bg-black text-[#CBFF38] rounded-xl text-[10px] font-black uppercase tracking-widest"
 >
 Apply
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 );
};

