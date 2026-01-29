import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchUserAppointments, submitReview } from "@/store/slices/clientSlice";
import { ReviewForm } from "@/components/molecules/ReviewForm";
import { Button } from "@/components/atoms/Button/Button";
import { Card } from "@/components/atoms/Card/Card";
import { format } from "date-fns";
import { Star, Clock, MapPin } from "lucide-react";

export const Reviews: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, isLoading } = useSelector((state: RootState) => state.client);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchUserAppointments());
  }, [dispatch]);

  // Filter for completed appointments
  const completedAppointments = appointments.filter(
    (apt) => apt.status === "completed"
  );

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!selectedAppointment) return;

    try {
      await dispatch(submitReview({
        clinicId: selectedAppointment.clinicId,
        data: {
          rating,
          comment,
          appointmentId: selectedAppointment.id
        }
      })).unwrap();

      setSuccessMessage("Thank you! Your feedback has been submitted.");
      setSelectedAppointment(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading your visit history...</div>;
  }

  const handleSelectAppointment = (apt: any) => {
    console.log("Opening review form for:", apt.id);
    setSelectedAppointment(apt);
    // Scroll to top to ensure the user sees the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {selectedAppointment ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fadeIn">
          <div className="bg-gray-50 p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Share Your Experience</h2>
            <button
              onClick={() => setSelectedAppointment(null)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="p-8">
            <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {selectedAppointment.service?.name}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin size={16} className="mr-1 text-blue-500" />
                  {selectedAppointment.clinic?.name}
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="mr-1 text-blue-500" />
                  {format(new Date(selectedAppointment.startTime), "MMMM d, yyyy")}
                </div>
              </div>
            </div>

            <ReviewForm onSubmit={handleSubmitReview} />
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reviews & Feedback</h1>
          <p className="text-gray-600 mb-8">Share your experience to help us improve.</p>

          {successMessage && (
            <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <Star className="fill-green-700 text-green-700" size={18} />
              {successMessage}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {completedAppointments.length === 0 ? (
              <div className="col-span-full bg-gray-50 rounded-xl p-12 text-center border border-gray-100">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No completed visits yet</h3>
                <p className="text-gray-500 mt-1">Once you complete an appointment, you can leave feedback here.</p>
              </div>
            ) : (
              completedAppointments.map((apt) => (
                <Card key={apt.id} className="p-6 transition-all hover:shadow-lg border border-gray-100 flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                        Completed
                      </div>
                      <span className="text-sm text-gray-400">
                        {format(new Date(apt.startTime), "MMM d")}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {apt.service?.name || "Service"}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin size={14} className="mr-1" />
                      {apt.clinic?.name || "Clinic"}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => handleSelectAppointment(apt)}
                      className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-black transition-all shadow-sm active:transform active:scale-95"
                    >
                      <Star size={18} className="text-yellow-400 fill-yellow-400" />
                      Rate & Review
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
