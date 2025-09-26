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
    <div className="flex flex-col">
      {/* Top row */}
      <div className="flex justify-between  items-center w-full">
        {/* Left side */}
        <div className="flex flex-col">
          <h2 className="text-black font-medium mt-4 text-xl ">Botteqa Clinic</h2>
          <p className="flex flex-row  ">
            4.0{" "}
            <span className="flex flex-row items-center text-yellow-500 text-sm">
              ★★★★☆
            </span>
          </p>
        </div>
  {/* Right side */}
    <div className="flex flex-row gap-1">
  <Button className="px-2 py-0.5 text-xs text-black bg-white border border-blue-900 hover:!bg-blue-950 hover:!text-white">
    Book Now
  </Button>
  <Button className="px-2 py-0.5 text-xs text-black bg-white border border-blue-900 hover:!bg-blue-950 hover:!text-white">
    Reviews
  </Button>
  <Button className="px-2 py-0.5 text-xs text-black bg-white border border-blue-900 hover:!bg-blue-950 hover:!text-white">
    About
  </Button>
</div>


      </div>

      {/* Image */}
      <div className="mt-6 flex justify-center">
        <div className="w-full max-w-5xl">
          <img src={clinic} alt="Clinic" className="w-full rounded-lg shadow-md" />
          <p className="flex flex-row items-center text-gray-700">
            <FaLocationDot className="mr-2 text-green-600" />
            Show on map
          </p>
          <p className="flex flex-row items-center text-gray-700">
            <FaClock className="mr-2 text-green-600" />
            Open Hours
          </p>
          <p className="text-green-600 font-medium">%Off peak</p>
           <h2 className=" flex text-2xl font-bold text-black mt-1 ">
        Matching your search
      </h2>
      
      {/* Services */}
       <div>
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
         {/* <ClinicReviews /> */}
      </div>
     
  <h2 className=" flex flex-col text-2xl gap-16 font-medium text-black mt-6  ">
        Now what are you looking for ?<span className=" flex  font-bold text-black ">Browse Services</span>
       </h2>
      
         
     {/* Services */}
       <div  className="space-y-6 whitespace-nowrap mt-16">
        <h3 className='text-lg
         text-green-500 text-end '>Some of these services contain OFF peaks discounts
          </h3>
         
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
        <div className="flex flex-col gap-9 font-normal text-2xl mb-20  ">
      <h3>Dermatology(3)</h3>
      <h3>Dermatology(3)</h3>
      <h3>Dermatology(3)</h3>
      <h3>Dermatology(3)</h3>
      <h3>Dermatology(3)</h3>
      <h3>Dermatology(3)</h3>
      <h3>Dermatology(3)</h3>
      
      </div>
        
        
         <ClinicReviews />
          
         
         </div>
        </div>
        
      </div>
    

  );
};

export default Clinic;
