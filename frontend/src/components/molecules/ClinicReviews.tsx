import React from "react";
import ClinicReviewCard from "@/components/molecules/ClinicReviewsCard";
import location from "@/assets/location.png";
import image from "@/assets/image.png";
import { Link } from "react-router-dom";
import {MoveUpRight} from "lucide-react";
type FilterOption = {
  stars: number;
  count: number;
};

const ClinicReviews: React.FC = () => {
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

  return (
    <div >
      <div className="flex flex-col mt-4 gap-2 ">
        <h2 className="text-xl text-black font-bold">Venue Reviews</h2>
        <div className="flex flex-row">
          <p className= "flex  text-6xl">4.0</p>
          <p className="text-yellow-500 text-lg flex flex-col ml-2">★★★★☆
          <span className="text-sm text-gray-400 ml-18">432 reviews</span>
          </p>
           </div>
           
      </div>
      <hr  className="my-6" />

      <div>
  <div className=" flex md:flex-row space-x-4  ">
    {/* Filters Section */}
    <div className="bg-white w-[428px] h-72  rounded-lg p-2">
      <h3 className="font-semibold mb-2">Filter by treatment</h3>
      <select className=" border rounded pl-2 pr-2  mb-4">
        <option >All Treatments</option>
        <option>Hair Transplant</option>
        <option>Facial Treatment</option>
      </select>
      <h3 className="font-semibold mb-2">Filter by rating</h3>
      <div>
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
    <div className=" w-full h-auto md:col-span-3 rounded-lg ">
      {reviews.map((review, index) => (
        <ClinicReviewCard key={index} {...review} />
      ))}

      <div className="flex justify-center mt-6">
        <button className="px-6 py-2 rounded-lg border text-green-600 border-green-600 bg-white-200 transition">
          Read More
        </button>
      </div>
    </div>
  </div>
</div>

      <div>
        <h2 className="font-bold text-2xl ">About </h2>
        <div>
          <img src={location} className="w-full rounded-lg mt-2 mb-6 " />
        </div>
        <div className="flex flex-col lg:flex-row gap-12">
          <div className=" flex-1 flex flex-col gap-2">
        <p className="leading-relaxed text-lg ">
          Lorem ipsum dolor sit amet consectetur.Arcu dui vivamus vel
          consectetur a.Sit mauris diam turpis libero maecenas consectetur
          lacus.Cras amet at feugiat at a leo.Consectetur nulla vestibulum sit
          fringilla lacinia cursus tupis.Lorem ipsum doolor sit amet
          consectetur. Arcu dui vivamus vel consectetur a.Sit mauris diam turpis
          libero maecenas consectetur lacus..Cras amet at feugiat at a
          leo.Consectetur nulla vestibulum sit fringilla lacinia cursus
          tupis.Lorem ipsum dolor sit amet consectetur.Arcu dui vivamus vel
          consectetur a.Sit mauris diam turpis libero maecenas consectetur
          lacus.Cras amet at feugiat at a leo.Consectetur nulla vestibulum sit
          fringilla lacinia cursus tupis.
        </p>
        <h2 className="font-semibold">Heading</h2>
       <p className="flex flex-col">Lorem ipsum dolor sit amet consectetur.Id cursus in sed veilt tincidunt at tempor<span> purus.Dictum et </span></p>
        <h2 className="font-semibold flex flex-col">Heading</h2>
        <p className="flex flex-col">Lorem ipsum dolor sit amet consectetur.Id cursus in sed veilt tincidunt at tempor<span> purus.Dictum et </span></p>
        </div>
        <div className="flex flex-row gap-9">
  <ul className=" flex flex-col list-disc list-outside pl-6 marker:text-green-600 text-black">
    <li >Monday</li>
    <li>Tuesday</li>
    <li>Wednesday</li>
    <li>Thursday</li>
    <li>Friday</li>
    <li>Saturday</li>
    <li className="text-gray-500" >Sunday</li>
  </ul>
<div className="flex flex-col">
  <h4 className=" whitespace-nowrap">8:00 AM - 8:00 PM</h4>
  <h4 className=" whitespace-nowrap">8:00 AM - 8:00 PM</h4>
  <h4 className="whitespace-nowrap">8:00 AM - 8:00 PM</h4>
  <h4 className="whitespace-nowrap">8:00 AM - 8:00 PM</h4>
  <h4 className=" whitespace-nowrap">8:00 AM - 8:00 PM</h4>
  <h4 className="whitespace-nowrap">8:00 AM - 8:00 PM</h4>
  <h4 className=" whitespace-nowrap text-gray-500 ">Closed</h4>
  </div>
</div>

      
        </div>
            <div className="mt-16 w-full border border-gray-200 rounded-lg p-4">
          <h2 className="font-bold text-xl mb-2">Clinics nearby</h2>
          <img src={image} className="w-full rounded-lg " />
          <Link to='/' className="text-green-900 flex flex-row font-medium  text-sm mt-2" >Other Clinics in Barnes,London
        <span className="text-green-900 "> <MoveUpRight  size={16}/></span> 
         </Link>
        </div>
      </div>
    </div>
  );
};

export default ClinicReviews;
