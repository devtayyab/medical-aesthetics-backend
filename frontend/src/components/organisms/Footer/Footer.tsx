import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";

function Footer() {
  return (
   <div className=" bg-gray-900 max-w-full px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-10">
        {/* Left Side */}
        <div className="max-w-md">
          <h1 className="text-[#CBFF38] text-2xl font-bold">
            med<span className="text-white">logo</span>
          </h1>
          <p className="text-white text-sm mt-3">
            Our platform makes it easy to discover and book trusted medical
            aesthetics treatment from dermatology to plastic surgery. Compare
            clinics, explore services and schedule your appointments with
            confidence — all in one place.
          </p>
        </div>

        {/* Right Side */}
        <div className="flex gap-12">
            {/* overview */}
          <div>
            <h2 className="text-[#CBFF38] font-semibold mb-2">Overview</h2>
            <ul className="text-gray-300 space-y-1">
              <li className="text-white text-sm">Medicines</li>
              <li className="text-white text-sm">Healthcare Devices</li>
              <li className="text-white text-sm">Health Progress</li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h2 className="text-[#CBFF38] font-semibold mb-2">Company</h2>
            <ul className="text-gray-300 space-y-1">
              <li className="text-white text-sm">Home</li>
              <li className="text-white text-sm">About Us</li>
              <li className="text-white text-sm">Services</li>
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h2 className="text-[#CBFF38] font-semibold mb-2">Explore</h2>
            <ul className="text-gray-300 space-y-1">
              <li className="text-white text-sm">Blogs and Feeds</li>
              <li className="text-white text-sm">Privacy Policies</li>
              <li className="text-white text-sm">Cookies</li>
            </ul>
          </div>
        </div>
      </div>
      <hr className="border--700 my-6" />

      {/* Second Row */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        
        <div className="flex gap-4">
          <div className="border-4 border-white bg-white text-black px-3 py-1 rounded">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
              f
            </a>
          </div>
          <div className="border-4 border-white bg-white text-black px-3 py-1 rounded">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              X
            </a>
          </div>
          <div className="border-4 border-white bg-white text-black px-3 py-1 rounded">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              in
            </a>
          </div>
        </div>

      
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto max-w-md">
          <Input
            type="text"
            placeholder="Enter your email right here"
            className="flex-1"
          />
          <Button>Subscribe</Button>
        </div>
      </div>
    </div>
  );
}

export default Footer;
