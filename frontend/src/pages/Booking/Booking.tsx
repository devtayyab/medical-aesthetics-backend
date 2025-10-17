import { useState } from "react";

import { Button } from "@/components/atoms/Button/Button";
import ClinicCard from "@/components/molecules/BookingCard/ClinicCard"
import { IoSearchSharp } from "react-icons/io5";
import { LuMapPin } from "react-icons/lu";
import CardDetails from "@/components/molecules/BookingCard/CardDetails";


const clinics = [
  {
    id: 1,
    name: "Hyalouronic Acid",
    location: "Lahore, Pakistan",
    price: 1,
  },
  {
    id: 2,
    name: "Hyalouronic Acid",
    location: "Lahore, Pakistan",
    price: 1,
  },

];
const cards = [
  {
    id: 1,
    name: " Botox Treatment",
    location: "Lahore, Pakistan",
    price: 1,
  },

];

export const Booking: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("searching for:", searchQuery, "in", location);
  };

  return (
    <>
      <div className=" w-full h-[250px] flex items-center justify-center  bg-gray-600 -top-[11px] ">
        <form onSubmit={handleSearch} className="flex flex-col w-full gap-4 px-4">
          <div className=" bg-white w-auto mx-auto my-2 h-auto opacity-100 rounded-xl p-6  ">
            <div className="flex flex-col md:flex-row w-full gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <IoSearchSharp
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Find Treatment"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gray-600"
                />
              </div>

              {/* Location Input */}
              <div className="relative flex-1">
                <LuMapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Find Clinic"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>
          </div>
        </form>
      </div>


      {/* Filters */}
      <div className="px-4 py-6">
        <div className="flex flex-wrap gap-4  justify-center ">
          {[
            "By price",
            "Top rated treatments",
            "Most Booked this week",
            "Rating",
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
      <div className="container ">
        {cards.map((card) => (
          <CardDetails
            key={card.id}
            name={card.name}
            location={card.location}
            price={card.price}
          />
        ))}
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
