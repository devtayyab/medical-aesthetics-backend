import React, { useState } from "react";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (filters: {
    query: string;
    location?: string;
    category?: string;
  }) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, location, category });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        placeholder="Search treatments or clinics"
        leftIcon={<Search size={16} />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
      />
      <Input
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        fullWidth
      />
      <Input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        fullWidth
      />
      <Button type="submit">Search</Button>
    </form>
  );
};
