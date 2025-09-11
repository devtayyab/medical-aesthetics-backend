import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { SearchBar } from "@/components/organisms/SearchBar";
import { ClinicCard } from "@/components/molecules/ClinicCard/ClinicCard";
import { searchClinics, setSearchFilters } from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Clinic } from "@/types";
import { Sidebar } from "@/components/organisms/Sidebar";

export const Search: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { clinics, isLoading, error, searchFilters } = useSelector(
    (state: RootState) => state.client
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filters = {
      query: params.get("q") || "",
      location: params.get("location") || "",
      category: params.get("category") || "",
    };
    dispatch(setSearchFilters(filters));
    dispatch(searchClinics(filters));
  }, [dispatch, location.search]);

  const handleSearch = (filters: {
    query: string;
    location?: string;
    category?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.location) params.set("location", filters.location);
    if (filters.category) params.set("category", filters.category);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Search Clinics</h2>
        <SearchBar onSearch={handleSearch} />
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {clinics.map((clinic: Clinic) => (
            <ClinicCard
              key={clinic.id}
              clinic={clinic}
              onSelect={() => navigate(`/clinic/${clinic.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
