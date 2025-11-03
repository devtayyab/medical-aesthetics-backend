import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { register } from "@/store/slices/authSlice";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Card } from "@/components/atoms/Card/Card";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";

const registerContainerStyle = css`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 87vh;
  background: linear-gradient(
    135deg,
    var(--color-medical-bg) 0%,
    rgba(255, 255, 255, 0.9) 100%
  );
  padding: 50px 0;
`;

const registerCardStyle = css`
  width: 100%;
  max-width: 540px;
  padding: var(--spacing-2xl);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  background: var(--color-white);
`;

const registerHeaderStyle = css`
  font-size: 28px;
  font-weight: var(--font-weight-bold);
  color: var(--color-medical-text);
  text-align: center;
  margin-bottom: var(--spacing-lg);
`;

const errorStyle = css`
  color: var(--color-error);
  text-align: center;
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
`;

const linkStyle = css`
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  &:hover {
    text-decoration: underline;
  }
`;

const formStyle = css`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

export const Register: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("client");
  
  // Clinic fields (only for clinic_owner)
  const [clinicName, setClinicName] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicCity, setClinicCity] = useState("");
  
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [clinicNameError, setClinicNameError] = useState("");

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setFirstNameError("");
    setLastNameError("");
    setPhoneError("");
    setRoleError("");
    setClinicNameError("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }
    if (!password || password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      isValid = false;
    }
    if (!firstName) {
      setFirstNameError("First name is required");
      isValid = false;
    }
    if (!lastName) {
      setLastNameError("Last name is required");
      isValid = false;
    }
    if (phone && !/^\+?\d{10,15}$/.test(phone)) {
      setPhoneError("Please enter a valid phone number");
      isValid = false;
    }
    if (!role) {
      setRoleError("Please select a role");
      isValid = false;
    }
    // Validate clinic fields if role is clinic_owner
    if (role === "clinic_owner" && !clinicName) {
      setClinicNameError("Clinic name is required for clinic owners");
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const userData: any = {
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        role,
      };

      // Add clinic data if role is clinic_owner
      if (role === "clinic_owner") {
        userData.clinicData = {
          name: clinicName,
          phone: clinicPhone || phone,
          email: clinicEmail || email,
          address: {
            street: clinicAddress || "",
            city: clinicCity || "",
            state: "",
            zipCode: "",
            country: "",
          },
        };
      }

      const result = await dispatch(register(userData)).unwrap();
      
      // Redirect based on role
      const clinicRoles = ['clinic_owner', 'doctor', 'secretariat', 'salesperson'];
      
      if (clinicRoles.includes(result.user.role)) {
        navigate("/clinic/dashboard", { replace: true });
      } else if (result.user.role === 'admin') {
        navigate("/admin/dashboard", { replace: true });
      } else if (result.user.role === 'client') {
        navigate("/my-account", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      // Error handled in Redux
    }
  };

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <div className={registerContainerStyle}>
      <Card className={registerCardStyle}>
        <h2 className={registerHeaderStyle}>Create Your Account</h2>
        {error && <p className={errorStyle}>{error}</p>}
        <form onSubmit={handleSubmit} className={formStyle}>
          <div>
            <Input
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
            />
            {firstNameError && <p className={errorStyle}>{firstNameError}</p>}
          </div>
          <div>
            <Input
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
            />
            {lastNameError && <p className={errorStyle}>{lastNameError}</p>}
          </div>
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            {emailError && <p className={errorStyle}>{emailError}</p>}
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
            {passwordError && <p className={errorStyle}>{passwordError}</p>}
          </div>
          <div>
            <Input
              type="tel"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
            />
            {phoneError && <p className={errorStyle}>{phoneError}</p>}
          </div>
          
          {/* Role Selection */}
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Register as <span style={{ color: "red" }}>*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "15px",
                backgroundColor: "white",
              }}
            >
              <option value="client">Client (Book Appointments)</option>
              <option value="clinic_owner">Clinic Owner (Manage Clinic)</option>
              <option value="doctor">Doctor (Provide Services)</option>
              <option value="secretariat">Secretariat (Admin Support)</option>
              <option value="salesperson">Salesperson (CRM & Sales)</option>
            </select>
            {roleError && <p className={errorStyle}>{roleError}</p>}
          </div>

          {/* Clinic Fields - Only show for clinic_owner */}
          {role === "clinic_owner" && (
            <div style={{ 
              padding: "16px", 
              backgroundColor: "#f3f4f6", 
              borderRadius: "8px",
              marginTop: "8px"
            }}>
              <h3 style={{ 
                fontSize: "16px", 
                fontWeight: 600, 
                marginBottom: "12px",
                color: "#374151"
              }}>
                Clinic Information
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <Input
                    placeholder="Clinic Name *"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    fullWidth
                  />
                  {clinicNameError && <p className={errorStyle}>{clinicNameError}</p>}
                </div>
                <div>
                  <Input
                    placeholder="Clinic Phone (optional)"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    fullWidth
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Clinic Email (optional)"
                    value={clinicEmail}
                    onChange={(e) => setClinicEmail(e.target.value)}
                    fullWidth
                  />
                </div>
                <div>
                  <Input
                    placeholder="Clinic Address (optional)"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    fullWidth
                  />
                </div>
                <div>
                  <Input
                    placeholder="City (optional)"
                    value={clinicCity}
                    onChange={(e) => setClinicCity(e.target.value)}
                    fullWidth
                  />
                </div>
              </div>
            </div>
          )}
          <Button
            type="submit"
            fullWidth
            disabled={isLoading}
            style={{
              color: "#33373F",
              backgroundColor: "#CBFF38",
              paddingTop: "12px",
              paddingBottom: "12px",
            }}
            className="mt-5"
          >
            {isLoading ? "Registering..." : "Register"}
          </Button>
        </form>
        <p style={{ textAlign: "center", marginTop: "var(--spacing-md)" }}>
          Already have an account?{" "}
          <Link to="/login" className={linkStyle}>
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
};
