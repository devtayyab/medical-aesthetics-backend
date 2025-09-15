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
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setFirstNameError("");
    setLastNameError("");
    setPhoneError("");

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
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await dispatch(
        register({
          email,
          password,
          firstName,
          lastName,
          phone: phone || undefined,
        })
      ).unwrap();
      navigate("/");
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
