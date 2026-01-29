import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchReviews, fetchReviewStatistics } from '../../store/slices/clinicSlice';
import clinicApi from '../../services/api/clinicApi';
import { Star, MessageSquare, Eye, EyeOff } from 'lucide-react';

const ReviewsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { reviews, reviewStats, isLoading } = useSelector((state: RootState) => state.clinic);

  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    dispatch(fetchReviews(undefined));
    dispatch(fetchReviewStatistics());
  }, [dispatch]);

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      await clinicApi.reviews.respond(reviewId, responseText);
      setRespondingTo(null);
      setResponseText('');
      dispatch(fetchReviews(undefined));
    } catch (error) {
      console.error('Failed to respond to review:', error);
      alert('Failed to send response. Please try again.');
    }
  };

  const handleToggleVisibility = async (reviewId: string) => {
    try {
      await clinicApi.reviews.toggleVisibility(reviewId);
      dispatch(fetchReviews(undefined));
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="text-gray-600 mt-2">Manage client feedback and reviews</p>
        </div>
      </div>

      {/* Statistics */}
      {reviewStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
            <p className="text-3xl font-bold text-gray-900">{reviewStats.totalReviews}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-gray-900">
                {reviewStats.averageRating.toFixed(1)}
              </p>
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
          {[5, 4, 3].map((rating) => (
            <div key={rating} className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">{rating} Stars</p>
              <p className="text-3xl font-bold text-gray-900">
                {reviewStats.distribution[rating] || 0}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-600">Reviews from clients will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-6">
              {/* Review Header */}
              <div className="flex flex-col md:flex-row items-start justify-between mb-4 gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-blue-600 font-semibold text-lg">
                      {review.client.firstName[0]}
                      {review.client.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.client.firstName} {review.client.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visibility Toggle */}
                <button
                  onClick={() => handleToggleVisibility(review.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors self-end md:self-auto"
                  title={review.isVisible ? 'Hide review' : 'Show review'}
                >
                  {review.isVisible ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Review Comment */}
              {review.comment && (
                <p className="text-gray-700 mb-4 pl-16">{review.comment}</p>
              )}

              {/* Clinic Response */}
              {review.response ? (
                <div className="pl-16 mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                  <p className="text-sm font-medium text-blue-900 mb-1">Your Response</p>
                  <p className="text-gray-700">{review.response}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Responded on {new Date(review.respondedAt!).toLocaleDateString()}
                  </p>
                </div>
              ) : respondingTo === review.id ? (
                <div className="pl-16 mt-4">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(review.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Send Response
                    </button>
                    <button
                      onClick={() => {
                        setRespondingTo(null);
                        setResponseText('');
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setRespondingTo(review.id)}
                  className="pl-16 mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <MessageSquare className="w-4 h-4" />
                  Respond to Review
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
