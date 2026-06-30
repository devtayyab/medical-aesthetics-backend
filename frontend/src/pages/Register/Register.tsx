import React, { useState } from"react";
import { useDispatch, useSelector } from"react-redux";
import { useNavigate, Link } from"react-router-dom";
import { register } from"@/store/slices/authSlice";
import { Button } from"@/components/atoms/Button/Button";
import { Input } from"@/components/atoms/Input/Input";
import { Card } from"@/components/atoms/Card/Card";
import type { RootState, AppDispatch } from"@/store";
import { css } from"@emotion/css";
import axios from"axios";

const API_BASE = import.meta.env.VITE_API_URL ||"http://localhost:3000";

const registerContainerStyle = css`
 display: flex;
 justify-content: center;
 align-items: center;
 min-height: 87vh;
 padding: 1rem;
 background: linear-gradient(
 135deg,
 var(--color-medical-bg) 0%,
 rgba(255, 255, 255, 0.9) 100%
 );
`;

const registerCardStyle = css`
 width: 100%;
 max-width: 540px;
 padding: 24px;
 border-radius: var(--radius-2xl);
 box-shadow: var(--shadow-xl);
 background: var(--color-white);
 @media (min-width: 768px) {
 padding: var(--spacing-2xl);
 }
`;

const registerHeaderStyle = css`
 font-size: 28px;
 font-weight: var(--font-weight-bold);
 color: var(--color-medical-text);
 text-align: center;
 margin-bottom: var(--spacing-lg)`;

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

 // OTP verification state
 const [verificationStep, setVerificationStep] = useState(false);
 const [userId, setUserId] = useState("");
 const [otp, setOtp] = useState("");
 const [otpError, setOtpError] = useState("");
 const [isVerifying, setIsVerifying] = useState(false);
 const [registeredEmail, setRegisteredEmail] = useState("");

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
 if (!phone) {
 setPhoneError("Phone number is required");
 isValid = false;
 } else if (!/^\+?\d{10,15}$/.test(phone)) {
 setPhoneError("Please enter a valid phone number");
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
 role:"client",
 };

 const result = await dispatch(register(userData)).unwrap();

 // If server requires email verification, show OTP screen
 if (result?.requiresVerification && result?.userId) {
 setUserId(result.userId);
 setRegisteredEmail(result.email || email);
 setVerificationStep(true);
 } else {
 // No verification required (legacy path), go home
 navigate("/", { replace: true });
 }
 } catch (err) {
 // Error handled in Redux
 }
 };

 const handleVerifyOtp = async (e: React.FormEvent) => {
 e.preventDefault();
 setOtpError("");

 if (!otp || otp.length !== 6) {
 setOtpError("Please enter the 6-digit code sent to your email.");
 return;
 }

 setIsVerifying(true);
 try {
 const res = await axios.post(`${API_BASE}/auth/verify-email`, {
 userId,
 otp,
 });

 const { accessToken, refreshToken, user } = res.data;
 // Store tokens and redirect — use the same mechanism as login
 localStorage.setItem("accessToken", accessToken);
 localStorage.setItem("refreshToken", refreshToken);
 navigate("/", { replace: true });
 window.location.reload(); // Refresh to pick up auth state
 } catch (err: any) {
 setOtpError(
 err?.response?.data?.message ||"Invalid or expired code. Please try again."
 );
 } finally {
 setIsVerifying(false);
 }
 };

 if (isAuthenticated) {
 navigate("/");
 return null;
 }

 // ─── OTP Verification Screen ───────────────────────────────────────────────
 if (verificationStep) {
 return (
 <div className={registerContainerStyle}>
 <Card className={registerCardStyle}>
 {/* Icon */}
 <div style={{ textAlign:"center", marginBottom: 16 }}>
 <div style={{
 width: 64, height: 64, borderRadius:"50%",
 background:"linear-gradient(135deg, #CBFF38, #a8e020)",
 display:"inline-flex", alignItems:"center", justifyContent:"center",
 fontSize: 28, boxShadow:"0 4px 20px rgba(203,255,56,0.4)"
 }}>
 ✉️
 </div>
 </div>

 <h2 className={registerHeaderStyle} style={{ fontSize: 22 }}>
 Verify Your Email
 </h2>
 <p style={{ textAlign:"center", color:"#6b7280", marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
 We've sent a 6-digit verification code to<br />
 <strong style={{ color:"#111" }}>{registeredEmail}</strong>
 </p>

 {otpError && <p className={errorStyle}>{otpError}</p>}

 <form onSubmit={handleVerifyOtp} className={formStyle}>
 <div>
 <input
 id="otp-input"
 type="text"
 maxLength={6}
 value={otp}
 onChange={(e) => setOtp(e.target.value.replace(/\D/g,""))}
 placeholder="000000"
 style={{
 width:"100%",
 textAlign:"center",
 fontSize: 32,
 fontWeight: 800,
 letterSpacing:"0.5em",
 padding:"16px 12px",
 border:"2px solid #e5e7eb",
 borderRadius: 12,
 outline:"none",
 fontFamily:"monospace",
 transition:"border-color 0.2s",
 }}
 onFocus={(e) => (e.target.style.borderColor ="#CBFF38")}
 onBlur={(e) => (e.target.style.borderColor ="#e5e7eb")}
 autoFocus
 inputMode="numeric"
 autoComplete="one-time-code"
 />
 </div>

 <Button
 type="submit"
 fullWidth
 disabled={isVerifying || otp.length !== 6}
 style={{
 color:"#33373F",
 backgroundColor:"#CBFF38",
 paddingTop:"12px",
 paddingBottom:"12px",
 }}
 className="mt-2"
 >
 {isVerifying ?"Verifying..." :"Confirm & Activate Account"}
 </Button>
 </form>

 <p style={{ textAlign:"center", marginTop: 16, fontSize: 13, color:"#9ca3af" }}>
 Didn't receive a code? Check your spam folder.{""}
 <button
 type="button"
 onClick={() => { setVerificationStep(false); setOtp(""); }}
 style={{ color:"#6366f1", background:"none", border:"none", cursor:"pointer", fontWeight: 600 }}
 >
 Go back
 </button>
 </p>
 </Card>
 </div>
 );
 }

 // ─── Registration Form ─────────────────────────────────────────────────────
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
 autoComplete="email"
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
 passwordToggle
 minLength={8}
 autoComplete="new-password"
 />
 {passwordError && <p className={errorStyle}>{passwordError}</p>}
 </div>
 <div>
 <Input
 type="tel"
 placeholder="Phone Number"
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
 color:"#33373F",
 backgroundColor:"#CBFF38",
 paddingTop:"12px",
 paddingBottom:"12px",
 }}
 className="mt-5"
 >
 {isLoading ?"Registering..." :"Register"}
 </Button>
 </form>
 <p style={{ textAlign:"center", marginTop:"var(--spacing-md)" }}>
 Already have an account?{""}
 <Link to="/login" className={linkStyle}>
 Login
 </Link>
 </p>
 </Card>
 </div>
 );
};
