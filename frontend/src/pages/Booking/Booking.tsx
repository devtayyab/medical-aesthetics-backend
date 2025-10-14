import React,{ useState,useEffect } from "react";
import { Button } from "@/components/atoms/Button/Button";
import ClinicCard from "@/components/molecules/BookingCard/ClinicCard";
import CardDetails from "@/components/molecules/BookingCard/CardDetails";
import {fetchFeaturedClinics} from "@/store/slices/clinicsSlice"
import type { RootState ,AppDispatch} from "@/store";
import { useSelector,useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
//Icons
import { IoSearchSharp } from "react-icons/io5";
import HospitalIcon from "@/assets/Icons/HospitalIcon.svg";

export const Booking: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { clinic } = useSelector((state: RootState) => state.clinics);
   
  useEffect(() => {
    dispatch(fetchFeaturedClinics());
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("searching for:", searchQuery, "in", location);
  };
  
  return (
    <div>
 <div className="w-full h-[250px] flex items-center justify-center bg-gray-600 -top-[11px]">
  <form onSubmit={handleSearch} className="w-full max-w-5xl h-auto px-4 md:px-8 mx-auto">
    <div className="bg-white w-full h-auto rounded-xl pl-6 pr-6 pt-6 pb-6 shadow-lg">
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <IoSearchSharp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
          <input type="text" placeholder="Find Treatment" value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full  px-10  py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-600"
          /> 
          </div>
        {/* Location Input */}
        <div className="relative flex-1">
          < img src={HospitalIcon} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
          <input type="text" placeholder="Find Clinic" value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full  px-10  py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-600"
          />  </div>
        </div>
        </div>
  </form>
</div>
      {/* Buttons */}
      <div className="px-4 py-6">
        <div className="flex flex-wrap gap-4  justify-center ">
          <Button  className="px-4 py-2 rounded-xl bg-white text-gray-700 border border-gray-600 text-sm">By Price</Button>
           <Button  className="px-4 py-2 rounded-xl bg-white text-gray-700 border border-gray-600 text-sm">Top rated treatments</Button>
         <Button  className="px-4 py-2 rounded-xl bg-white text-gray-700 border border-gray-600 text-sm">Most Booked this week</Button>
           <Button  className="px-4 py-2 rounded-xl bg-white text-gray-700 border border-gray-600 text-sm">Rating</Button>
        </div>
      </div>
       {/* Cards */}
      <div className="container">
        <div onClick={() => navigate(`/clinic/${clinic[0].id}`)}>
          <CardDetails
            key={clinic[0].id}
            name={clinic[0].name}
            location={clinic[0].location}
           amount={clinic[0].amount}
          />
        </div>
        <div onClick={() => navigate(`/clinic/${clinic[1].id}`)}>
          <ClinicCard
            key={clinic[1].id}
            name={clinic[1].name}
            location={clinic[1].location}
            amount={clinic[1].amount}
          />
        </div>
      </div>
    </div>
  );
};
