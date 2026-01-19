import React, { useState } from "react";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Search } from "lucide-react";

export interface SearchBarProps {
  onSearch: (filters: {
    query: string;
    location?: string;
    category?: string;
  }) => void;
  className?: string;
  initialFilters?: {
    query?: string;
    location?: string;
    category?: string;
  };
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  className,
  initialFilters,
}) => {
  const [query, setQuery] = useState(initialFilters?.query || "");
  const [location, setLocation] = useState(initialFilters?.location || "");
  const [category, setCategory] = useState(initialFilters?.category || "");

  React.useEffect(() => {
    if (initialFilters) {
      if (initialFilters.query !== undefined) setQuery(initialFilters.query);
      if (initialFilters.location !== undefined) setLocation(initialFilters.location);
      if (initialFilters.category !== undefined) setCategory(initialFilters.category);
    }
  }, [initialFilters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, location, category });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col sm:flex-row gap-4 ${className || ""}`}
    >
      <Input
        placeholder="Search treatments or clinics"
        leftIcon={<Search size={16} />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
        style={{ paddingLeft: "35px" }}
      />
      <Input
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        fullWidth
      />
      {/* <Input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        fullWidth
      /> */}
      <Button type="submit">Search</Button>
    </form>
  );
};
