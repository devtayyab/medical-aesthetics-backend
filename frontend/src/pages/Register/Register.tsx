import React, { useState } from"react";
import { useDispatch, useSelector } from"react-redux";
import { useNavigate, Link, useSearchParams } from"react-router-dom";
import { register } from"@/store/slices/authSlice";
import { authAPI } from"@/services/api";
import { isSafeRedirect } from"@/services/client";
import { Button } from"@/components/atoms/Button/Button";
import { Input } from"@/components/atoms/Input/Input";
import { Card } from"@/components/atoms/Card/Card";
import type { RootState, AppDispatch } from"@/store";
import { css } from"@emotion/css";

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
 const [agreedTerms, setAgreedTerms] = useState(false);
 const [termsError, setTermsError] = useState("");
 const [marketingConsent, setMarketingConsent] = useState(false);
 const isGreek = typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el';

 // After registering: "check your email" screen (verification link)
 const [verificationStep, setVerificationStep] = useState(false);
 const [registeredEmail, setRegisteredEmail] = useState("");
 const [verificationMessage, setVerificationMessage] = useState("");
 const [resendInfo, setResendInfo] = useState("");

 // Keep the page she came from (e.g. the booking) through registration and verification.
 const [searchParams] = useSearchParams();
 const redirectParam = searchParams.get("redirect");
 const redirect = isSafeRedirect(redirectParam) ? redirectParam : undefined;

 const validateForm = () => {
 let isValid = true;
 setEmailError("");
 setPasswordError("");
 setFirstNameError("");
 setLastNameError("");
 setPhoneError("");
 setTermsError("");

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
 if (!agreedTerms) {
 setTermsError("You must read and agree to the Terms of Use and acknowledge the Privacy Policy.");
 isValid = false;
 }
 return isValid;
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!validateForm()) return;

 try {
 const userData: any = {
 email: email.trim(),
 password,
 firstName,
 lastName,
 phone: phone || undefined,
 role:"client",
 redirect,
 };

 const result = await dispatch(register(userData)).unwrap();
 setRegisteredEmail(result?.email || email.trim());
 setVerificationMessage(result?.message ||"");
 setVerificationStep(true);
 } catch (err) {
 // Error handled in Redux
 }
 };

 const handleResend = async () => {
 try {
 await authAPI.resendVerification(registeredEmail, redirect);
 setResendInfo("We sent a new link. / Στείλαμε νέο σύνδεσμο.");
 } catch {
 setResendInfo("Please try again in a moment.");
 }
 };

 if (isAuthenticated) {
 navigate(redirect ||"/");
 return null;
 }

 // Check your email screen
 if (verificationStep) {
 return (
 <div className={registerContainerStyle}>
 <Card className={registerCardStyle}>
 <h2 className={registerHeaderStyle} style={{ fontSize: 22 }}>
 Ελέγξτε το email σας / Check your email
 </h2>
 <p style={{ textAlign:"center", color:"#6b7280", marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
 {verificationMessage ||"We sent a verification link to"}<br />
 <strong style={{ color:"#111" }}>{registeredEmail}</strong>
 </p>
 <p style={{ textAlign:"center", color:"#6b7280", fontSize: 14, lineHeight: 1.6 }}>
 Πατήστε τον σύνδεσμο στο email και μετά συνδεθείτε. Click the link in the email, then log in.
 </p>
 {resendInfo && <p style={{ textAlign:"center", color:"#15803d", fontSize: 13 }}>{resendInfo}</p>}
 <p style={{ textAlign:"center", marginTop: 16, fontSize: 13, color:"#9ca3af" }}>
 Δεν το λάβατε; Ελέγξτε τα ανεπιθύμητα. Didn't receive it? Check your spam folder.{" "}
 <button
 type="button"
 onClick={handleResend}
 style={{ color:"#6366f1", background:"none", border:"none", cursor:"pointer", fontWeight: 600 }}
 >
 Send again
 </button>
 </p>
 <p style={{ textAlign:"center", marginTop: 8 }}>
 <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` :"/login"} className={linkStyle}>
 Σύνδεση / Log in
 </Link>
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

 <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
 <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "var(--color-medical-text)", cursor: "pointer", lineHeight: "1.4" }}>
 <input
 type="checkbox"
 checked={agreedTerms}
 onChange={(e) => {
 setAgreedTerms(e.target.checked);
 if (e.target.checked) setTermsError("");
 }}
 style={{ marginTop: "3px", cursor: "pointer" }}
 />
 <span>
 {isGreek ? (
   <>
     <span style={{ fontWeight: 700 }}>(υποχρεωτικό)</span> Είμαι 18 ετών και άνω και αποδέχομαι τους{" "}
     <Link to="/terms-of-use" target="_blank" className={linkStyle}>Όρους Χρήσης</Link>
     . Έχω διαβάσει την{" "}
     <Link to="/privacy-policy" target="_blank" className={linkStyle}>Πολιτική Απορρήτου</Link>
     . <span style={{ color: "var(--color-error)" }}>*</span>
   </>
 ) : (
   <>
     <span style={{ fontWeight: 700 }}>(required)</span> I am 18 years of age or over and I accept the{" "}
     <Link to="/terms-of-use" target="_blank" className={linkStyle}>Terms of Use</Link>
     . I have read the{" "}
     <Link to="/privacy-policy" target="_blank" className={linkStyle}>Privacy Policy</Link>
     . <span style={{ color: "var(--color-error)" }}>*</span>
   </>
 )}
 </span>
 </label>
 {termsError && <p style={{ color: "var(--color-error)", fontSize: "12px", margin: "-4px 0 0 24px" }}>{termsError}</p>}

 <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "var(--color-text-secondary, #666)", cursor: "pointer", lineHeight: "1.4" }}>
 <input
 type="checkbox"
 checked={marketingConsent}
 onChange={(e) => setMarketingConsent(e.target.checked)}
 style={{ marginTop: "3px", cursor: "pointer" }}
 />
 <span>
 {isGreek ? (
   <>
     <span style={{ fontWeight: 700 }}>(προαιρετικό)</span> Θέλω να λαμβάνω το newsletter της BeautyDoctors με νέα και ενημερώσεις με email. Μπορώ να διαγραφώ οποτεδήποτε.
   </>
 ) : (
   <>
     <span style={{ fontWeight: 700 }}>(optional)</span> I would like to receive the BeautyDoctors newsletter with news and updates by email. I can unsubscribe at any time.
   </>
 )}
 </span>
 </label>
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
 <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` :"/login"} className={linkStyle}>
 Login
 </Link>
 </p>
 </Card>
 </div>
 );
};
