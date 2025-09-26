import { useState } from "react";

import { Button } from "@/components/atoms/Button/Button";
import ClinicCard from "@/components/molecules/BookingCard/ClinicCard"
import { IoSearchSharp } from "react-icons/io5";
import { LuMapPin } from "react-icons/lu";
import { SlCalender } from "react-icons/sl";
import { TfiMapAlt } from "react-icons/tfi";

const clinics = [
  {
    id: 1,
    name: "Botteqa Clinic",
    location: "Lahore, Pakistan",
    price: 1,
  },
  {
    id: 2,
    name: "Botteqa Clinic",
    location: "Lahore, Pakistan",
    price: 1,
  },
  {
    id: 3,
    name: "Botteqa Clinic",
    location: "Lahore, Pakistan",
    price: 1,
  },
  {
    id: 4,
    name: "Botteqa Clinic",
    location: "Lahore, Pakistan",
    price: 1,
  },
  {
    id: 5,
    name: "Botteqa Clinic",
    location: "Lahore, Pakistan",
    price: 1,
  },
];

export const Booking: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [showMap, setShowMap] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("searching for:", searchQuery, "in", location);
  };

  return (
    <>
      <div className="w-full bg-gray-600 px-4 py-6 l-3pxl">
       
        <form onSubmit={handleSearch} className="flex flex-col gap-4 w-full">
          <div className="container bg-white flex flex-col md:flex-row gap-2 md:gap-6 w-full p-2 rounded-lg shadow mb-6">
      
            {/* Search Input */}

  <div className="relative flex-1">
              <IoSearchSharp
               className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search for treatments"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full  mt-2 mb-2 pl-10 pr-4 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            {/* Location Input */}
            <div className="relative flex-1">
              <LuMapPin
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Enter postcode"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full mt-2 mb-2 pl-10 pr-4 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            {/* Date Input */}
            <div className="relative flex-1">
              <SlCalender  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none"
              />
              
               
              <input
                type="date"
                className="w-full mt-2 mb-2 pl-10 pr-4 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            </div>
            
          

          <div className="flex justify-center gap-5">
            <Button
             
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="px-6 py-2 rounded-md border border-gray-400 shadow  text-gray-700 hover:bg-green-800 transition"
            >
              <TfiMapAlt  />
              {showMap ? "Hide Map" : "Show Map"}
            </Button>
          </div>

          {/* Map Container */}
          {showMap && (
            <div className="container mx-auto px-6 pb-4">
              <div className="w-full h-64 bg-gray-300 flex items-center justify-center rounded-md">
                <span>[Map placeholder]</span>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Filters */}
      <div className="mt-6 mb-6">
        <div className="container gap-2 px-9 py-4 flex justify-center   flex-wrap">
          {[
            "Any price",
            "Amenities",
            "Brands",
            "Top rated clinics",
            "Express offers",
            "Listing",
          ].map((filter, i) => (
            <Button

              key={i}
              className="px-4 py-2 rounded-xl bg-white text-gray-700 border border-gray-600 text-sm"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Clinics List */}
      <div className="container mx-auto px-6 space-y-6">
        {clinics.map((clinic) => (
          <ClinicCard
            key={clinic.id}
            name={clinic.name}
            location={clinic.location}
            price={clinic.price}
          />
        ))}
      </div>
    </>
  );
};
