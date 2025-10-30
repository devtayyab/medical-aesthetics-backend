import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { SearchBar } from "@/components/organisms/SearchBar";
import { ClinicCard } from "@/components/molecules/ClinicCard/ClinicCard";
import {
  searchClinics,
  setSearchFilters,
  clearError,
} from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Clinic } from "@/types";
import LinedBg from "@/assets/LinedBg.svg";
import LayeredBG from "@/assets/LayeredBg.svg";
import { store } from "@/store"; // Import the store here

export const Search: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { clinics, isLoading, error, searchFilters } = useSelector(
    (state: RootState) => state.client
  );

  console.log("clinics:", clinics);
  console.log("isLoading:", isLoading, "error:", error);

  useEffect(() => {
    console.log("Dispatching searchClinics");
    const state = store.getState() as RootState;
    console.log(
      "Current accessToken:",
      state.auth.accessToken?.substring(0, 20) || "No token"
    );
    const params = new URLSearchParams(location.search);
    const filters = {
      query: params.get("q") || "",
      location: params.get("location") || "",
      category: params.get("category") || "",
      limit: 10,
      offset: 0,
    };
    dispatch(setSearchFilters(filters));
    dispatch(searchClinics({ ...filters }));
    return () => {
      dispatch(clearError());
    };
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
    <div className="">
      <div
        className="p-6 bg-[#1A202C] min-h-[315px]"
        style={{
          backgroundImage: `url(${LinedBg})`,
          alignContent: "center",
        }}
      >
        <SearchBar
          onSearch={handleSearch}
          initialFilters={searchFilters}
          className="bg-white w-[70%] mx-auto px-6 py-7 rounded-[12px]"
        />
      </div>
      <div
        className="py-10 -scale-x-100"
        style={{
          backgroundImage: `url(${LayeredBG})`,
          backgroundPosition: "center",
          backgroundSize: `${clinics.length === 0 ? "cover" : "contain"}`,
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="px-8 max-w-[1200px] mx-auto -scale-x-100">
          {isLoading && (
            <p className="text-gray-600 text-xl font-medium text-center min-h-[200px] py-16">
              Loading...
            </p>
          )}
          {error && (
            <p className="text-red-600 text-xl font-medium text-center min-h-[200px] py-16">
              {error}
            </p>
          )}
          {clinics.length === 0 && !isLoading && !error && (
            <p className="text-black text-xl font-medium text-center min-h-[200px] py-16">
              No clinics found.
            </p>
          )}
          <div className="pb-10 px-4 flex justify-center items-center flex-wrap gap-[10px]">
            <button className="px-[22px] py-3 font-medium text-[#2D3748] border border-[#2D3748] rounded-[12px]">
              By price
            </button>
            <button className="px-[22px] py-3 font-medium text-[#2D3748] border border-[#2D3748] rounded-[12px]">
              Top rated treatments
            </button>
            <button className="px-[22px] py-3 font-medium text-[#2D3748] border border-[#2D3748] rounded-[12px]">
              Most booked this week
            </button>
            <button className="px-[22px] py-3 font-medium text-[#2D3748] border border-[#2D3748] rounded-[12px]">
              Rating
            </button>
          </div>
          <div className="flex flex-col justify-center items-center gap-6">
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
    </div>
  );
};
