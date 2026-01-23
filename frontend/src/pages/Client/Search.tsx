import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchClinics } from "@/store/slices/clientSlice";
import { RootState, AppDispatch } from "@/store";
import { SearchBar } from "@/components/organisms/SearchBar";
import { ClinicCard } from "@/components/molecules/ClinicCard/ClinicCard";
import { Button } from "@/components/atoms/Button/Button";
import { FaHospital, FaStethoscope } from "react-icons/fa";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import LinedBg from "@/assets/LinedBg.svg";

const containerStyle = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 1rem;
  position: relative;
  @media (min-width: 768px) {
    padding: 40px 2rem;
  }
`;

const tabStyle = (isActive: boolean) => css`
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 600;
  border-bottom: 3px solid ${isActive ? '#CBFF38' : 'transparent'};
  color: ${isActive ? '#333' : '#718096'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover {
    color: #333;
  }
`;

export const Search: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clinics, searchServices, isLoading, total } = useSelector(
    (state: RootState) => state.client
  );

  const [activeTab, setActiveTab] = useState<'treatments' | 'clinics'>('treatments');

  const query = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const category = searchParams.get("category") || "";

  useEffect(() => {
    dispatch(
      searchClinics({
        query,
        location,
        category,
      })
    );
  }, [dispatch, query, location, category]);

  const handleSearch = (filters: { query: string; location?: string; category?: string }) => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.location) params.set("location", filters.location);
    if (filters.category) params.set("category", filters.category);
    setSearchParams(params);
  };

  const handleBookService = (service: any) => {
    navigate(`/appointment/booking?clinicId=${service.clinicId}&serviceIds=${service.id}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Search Section */}
      <div
        className="pt-16 pb-24 bg-[#1A202C] relative"
        style={{
          backgroundImage: `url(${LinedBg})`,
          backgroundSize: 'cover'
        }}
      >
        <div className="max-w-[800px] mx-auto px-6">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Find the best treatments near you</h1>
          <SearchBar
            initialFilters={{ query, location, category }}
            onSearch={handleSearch}
            className="bg-white shadow-xl rounded-2xl p-4"
          />
        </div>
      </div>

      <div className={containerStyle}>
        <img src={LayeredBG} alt="" className="absolute top-0 left-0 w-full z-0 opacity-10 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8 border-b border-gray-100">
            <div className="flex gap-4">
              <button
                className={tabStyle(activeTab === 'treatments')}
                onClick={() => setActiveTab('treatments')}
              >
                <FaStethoscope className={activeTab === 'treatments' ? 'text-[#CBFF38]' : 'text-gray-400'} />
                Treatments ({searchServices.length})
              </button>
              <button
                className={tabStyle(activeTab === 'clinics')}
                onClick={() => setActiveTab('clinics')}
              >
                <FaHospital className={activeTab === 'clinics' ? 'text-[#CBFF38]' : 'text-gray-400'} />
                Clinics ({clinics.length})
              </button>
            </div>

            <div className="text-sm text-gray-400 hidden sm:block">
              Found {total} results
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[300px] bg-gray-50 animate-pulse rounded-2xl border border-gray-100"></div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'treatments' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchServices.length > 0 ? (
                    searchServices.map((service) => (
                      <div key={service.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="px-3 py-1 bg-gray-50 text-[#357A7B] text-[10px] font-bold uppercase rounded-full border border-gray-100">
                                {service.category}
                              </span>
                              <h3 className="text-xl font-bold text-[#33373F] mt-3 group-hover:text-lime-600 transition-colors">
                                {service.name}
                              </h3>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">From</span>
                              <span className="text-2xl font-bold text-black">${service.price}</span>
                            </div>
                          </div>

                          <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">{service.description}</p>

                          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="size-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <FaHospital className="text-lime-500" />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Available at</p>
                              <p className="text-sm font-bold text-gray-700">{(service as any).clinic?.name || 'Partner Clinic'}</p>
                            </div>
                          </div>

                          <Button
                            fullWidth
                            onClick={() => handleBookService(service)}
                            className="bg-[#CBFF38] text-[#203400] hover:bg-[#A7E52F] font-bold py-4 rounded-xl shadow-sm"
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20">
                      <div className="bg-gray-50 rounded-3xl p-12 inline-block">
                        <FaStethoscope className="size-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-400">No treatments found</h3>
                        <p className="text-gray-400 text-sm max-w-[300px] mx-auto mt-2">Try adjusting your filters or searching for something else.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'clinics' && (
                <div className="flex flex-col gap-6 max-w-[900px] mx-auto">
                  {clinics.length > 0 ? (
                    clinics.map((clinic, index) => (
                      <ClinicCard
                        key={clinic.id}
                        clinic={clinic}
                        index={index}
                        onSelect={() => navigate(`/clinic/${clinic.id}`)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <div className="bg-gray-50 rounded-3xl p-12 inline-block">
                        <FaHospital className="size-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-400">No clinics found</h3>
                        <p className="text-gray-400 text-sm max-w-[300px] mx-auto mt-2">We couldn't find any clinics in this area.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
