import { useState } from "react";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import BookingCard from "@/components/molecules/BookingCard/BookingCard";
import { MapPin, Search, Calendar } from "lucide-react";

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
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search for treatments"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md text-black"
              />
            </div>

            {/* Location Input */}
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Enter postcode"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md text-black"
              />
            </div>

            {/* Date Input */}
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="date"
                className="w-full pl-10 pr-4 py-2 rounded-md text-black"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="px-6 py-2 rounded-md border border-gray-400 shadow  text-gray-700 hover:bg-green-800 transition"
            >
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
        <div className="container gap-9 px-9 py-4 flex   flex-wrap">
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
          <BookingCard
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
