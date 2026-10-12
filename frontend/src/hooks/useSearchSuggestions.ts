import { useState, useEffect, useRef } from 'react';
import { clinicsAPI } from '@/services/api';

export interface UseSearchSuggestionsOptions {
  initialQuery?: string;
  initialDate?: string | null;
  initialTimeWindow?: string | null;
  onSearch: (filters: {
    query: string;
    location?: string;
    category?: string;
    search_date?: string | null;
    search_time_window?: string | null;
  }) => void;
}

export const useSearchSuggestions = ({
  initialQuery = '',
  initialDate = null,
  initialTimeWindow = null,
  onSearch,
}: UseSearchSuggestionsOptions) => {
  const [query, setQuery] = useState(initialQuery);
  const [searchDate, setSearchDate] = useState<string | null>(initialDate);
  const [searchTimeWindow, setSearchTimeWindow] = useState<string | null>(initialTimeWindow);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debouncing
  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSearching(true);
      try {
        const response = await clinicsAPI.getSuggestions(query);
        setSuggestions(response.data || []);
      } catch (err) {
        console.error('Failed to fetch suggestions', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchClick = (selectedQuery?: string) => {
    onSearch({
      query: selectedQuery || query,
      search_date: searchDate,
      search_time_window: searchTimeWindow,
    });
    setShowAutocomplete(false);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    handleSearchClick(suggestion);
  };

  return {
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
  };
};

export default useSearchSuggestions;
