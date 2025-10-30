import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchClinicById,
  fetchClinicServices,
  clearSelectedClinic,
} from "@/store/slices/clientSlice";
import { addService, removeService } from "@/store/slices/bookingSlice";
import ClinicInfo from "@/components/molecules/ClinicInfo";
import ClinicReviews from "@/components/molecules/ClinicReviews";
import { ServiceCard } from "@/components/molecules/ServiceCard/ServiceCard";
import type { RootState, AppDispatch } from "@/store";
import type { Clinic, Service } from "@/types";
import { Button } from "@/components/atoms/Button/Button";
import { css } from "@emotion/css";
import { Star } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";
import BotoxImg from "@/assets/Botox.jpg";

const fullWidthContainerStyle = css`
  position: relative;
  width: 100%;
`;

const detailContainerStyle = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 2rem;
`;

const headerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const titleContainerStyle = css`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const titleStyle = css`
  font-size: 2rem;
  font-weight: bold;
  color: #333;
`;

const ratingStyle = css`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #efb008;
  font-weight: 500;
  margin-bottom: 20px;
`;

const tabsStyle = css`
  display: flex;
  gap: 1rem;
`;

const tabButtonStyle = css`
  background: #ffffff;
  color: #2d3748;
  border-radius: 12px;
  padding: 12px 22px;
  border: 1px solid #2d3748;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: #2d3748 !important;
    color: #ffffff !important;
  }
`;

const imageStyle = css`
  width: 100%;
  height: 500px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const infoStyle = css`
  width: 100%;
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  // padding: 1rem;
  border-radius: 8px;
`;

const servicesStyle = css`
  margin: 2rem 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  padding: 1rem;
  border-radius: 8px;
`;

const serviceHeaderStyle = css`
  width: 40%;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
  padding-right: 1rem;
`;

const serviceCardsStyle = css`
  width: 55%;
  display: flex;
  flex-direction: column;
  gap: 10px;
   padding-left: 1rem;
`;

const waveSectionStyle = css`
  background-color: #f0f8ff;
  padding: 2rem;
  border-radius: 8px;
  margin: 2rem 0;
  text-align: center;
  color: #2d3748;
`;

const reviewsStyle = css`
  margin: 2rem 0;
  position: relative;
`;

const layeredBGStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100%;
  background-image: url(${LayeredBG});
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
  z-index: -1;
  transform: translateX(-50%);
  left: 50%;
`;

export const ClinicDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { selectedClinic, services, isLoading, error, clinics } = useSelector(
    (state: RootState) => state.client
  );
  const { selectedServices } = useSelector((state: RootState) => state.booking);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (id) {
      dispatch(fetchClinicById(id));
      dispatch(fetchClinicServices(id));
    }
    return () => {
      dispatch(clearSelectedClinic());
    };
  }, [dispatch, id]);

  const clinicData = selectedClinic || clinics.find((c) => c.id === id);
  const serviceData =
    services.length > 0 ? services : clinicData?.services || [];

  if (isLoading) return <div className="p-4 text-gray-500">Loading...</div>;
  if (error && !clinicData)
    return <div className="p-4 text-red-500">{error}</div>;
  if (!clinicData)
    return <div className="p-4 text-gray-500">Clinic not found.</div>;

  // Map Clinic data to ClinicInfo props
  const clinicInfoProps = {
    title: clinicData.name,
    duration: `${clinicData.services[0]?.durationMinutes || 30} min`, // Fallback duration
    description: clinicData.description,
    discount: "10% off-peak", // Hardcoded for now, adjust based on data
    price: `$${clinicData.services[0]?.price || 0}`, // Fallback price
    id: parseInt(clinicData.id), // Convert string id to number
  };

  const handleAddService = (service: Service) => {
    dispatch(addService(service));
  };

  const handleRemoveService = (serviceId: string) => {
    dispatch(removeService(serviceId));
  };

  const handleBookNow = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/clinic/${id}`);
      return;
    }

    if (selectedServices.length > 0 && clinicData) {
      const serviceIds = selectedServices.map((s) => s.id).join(",");
      navigate(
        `/appointment/booking?clinicId=${clinicData.id}&serviceIds=${serviceIds}`
      );
    }
  };

  const rating = clinicData.rating ?? 0;
  const reviewCount = clinicData.reviewCount ?? 0;

  return (
    <div className={fullWidthContainerStyle}>
      <div className={detailContainerStyle}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6">
          {/* Clinic Name */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {clinicData.name}
          </h2>

          {/* Tabs / Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              onClick={handleBookNow}
              className="bg-[#2d3748] text-white border border-[#2d3748] hover:!bg-transparent hover:text-[#2d3748] px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition"
            >
              Book Now
            </Button>

            <a
              href="#reviews"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm sm:text-base hover:bg-gray-100 transition"
            >
              Reviews
            </a>

            <a
              href="#about"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm sm:text-base hover:bg-gray-100 transition"
            >
              About
            </a>
          </div>
        </div>

        {rating > 0 && (
          <div className={ratingStyle}>
            <span className="text-[18px] mr-1">{rating.toFixed(1)}</span>
            <div className="flex items-center gap-1 text-[14px] text-gray-700 font-medium">
              {[...Array(4)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  fill={i < Math.round(rating) ? "#EFB008" : "#D7DAE0"}
                  stroke="none"
                />
              ))}
              <Star size={20} fill="#D7DAE0" stroke="none" />
              {reviewCount > 0 && (
                <span className="ml-3 text-gray-400">
                  {reviewCount} reviews
                </span>
              )}
            </div>
          </div>
        )}
        <span>
          <div className={`-top-[25%] -scale-x-100 left-0 ${layeredBGStyle}`} />
          <img
            src={
              clinicData.images?.[0] || BotoxImg
              // "https://images.pexels.com/photos/263201/pexels-photo-263201.jpeg"
            }
            alt={clinicData.name}
            className={`${imageStyle}`}
          />
          <div className={infoStyle}>
            <ClinicInfo {...clinicInfoProps} />
          </div>
          <div className={servicesStyle}>
            <h3 className={serviceHeaderStyle}>Your Treatment Options</h3>
            <div className={serviceCardsStyle}>
              {serviceData.map((service: Service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={selectedServices.some((s) => s.id === service.id)}
                  onAdd={handleAddService}
                  onRemove={handleRemoveService}
                />
              ))}
            </div>
          </div>
        </span>
        {/* <div className={waveSectionStyle}>
          <h3>Not what you were looking for?</h3>
          <p>Browse services</p>
        </div> */}
        <div className={reviewsStyle}>
          <div
            className={`top-[15%] ${layeredBGStyle}`}
            style={{ backgroundSize: "contain" }}
          />
          <ClinicReviews clinicId={clinicData.id} ServiceData={serviceData} handleAddService={handleAddService} handleRemoveService={handleRemoveService} />
        </div>

      </div>
    </div>
  );
};
