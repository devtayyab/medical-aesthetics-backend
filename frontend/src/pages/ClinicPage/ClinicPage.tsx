import React from "react";
import { Button } from "@/components/atoms/Button/Button";
import clinic from "@/assets/clinic.png";
import { FaLocationDot } from "react-icons/fa6";
import { FaClock } from "react-icons/fa";
import ClinicInfo from "@/components/molecules/ClinicInfo";
import ClinicReviews from '@/components/molecules/ClinicReviews'

 const services = [
  {
    id: 1,
    title: "Glossy Blow Dry",
    duration: "1 hr",
    description:"Show details",
    price: "67$",
    discount: "save up to 90%",
  },
  {
    id: 2,
     title: "Glossy Blow Dry",
    duration: "1 hr",
     description:"Show details",
    price: "67$",
    discount: "save up to 90%",
   
  },
  {
    id: 3,
     title: "Glossy Blow Dry",
    duration: "1 hr",
     description:"Show details",
    price: "67$",
    discount: "save up to 90%",
  },
];
 export  const Clinic: React.FC = () => {
   return (
    <div className="flex flex-col w-full ">
      {/* Top row */}
      <div className="flex flex-col md:flex-row justify-between items-center ml-2  md:px-44 ">
        {/* Left side */}
        <div className="flex flex-col w-full  ">
          <h2 className="  text-black  pt-9 font-semibold items-center text-2xl ">Botox Treatment</h2>
          <p className="flex items-center text-xl   text-yellow-500 gap-2 ">
            4.0
            <span className=" text-yellow-500 text-xl">
              ★★★★☆
            </span>
          </p>
        </div>
  {/* Right side */}
    <div className="flex flex-nowwrap gap-3 md:mt-0">
  <Button className="  px-6 py-3   rounded-xl text-xs text-black bg-white border border-blue-900 hover:!bg-blue-950 hover:!text-white">
    Book Now 
  </Button>
  <Button className="  px-6 py-3   rounded-xl text-xs text-black bg-white border border-blue-900 hover:!bg-blue-950 hover:!text-white">
    Reviews
  </Button>
  <Button className="px-6 py-3  text-xs rounded-xl  text-black bg-white border border-blue-900 hover:!bg-blue-950 hover:!text-white">
    About
  </Button>
</div>


      </div>

      {/* Image */}
      <div className="mt-4 flex flex-col items-center px-4 md:px-12">
        <div className="w-full max-w-6xl">
          <img src={clinic} alt="Clinic" className="w-full rounded shadow-md" />
          <p className="flex items-center gap-3  mt-4 text-gray-700">
            <FaLocationDot   className="h-6 text-green-600" />
            Show on map
          </p>
          <p className="flex flex-row items-center text-gray-700  mt-2 gap-3">
            <FaClock className=" h-6  text-green-600" />
            Open Hours
          </p>
          <p className="text-green-600 font-medium  mt-2">%Off peak</p>
        <div className="flex flex-col w-full max-w-6xl mx-auto px-4 md:px-12 mt-8 gap-12">
 <div className=" justify-between">
  <div className="flex">
    <h2 className="text-xl md:text-2xl mb-4 font-bold text-black">
      Matching your search
    </h2>
  </div>

  {/* Services list */}
  <div className="flex md:flex-col md:flex-wrap justify-between gap-2">
    {services.map((service) => (
      <ClinicInfo
        key={service.id}
        id={service.id}
        title={service.title}
        duration={service.duration}
        description={service.description}
        discount={service.discount}
        price={service.price}
      />
    ))}
  </div>
</div>
</div>

      
      <div className="flex flex-col md:flex-row justify-between w-full max-w-6xl mx-auto   mt-4 gap-12">
       <div className="flex flex-col">
  <h2 className=" flex flex-col text-2xl   font-normal text-black  ">
        Now what are you looking for ?<span className="  font-semibold  text-black ">Browse Services</span>
       </h2>
     <div className="flex flex-col mt-16 mb-20 gap-4 font-normal text-lg">
      <h3 >Dermatology(3)</h3>
      <h3>Dermatology(3)</h3>
      <h3>Dermatology(3)</h3>
      <h3>Dermatology(3)</h3>
      <h3>Dermatology(3)</h3>
      <h3>Dermatology(3)</h3>
      <h3>Dermatology(3)</h3>
      </div>
       </div>       
     {/* Services */}
       <div  >
        <h3 className='text-lg text-green-500 whitespace-nowrap pr-24 mt-12 mb-4 text-end '>Some of these services contain OFF peaks discounts
          </h3>
       <div className="flex flex-col md:flex-col md:flex-wrap justify-between gap-2"> 
      {services.map((service) => (
          <ClinicInfo
           key={service.id}
            id={service.id}
            title={service.title}
            duration={service.duration}
             description={service.description}
            discount={service.discount}
            price={service.price}
          />
         
        ))}
        </div> 
        
        </div>
        </div>
         
        
      
        
       
         <ClinicReviews />
         
          
         
         </div>
        </div>
      </div>
  );
};

export default Clinic;
