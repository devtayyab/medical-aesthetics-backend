import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { login, forgotPassword, resetPassword } from "@/store/slices/authSlice";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Card } from "@/components/atoms/Card/Card";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";

const loginContainerStyle = css`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: linear-gradient(
    135deg,
    var(--color-medical-bg) 0%,
    rgba(255, 255, 255, 0.9) 100%
  );
`;

const loginCardStyle = css`
  width: 100%;
  max-width: 540px;
  padding: var(--spacing-2xl);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  background: var(--color-white);
`;

const loginHeaderStyle = css`
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

export const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [message, setMessage] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState(""); // store reset token

  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }
    if (!password || password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const result = await dispatch(login({ email, password })).unwrap();

      // Redirect based on role
      const clinicRoles = ["clinic_owner", "doctor", "secretariat", "salesperson"];

      if (clinicRoles.includes(result.user.role)) {
        navigate("/clinic/dashboard", { replace: true });
      } else if (result.user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (result.user.role === "client") {
        navigate("/my-account", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.log("Login error:", err);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage("Please enter your email first");
      return;
    }
    try {
      const res = await dispatch(forgotPassword({ email })).unwrap();
      setResetToken(res.resetToken); // store token from API
      setIsForgotPassword(true);
      setMessage("Check your email for the reset token");
    } catch (err: any) {
      console.log("Forgot password error:", err);
      setMessage(err || "Something went wrong");
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setPasswordError("Please fill both password fields");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      const result = await dispatch(resetPassword({ password, resetToken })).unwrap();
      console.log("Reset password success:", result);
      setMessage("Password reset successful. Please login.");
      setIsForgotPassword(false);
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.log("Reset password error:", err);
      setPasswordError(err || "Something went wrong");
    }
  };

  return (
    <div className={loginContainerStyle}>
      <Card className={loginCardStyle}>
        <h2 className={loginHeaderStyle}>
          {isForgotPassword ? "Reset Your Password" : "Login to Your Account"}
        </h2>

        {message && <p className={errorStyle}>{message}</p>}
        {error && <p className={errorStyle}>{error}</p>}

        {isForgotPassword ? (
          <div className={formStyle}>
            <Input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              className="bg-white text-[15px] mt-1"
              passwordToggle
              minLength={8}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              className="bg-white text-[15px] mt-3"
              passwordToggle
              minLength={8}
              autoComplete="new-password"
            />
            {passwordError && <p className={errorStyle}>{passwordError}</p>}

            <div className="flex justify-between mt-4">
              <Button
                style={{ backgroundColor: "#ccc", color: "#333" }}
                onClick={() => setIsForgotPassword(false)}
              >
                Cancel
              </Button>
              <Button
                style={{ backgroundColor: "#CBFF38", color: "#33373F" }}
                onClick={handleResetPassword}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={formStyle}>
            <div>
              <label htmlFor="email">Email</label>
              <Input
                type="email"
                placeholder="abc@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                className="bg-white text-[15px] mt-1"
                autoComplete="email"
              />
              {emailError && <p className={errorStyle}>{emailError}</p>}
            </div>
            <div>
              <div className="flex justify-between">
                <label htmlFor="password">Password</label>
                <Button
                  className={`${linkStyle} !bg-transparent !border-none !shadow-none hover:!bg-transparent hover:!shadow-none hover:text-cornflowerblue`}
                  onClick={handleForgotPassword}
                  style={{ color: "cornflowerblue" }}
                  type="button"
                >
                  Forgot?
                </Button>
              </div>
              <Input
                type="password"
                placeholder="Enter Your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                className="bg-white text-[15px] mt-1"
                passwordToggle
                minLength={8}
                autoComplete="current-password"
              />
              {passwordError && <p className={errorStyle}>{passwordError}</p>}
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
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        )}

        {!isForgotPassword && (
          <p style={{ textAlign: "center", marginTop: "var(--spacing-md)" }}>
            Don't have an account?{" "}
            <Link
              to="/register"
              className={linkStyle}
              style={{ color: "cornflowerblue" }}
            >
              Sign Up
            </Link>
          </p>
        )}
      </Card>
    </div>
  );
};
