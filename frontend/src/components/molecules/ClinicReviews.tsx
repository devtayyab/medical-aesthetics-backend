import React from "react";
import ClinicReviewsCard from "@/components/molecules/ClinicReviewsCard";
import { Link } from "react-router-dom";
import { MoveUpRight } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { Clinic } from "@/types";
import location from "@/assets/location.png";
import ClinicImg1 from "@/assets/TopRatedClinicImg.svg";
// import { MapPin, Phone, Mail } from "lucide-react";

type FilterOption = {
  stars: number;
  count: number;
};

type ClinicReviewsProps = {
  clinicId: string;
};

const ClinicReviews: React.FC<ClinicReviewsProps> = ({ clinicId }) => {
  const { selectedClinic, clinics } = useSelector(
    (state: RootState) => state.client
  );
  const clinicData = selectedClinic ||
    clinics.find((c) => c.id === clinicId) || {
      id: clinicId,
      name: "Default Clinic",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      phone: "",
      email: "",
    };

  const filters: FilterOption[] = [
    { stars: 5, count: 409 },
    { stars: 4, count: 2 },
    { stars: 3, count: 0 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ];

  const reviews = [
    {
      rating: 5,
      review:
        "Lorem ipsum dolor sit amet consectetur. Faucibus amet neque nec tristique. Rhoncus sit porttitor sit vulputate blandit. Nisi eget bibendum ornare",
      treatedBy: "Dr. Nicola",
      treatmentType: "Hair Transplant",
      author: "James Collins",
    },
    {
      rating: 5,
      review:
        "Lorem ipsum dolor sit amet consectetur. Faucibus id nunc odio consectetur enim neque at posuere.",
      treatedBy: "Dr. Nicola",
      treatmentType: "Hair Transplant",
      author: "Ava Thompson",
    },
    {
      rating: 5,
      review:
        "Lorem ipsum dolor sit amet consectetur. Eget enim malesuada arcu adipiscing.",
      treatedBy: "Dr. Nicola",
      treatmentType: "Hair Transplant",
      author: "Olivia Rodriguez",
    },
    {
      rating: 5,
      review:
        "Lorem ipsum dolor sit amet consectetur. Suscipit sit habitasse pellentesque in volutpat posuere.",
      treatedBy: "Dr. Nicola",
      treatmentType: "Hair Transplant",
      author: "Michael Carter",
    },
  ];

  // Nearby clinics (excluding the current clinic)
  const nearbyClinics = clinics.filter((c) => c.id !== clinicId).slice(0, 3); // Limit to 3

  return (
    <div>
      <div id="reviews" className="flex flex-col p-4 pl-0 space-y-1">
        <h2 className="text-xl text-black font-bold">Venue Reviews</h2>
        <div className="flex flex-row">
          <p className="flex text-6xl">4.0</p>
          <p className="text-yellow-500 text-lg flex flex-col ml-2">
            ★★★★☆
            <span className="text-sm text-gray-400 ml-18">432 reviews</span>
          </p>
        </div>
      </div>
      <hr />

      <div>
        <div className="mt-2 flex justify-between gap-3 py-6">
          {/* Filters Section */}
          <div className="bg-white w-1/4 h-max shadow rounded-lg p-4">
            <h3 className="font-semibold mb-2">Filter by treatment</h3>
            <select className="w-full border rounded p-2 mb-4">
              <option>All Treatments</option>
              <option>Hair Transplant</option>
              <option>Facial Treatment</option>
            </select>
            <h3 className="font-semibold mb-2">Filter by rating</h3>
            <div className="space-y-2">
              {filters.map((filter) => (
                <label key={filter.stars} className="flex items-center gap-2">
                  <input type="checkbox" className="form-checkbox" />
                  <span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-yellow-400 ${
                          i < filter.stars ? "opacity-100" : "opacity-30"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </span>
                  <span className="text-sm text-gray-600">{filter.count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="w-3/4 rounded-lg">
            {reviews.map((review, index) => (
              <ClinicReviewsCard key={index} {...review} />
            ))}

            <div className="flex justify-center mt-6">
              <button className="px-6 py-2 rounded-lg border text-green-600 border-green-600 bg-white-200 transition">
                Read More
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="about" className="pt-10">
        <h2 className="font-bold text-2xl mb-3">About</h2>
        <div className="flex gap-6 mb-16">
          {/* <div className="w-1/2">
            <img
              src="https://via.placeholder.com/400x300"
              alt="Map Preview"
              className="w-full h-[300px] object-cover rounded-lg"
            />
          </div>
          <div className="w-1/2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="text-gray-600" size={20} />
              <span className="text-lg font-semibold text-gray-800">
                {clinicData.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="text-gray-600" size={20} />
              <span className="text-gray-700">
                {clinicData.address.street}, {clinicData.address.city},{" "}
                {clinicData.address.state}, {clinicData.address.zipCode},{" "}
                {clinicData.address.country}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="text-gray-600" size={20} />
              <span className="text-gray-700">{clinicData.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="text-gray-600" size={20} />
              <span className="text-gray-700">{clinicData.email}</span>
            </div>
          </div> */}
          <img src={location} className="w-full" />
        </div>
        <div className="w-full flex mt-16 mb-16 gap-9">
          <div className="flex flex-col">
            <p className="w-full text-lg">
              {/* {clinicData.description ||
                "Lorem ipsum dolor sit amet consectetur. Arcu dui vivamus vel consectetur a. Sit mauris diam turpis libero maecenas consectetur lacus. Cras amet at feugiat at a leo. Consectetur nulla vestibulum sit fringilla lacinia cursus tupis. Lorem ipsum doolor sit amet consectetur. Arcu dui vivamus vel consectetur a. Sit mauris diam turpis libero maecenas consectetur lacus. Cras amet at feugiat at a leo. Consectetur nulla vestibulum sit fringilla lacinia cursus tupis. Lorem ipsum dolor sit amet consectetur. Arcu dui vivamus vel consectetur a. Sit mauris diam turpis libero maecenas consectetur lacus. Cras amet at feugiat at a leo. Consectetur nulla vestibulum sit fringilla lacinia cursus tupis."} */}
              Lorem ipsum dolor sit amet consectetur. Arcu dui vivamus vel
              consectetur a. Sit mauris diam turpis libero maecenas consectetur
              lacus. Cras amet at feugiat at a leo. Consectetur nulla vestibulum
              sit fringilla lacinia cursus tupis. Lorem ipsum doolor sit amet
              consectetur. Arcu dui vivamus vel consectetur a. Sit mauris diam
              turpis libero maecenas consectetur lacus. Cras amet at feugiat at
              a leo. Consectetur nulla vestibulum sit fringilla lacinia cursus
              tupis. Lorem ipsum dolor sit amet consectetur. Arcu dui vivamus
              vel consectetur a. Sit mauris diam turpis libero maecenas
              consectetur lacus. Cras amet at feugiat at a leo. Consectetur
              nulla vestibulum sit fringilla lacinia cursus tupis.
            </p>
            <h2 className="font-semibold">Heading</h2>
            <p className="flex flex-col">
              Lorem ipsum dolor sit amet consectetur. Id cursus in sed veilt
              tincidunt at tempor
              <span>purus. Dictum et</span>
            </p>
            <h2 className="font-semibold flex flex-col">Heading</h2>
            <p className="flex flex-col">
              Lorem ipsum dolor sit amet consectetur. Id cursus in sed veilt
              tincidunt at tempor
              <span>purus. Dictum et</span>
            </p>
          </div>
          <div className="flex flex-row gap-9">
            <ul className="flex flex-col list-disc list-outside pl-6 marker:text-green-600 text-black">
              <li>Monday</li>
              <li>Tuesday</li>
              <li>Wednesday</li>
              <li>Thursday</li>
              <li>Friday</li>
              <li>Saturday</li>
              <li className="text-gray-500">Sunday</li>
            </ul>
            <div className="flex flex-col">
              <h4 className="w-full whitespace-nowrap">
                {clinicData.businessHours?.monday.open || "8:00 AM"} -{" "}
                {clinicData.businessHours?.monday.close || "8:00 PM"}
              </h4>
              <h4 className="w-full whitespace-nowrap">
                {clinicData.businessHours?.tuesday.open || "8:00 AM"} -{" "}
                {clinicData.businessHours?.tuesday.close || "8:00 PM"}
              </h4>
              <h4 className="w-full whitespace-nowrap">
                {clinicData.businessHours?.wednesday.open || "8:00 AM"} -{" "}
                {clinicData.businessHours?.wednesday.close || "8:00 PM"}
              </h4>
              <h4 className="w-full whitespace-nowrap">
                {clinicData.businessHours?.thursday.open || "8:00 AM"} -{" "}
                {clinicData.businessHours?.thursday.close || "8:00 PM"}
              </h4>
              <h4 className="w-full whitespace-nowrap">
                {clinicData.businessHours?.friday.open || "8:00 AM"} -{" "}
                {clinicData.businessHours?.friday.close || "8:00 PM"}
              </h4>
              <h4 className="w-full whitespace-nowrap">
                {clinicData.businessHours?.saturday.open || "8:00 AM"} -{" "}
                {clinicData.businessHours?.saturday.close || "8:00 PM"}
              </h4>
              <h4 className="w-full whitespace-nowrap text-gray-500">
                {clinicData.businessHours?.sunday.isOpen
                  ? `${clinicData.businessHours.sunday.open} - ${clinicData.businessHours.sunday.close}`
                  : "Closed"}
              </h4>
            </div>
          </div>
        </div>
        <div className="border-2 p-5 border-gray-200 rounded-[16px]">
          <h2 className="font-bold text-[20px] mb-5">Clinics nearby</h2>
          {nearbyClinics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyClinics.map((clinic) => (
                <div
                  key={clinic.id}
                  className="bg-white shadow-md rounded-lg overflow-hidden"
                >
                  <img
                    src={ClinicImg1}
                    alt={clinic.name}
                    className="w-full h-[200px] object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {clinic.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {calculateDistance(clinic.address.city)} km away
                    </p>
                    <div className="flex items-center mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-yellow-400 ${
                            i < Math.round(clinic.rating || 0)
                              ? "opacity-100"
                              : "opacity-30"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                      <span className="ml-1 text-sm text-gray-600">
                        {clinic.rating?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                    <Link
                      to={`/clinic/${clinic.id}`}
                      className="text-[#203400] flex flex-row font-medium text-sm mt-3 items-center gap-1"
                    >
                      View Details
                      <MoveUpRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No nearby clinics available.</p>
          )}
          <Link
            to="/"
            className="text-[#203400] flex flex-row font-medium text-sm mt-5"
          >
            Other Clinics in Barnes, London
            <span className="text-green-900">
              <MoveUpRight size={16} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Placeholder function to calculate distance (replace with actual geolocation logic)
const calculateDistance = (city: string) => {
  // Simple hardcoded distances based on city (replace with real calculation)
  const distances = {
    Barnes: 5,
    "Los Angeles": 10,
  };
  return distances[city] || 0;
};

export default ClinicReviews;
