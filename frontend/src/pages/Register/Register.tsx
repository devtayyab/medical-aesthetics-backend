import React, { useState, useEffect } from"react";
import { useDispatch, useSelector } from"react-redux";
import { Navigate, Link, useSearchParams } from"react-router-dom";
import { register, clearError } from"@/store/slices/authSlice";
import { authAPI } from"@/services/api";
import { isSafeRedirect } from"@/services/client";
import { Button } from"@/components/atoms/Button/Button";
import { Input } from"@/components/atoms/Input/Input";
import { Card } from"@/components/atoms/Card/Card";
import type { RootState, AppDispatch } from"@/store";
import { css } from"@emotion/css";
import { toast } from "react-hot-toast";

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
 const { isLoading, error, isAuthenticated } = useSelector(
 (state: RootState) => state.auth
 );

 useEffect(() => {
 dispatch(clearError());
 }, [dispatch]);

 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [firstName, setFirstName] = useState("");
 const [lastName, setLastName] = useState("");
 const [phone, setPhone] = useState("");

 const [emailError, setEmailError] = useState("");
 const [passwordError, setPasswordError] = useState("");
 const [confirmPasswordError, setConfirmPasswordError] = useState("");
 const [firstNameError, setFirstNameError] = useState("");
 const [lastNameError, setLastNameError] = useState("");
 const [phoneError, setPhoneError] = useState("");
 const [submitError, setSubmitError] = useState("");
 const [agreedTerms, setAgreedTerms] = useState(false);
 const [termsError, setTermsError] = useState("");
 const [marketingConsent, setMarketingConsent] = useState(false);
 const [isGreek, setIsGreek] = useState(
 () => typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el'
 );

 useEffect(() => {
 const handleLang = () => {
 setIsGreek(localStorage.getItem('preferredLang') === 'el');
 };
 window.addEventListener('storage', handleLang);
 window.addEventListener('languagechange', handleLang);
 const interval = setInterval(handleLang, 1000);
 return () => {
 window.removeEventListener('storage', handleLang);
 window.removeEventListener('languagechange', handleLang);
 clearInterval(interval);
 };
 }, []);

 // After registering: "check your email" screen (verification link)
 const [verificationStep, setVerificationStep] = useState(false);
 const [claimedExistingAccount, setClaimedExistingAccount] = useState(false);
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
 setConfirmPasswordError("");
 setFirstNameError("");
 setLastNameError("");
 setPhoneError("");
 setTermsError("");
 setSubmitError("");

 if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
 setEmailError(isGreek ? "Παρακαλούμε εισάγετε μια έγκυρη διεύθυνση email" : "Please enter a valid email address");
 isValid = false;
 }
 if (!password || password.length < 8) {
 setPasswordError(isGreek ? "Ο κωδικός πρόσβασης πρέπει να έχει τουλάχιστον 8 χαρακτήρες" : "Password must be at least 8 characters");
 isValid = false;
 }
 if (!confirmPassword || confirmPassword !== password) {
 setConfirmPasswordError(isGreek ? "Οι κωδικοί πρόσβασης δεν ταιριάζουν" : "Passwords do not match");
 isValid = false;
 }
 if (!firstName.trim()) {
 setFirstNameError(isGreek ? "Το όνομα είναι υποχρεωτικό" : "First name is required");
 isValid = false;
 }
 if (!lastName.trim()) {
 setLastNameError(isGreek ? "Το επώνυμο είναι υποχρεωτικό" : "Last name is required");
 isValid = false;
 }
 const cleanPhone = phone.trim().replace(/[\s()-]/g, "");
 if (!cleanPhone) {
 setPhoneError(isGreek ? "Ο αριθμός κινητού τηλεφώνου είναι υποχρεωτικός" : "Mobile phone number is required");
 isValid = false;
 } else if (!/^\+?\d{8,15}$/.test(cleanPhone)) {
 setPhoneError(isGreek ? "Παρακαλούμε εισάγετε έναν έγκυρο αριθμό κινητού τηλεφώνου" : "Please enter a valid mobile phone number");
 isValid = false;
 }
 if (!agreedTerms) {
 setTermsError(
 isGreek
 ? "Πρέπει να διαβάσετε και να αποδεχτείτε τους Όρους Χρήσης και την Πολιτική Απορρήτου."
 : "You must read and agree to the Terms of Use and acknowledge the Privacy Policy."
 );
 isValid = false;
 }
 return isValid;
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!validateForm()) {
 toast.error(isGreek ? "Παρακαλούμε ελέγξτε τα πεδία της φόρμας." : "Please check the required fields.");
 return;
 }

 try {
 const userData: any = {
 email: email.trim(),
 password,
 firstName: firstName.trim(),
 lastName: lastName.trim(),
 phone: phone.trim(),
 marketingEmailConsent: marketingConsent,
 role:"client",
 redirect,
 };

 const result = await dispatch(register(userData)).unwrap();
 setRegisteredEmail(result?.email || email.trim());
 setClaimedExistingAccount(!!result?.claimedExistingAccount);
 setVerificationMessage(result?.message || "");
 setVerificationStep(true);
 window.scrollTo({ top: 0, behavior: "smooth" });
 toast.success(
 isGreek
 ? "Η εγγραφή σας ολοκληρώθηκε επιτυχώς! Ελέγξτε το email σας για επιβεβαίωση."
 : "Registration successful! Please check your email to verify your account."
 );
 } catch (err: any) {
 const msg = typeof err === "string" ? err : err?.message || (isGreek ? "Η εγγραφή απέτυχε. Δοκιμάστε ξανά." : "Registration failed. Please try again.");
 setSubmitError(msg);
 window.scrollTo({ top: 0, behavior: "smooth" });
 toast.error(msg);
 }
 };

 const handleResend = async () => {
 try {
 await authAPI.resendVerification(registeredEmail, redirect);
 const msg = isGreek ? "Στείλαμε νέο σύνδεσμο επιβεβαίωσης στο email σας." : "We sent a new verification link to your email.";
 setResendInfo(msg);
 toast.success(msg);
 } catch {
 const errMsg = isGreek ? "Παρακαλούμε δοκιμάστε ξανά σε λίγο." : "Please try again in a moment.";
 setResendInfo(errMsg);
 toast.error(errMsg);
 }
 };

 if (isAuthenticated) {
 return <Navigate to={redirect || "/"} replace />;
 }

 // Check your email / Registration confirmation screen
 if (verificationStep) {
 return (
 <div className={registerContainerStyle}>
 <Card className={registerCardStyle}>
 <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
 <div
 style={{
 width: 64,
 height: 64,
 borderRadius: "50%",
 background: "#ecfdf5",
 border: "2px solid #10b981",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 color: "#059669",
 fontSize: 32,
 fontWeight: 800,
 }}
 aria-hidden="true"
 >
 ✓
 </div>
 </div>
 <div
 role="status"
 style={{
 background: "#ecfdf5",
 border: "1px solid #a7f3d0",
 color: "#065f46",
 padding: "14px 16px",
 borderRadius: 12,
 marginBottom: 18,
 textAlign: "center",
 fontSize: 15,
 fontWeight: 700,
 }}
 >
 {claimedExistingAccount
 ? (isGreek
 ? "Έχετε ήδη λογαριασμό μαζί μας! Σας στείλαμε email για ορισμό κωδικού."
 : "You already have an account with us! We sent you an email to set your password.")
 : (isGreek
 ? "Η εγγραφή σας ολοκληρώθηκε επιτυχώς!"
 : "Your registration was successful!")}
 </div>
 <h2 className={registerHeaderStyle} style={{ fontSize: 22, marginBottom: 12 }}>
 {isGreek ? "Ελέγξτε το email σας" : "Check your email"}
 </h2>
 <p style={{ textAlign: "center", color: "#4b5563", marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>
 {claimedExistingAccount
 ? (isGreek ? "Στείλαμε σύνδεσμο ορισμού κωδικού στο:" : (verificationMessage || "We sent a set-password link to:"))
 : (isGreek ? "Στείλαμε σύνδεσμο επιβεβαίωσης στο:" : "We sent a verification link to:")}
 <br />
 <strong style={{ color: "#111827" }}>{registeredEmail}</strong>
 </p>
 <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
 {claimedExistingAccount
 ? (isGreek
 ? "Πατήστε τον σύνδεσμο στο email σας για να ορίσετε τον κωδικό σας και να συνδεθείτε."
 : "Click the link in the email to set your password and log in.")
 : (isGreek
 ? "Πατήστε τον σύνδεσμο στο email σας για να επιβεβαιώσετε τον λογαριασμό σας και να κλείσετε ραντεβού."
 : "Click the link in the email to verify your account and book appointments.")}
 </p>
 {resendInfo && <p style={{ textAlign: "center", color: "#15803d", fontSize: 13, marginTop: 10, fontWeight: 600 }}>{resendInfo}</p>}
 {!claimedExistingAccount && (
 <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#6b7280" }}>
 {isGreek ? "Δεν το λάβατε; Ελέγξτε τον φάκελο ανεπιθύμητης αλληλογραφίας (Spam)." : "Didn't receive it? Check your spam folder."}{" "}
 <button
 type="button"
 onClick={handleResend}
 style={{ color: "#4d7c0f", background: "none", border: "none", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}
 >
 {isGreek ? "Αποστολή ξανά" : "Send again"}
 </button>
 </p>
 )}
 <div style={{ textAlign: "center", marginTop: 20 }}>
 <Link
 to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}
 style={{
 display: "inline-block",
 backgroundColor: "#CBFF38",
 color: "#33373F",
 fontWeight: 700,
 padding: "12px 28px",
 borderRadius: 12,
 textDecoration: "none",
 fontSize: 14,
 }}
 >
 {isGreek ? "Μετάβαση στη Σύνδεση" : "Go to Login"}
 </Link>
 </div>
 </Card>
 </div>
 );
 }

 // ─── Registration Form ─────────────────────────────────────────────────────
 return (
 <div className={registerContainerStyle}>
 <Card className={registerCardStyle}>
 <h2 className={registerHeaderStyle}>{isGreek ? "Δημιουργία Λογαριασμού" : "Create Your Account"}</h2>
 {(submitError || error) && (
 <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "10px 14px", borderRadius: 10, marginBottom: 16, textAlign: "center", fontSize: 13, fontWeight: 600 }}>
 {submitError || error}
 </div>
 )}
 <form onSubmit={handleSubmit} className={formStyle} noValidate>
 <div>
 <Input
 placeholder={isGreek ? "Όνομα *" : "First Name *"}
 value={firstName}
 onChange={(e) => setFirstName(e.target.value)}
 fullWidth
 required
 />
 {firstNameError && <p className={errorStyle}>{firstNameError}</p>}
 </div>
 <div>
 <Input
 placeholder={isGreek ? "Επώνυμο *" : "Last Name *"}
 value={lastName}
 onChange={(e) => setLastName(e.target.value)}
 fullWidth
 required
 />
 {lastNameError && <p className={errorStyle}>{lastNameError}</p>}
 </div>
 <div>
 <Input
 type="email"
 placeholder={isGreek ? "Διεύθυνση Email *" : "Email *"}
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 fullWidth
 autoComplete="email"
 required
 />
 {emailError && <p className={errorStyle}>{emailError}</p>}
 </div>
 <div>
 <Input
 type="password"
 placeholder={isGreek ? "Κωδικός Πρόσβασης (τουλάχιστον 8 χαρακτήρες) *" : "Password (min. 8 characters) *"}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 fullWidth
 passwordToggle
 minLength={8}
 autoComplete="new-password"
 required
 />
 {passwordError && <p className={errorStyle}>{passwordError}</p>}
 </div>
 <div>
 <Input
 type="password"
 placeholder={isGreek ? "Επιβεβαίωση Κωδικού Πρόσβασης *" : "Confirm Password *"}
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 fullWidth
 passwordToggle
 minLength={8}
 autoComplete="new-password"
 required
 />
 {confirmPasswordError && <p className={errorStyle}>{confirmPasswordError}</p>}
 </div>
 <div>
 <Input
 type="tel"
 placeholder={isGreek ? "Κινητό Τηλέφωνο (π.χ. +306912345678) *" : "Mobile Phone Number (e.g. +306912345678) *"}
 value={phone}
 onChange={(e) => setPhone(e.target.value)}
 fullWidth
 required
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
 {isLoading ? (isGreek ? "Εγγραφή σε εξέλιξη..." : "Registering...") : (isGreek ? "Εγγραφή" : "Register")}
 </Button>
 </form>
 <p style={{ textAlign:"center", marginTop:"var(--spacing-md)" }}>
 {isGreek ? "Έχετε ήδη λογαριασμό;" : "Already have an account?"}{" "}
 <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` :"/login"} className={linkStyle}>
 {isGreek ? "Σύνδεση" : "Login"}
 </Link>
 </p>
 </Card>
 </div>
 );
};
