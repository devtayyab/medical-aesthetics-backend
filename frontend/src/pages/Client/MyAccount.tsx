import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { fetchUserAppointments } from "@/store/slices/clientSlice";
import { userAPI } from "@/services/api";
import type { RootState, AppDispatch } from "@/store";
import type { Appointment } from "@/types";
import { css } from "@emotion/css";

const containerStyle = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-md);
  display: grid;
  gap: var(--spacing-lg);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const cardStyle = css`
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  background-color: var(--color-white);
`;

const titleStyle = css`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
  color: var(--color-medical-text);
`;

const infoStyle = css`
  margin-bottom: var(--spacing-sm);
  color: var(--color-gray-600);
`;

const appointmentsListStyle = css`
  list-style: none;
  padding: 0;
`;

const appointmentItemStyle = css`
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--color-gray-200);
  &:last-child {
    border-bottom: none;
  }
`;

export const MyAccount: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const { appointments, isLoading, error } = useSelector(
    (state: RootState) => state.client
  );

  useEffect(() => {
    if (isAuthenticated && !appointments.length) {
      dispatch(fetchUserAppointments());
    }
  }, [dispatch, isAuthenticated, appointments.length]);

  const handleUpdateProfile = () => {
    navigate("/update-profile"); // Placeholder route for profile update
  };

  if (!isAuthenticated) {
    return null; // Handled by ProtectedLayout
  }

  return (
    <div className={containerStyle}>
      {/* Personal Information Box */}
      <Card className={cardStyle}>
        <h2 className={titleStyle}>Personal Information</h2>
        <p className={infoStyle}>
          <strong>Name:</strong> {user?.firstName} {user?.lastName}
        </p>
        <p className={infoStyle}>
          <strong>Email:</strong> {user?.email}
        </p>
        <p className={infoStyle}>
          <strong>Role:</strong> {user?.role}
        </p>
        <Button onClick={handleUpdateProfile} variant="secondary" fullWidth>
          Update Profile
        </Button>
      </Card>

      {/* Appointments Box */}
      <Card className={cardStyle}>
        <h2 className={titleStyle}>My Appointments</h2>
        {isLoading ? (
          <p className={infoStyle}>Loading...</p>
        ) : error ? (
          <p className={infoStyle} style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        ) : appointments.length > 0 ? (
          <ul className={appointmentsListStyle}>
            {appointments.map((appointment: Appointment) => (
              <li key={appointment.id} className={appointmentItemStyle}>
                <p>
                  <strong>Service:</strong> {appointment.service?.name || "N/A"}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(appointment.startTime).toLocaleDateString()}
                </p>
                <p>
                  <strong>Status:</strong> {appointment.status}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={infoStyle}>No appointments found.</p>
        )}
        <Button
          onClick={() => navigate("/appointment/booking")}
          variant="secondary"
          fullWidth
        >
          Book New Appointment
        </Button>
      </Card>

      {/* Settings Box */}
      <Card className={cardStyle}>
        <h2 className={titleStyle}>Settings</h2>
        <p className={infoStyle}>Manage your account preferences.</p>
        <Button
          onClick={() => navigate("/notifications")} // Placeholder route for notifications
          variant="secondary"
          fullWidth
        >
          Notification Preferences
        </Button>
        <Button
          onClick={() => navigate("/security")} // Placeholder route for security
          variant="secondary"
          fullWidth
          style={{ marginTop: "var(--spacing-sm)" }}
        >
          Security Settings
        </Button>
        <Button
          onClick={() => navigate("/delete-account")} // Placeholder route for deletion
          variant="secondary"
          fullWidth
          style={{ marginTop: "var(--spacing-sm)" }}
        >
          Delete Account
        </Button>
      </Card>
    </div>
  );
};
