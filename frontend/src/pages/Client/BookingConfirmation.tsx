import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { FaCheck, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaArrowLeft } from "react-icons/fa";

interface Appointment {
  id: string;
  clinicId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  clientDetails?: {
    fullName: string;
    email: string;
    phone: string;
  };
}

const BookingConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get appointment data from location state
    if (location.state?.appointment) {
      setAppointment(location.state.appointment);
    } else {
      // If no appointment data, redirect to search
      navigate('/search');
    }
    setIsLoading(false);
  }, [location.state, navigate, isLoading]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking confirmation...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find your booking information.</p>
          <Link to="/search">
            <Button className="bg-lime-400 text-black hover:bg-lime-500">
              Search for Clinics
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft />
            <span>Back to Search</span>
          </Link>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <FaCheck className="text-green-600 text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your appointment has been successfully booked.</p>
        </div>

        {/* Booking Details Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Appointment Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Appointment Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FaCalendarAlt className="text-lime-400 text-xl" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(appointment.startTime)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <FaClock className="text-lime-400 text-xl" />
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-lime-400 text-xl" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">Clinic ID: {appointment.clinicId}</p>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800 mb-2">Your Information</h3>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{appointment.clientDetails?.fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{appointment.clientDetails?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{appointment.clientDetails?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {appointment.notes && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium text-gray-800 mb-2">Booking Notes</h3>
              <p className="text-gray-600">{appointment.notes}</p>
            </div>
          )}
        </Card>

        {/* Next Steps */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-black text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Confirmation Email</p>
                <p className="text-sm text-gray-600">You'll receive a confirmation email with all the details.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-black text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Appointment Reminder</p>
                <p className="text-sm text-gray-600">We'll send you a reminder 24 hours before your appointment.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-black text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Arrival</p>
                <p className="text-sm text-gray-600">Please arrive 10 minutes early for your appointment.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/appointments" className="flex-1">
            <Button className="w-full bg-lime-400 text-black hover:bg-lime-500">
              View My Appointments
            </Button>
          </Link>
          <Link to="/search" className="flex-1">
            <Button variant="outline" className="w-full border-black text-black hover:bg-gray-100">
              Book Another Appointment
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
