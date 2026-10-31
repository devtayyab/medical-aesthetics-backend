import React, { useState } from"react";
import { useDispatch, useSelector } from"react-redux";
import { useNavigate, Link, useSearchParams } from"react-router-dom";
import { login, verifyLoginCode } from"@/store/slices/authSlice";
import { authAPI } from"@/services/api";
import { isSafeRedirect } from"@/services/client";
import { Button } from"@/components/atoms/Button/Button";
import { Input } from"@/components/atoms/Input/Input";
import { Card } from"@/components/atoms/Card/Card";
import type { RootState, AppDispatch } from"@/store";
import { css } from"@emotion/css";

const loginContainerStyle = css`
 display: flex;
 justify-content: center;
 align-items: center;
 min-height: 80vh;
 padding: 1rem;
 background: linear-gradient(
 135deg,
 var(--color-medical-bg) 0%,
 rgba(255, 255, 255, 0.9) 100%
 );
`;

const loginCardStyle = css`
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

const isGreekUi = () => {
 try {
 return localStorage.getItem("preferredLang") ==="el";
 } catch {
 return false;
 }
};

const roleHome = (role?: string) => {
 const clinicRoles = ["clinic_owner","doctor","secretariat"];
 if (role && clinicRoles.includes(role)) return"/clinic/dashboard";
 if (role ==="admin") return"/admin/dashboard";
 if (role ==="SUPER_ADMIN" || role ==="manager") return"/admin/manager-dashboard";
 if (role ==="salesperson") return"/crm";
 return"/";
};

export const Login: React.FC = () => {
 const dispatch = useDispatch<AppDispatch>();
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const { isLoading } = useSelector((state: RootState) => state.auth);
 const el = isGreekUi();
 const t = (gr: string, en: string) => (el ? gr : en);

 // Where to go after login (e.g. the booking she started) and why we are here.
 const redirectParam = searchParams.get("redirect");
 const redirect = isSafeRedirect(redirectParam) ? redirectParam : null;
 const sessionExpired = searchParams.get("reason") ==="session_expired";

 const [step, setStep] = useState<"password" |"code">("password");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [code, setCode] = useState("");
 const [challengeToken, setChallengeToken] = useState("");
 const [maskedEmail, setMaskedEmail] = useState("");
 const [emailError, setEmailError] = useState("");
 const [passwordError, setPasswordError] = useState("");
 const [codeError, setCodeError] = useState("");
 const [message, setMessage] = useState("");
 const [needsVerification, setNeedsVerification] = useState(false);

 const validateForm = () => {
 let isValid = true;
 setEmailError("");
 setPasswordError("");

 if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
 setEmailError(t("Εισάγετε ένα έγκυρο email","Please enter a valid email address"));
 isValid = false;
 }
 // No length rule here: existing passwords keep working; the rule applies when a password is set.
 if (!password) {
 setPasswordError(t("Εισάγετε τον κωδικό σας","Please enter your password"));
 isValid = false;
 }
 return isValid;
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setMessage("");
 setNeedsVerification(false);
 if (!validateForm()) return;

 try {
 const result = await dispatch(login({ email: email.trim(), password })).unwrap();
 if ((result as any).accessToken || !(result as any).requiresCode) {
 navigate(redirect || roleHome((result as any).user?.role), { replace: true });
 return;
 }
 setChallengeToken(result.challengeToken);
 setMaskedEmail(result.email || email);
 setCode("");
 setCodeError("");
 setStep("code");
 } catch (err: any) {
 if (err?.code ==="EMAIL_NOT_VERIFIED") setNeedsVerification(true);
 setEmailError(err?.message || t("Λάθος email ή κωδικός","Invalid email or password"));
 }
 };

 const handleVerifyCode = async (e: React.FormEvent) => {
 e.preventDefault();
 setCodeError("");
 const cleaned = code.replace(/\D/g,"");
 if (cleaned.length !== 6) {
 setCodeError(t("Ο κωδικός έχει 6 ψηφία","The code has 6 digits"));
 return;
 }
 try {
 const result = await dispatch(verifyLoginCode({ challengeToken, code: cleaned })).unwrap();
 navigate(redirect || roleHome(result.user?.role), { replace: true });
 } catch (err: any) {
 if (err?.code ==="CODE_EXPIRED" || err?.code ==="ACCOUNT_LOCKED" || err?.code ==="CLIENT_APP_ONLY") {
 setStep("password");
 setPassword("");
 setEmailError(err?.message ||"");
 return;
 }
 setCodeError(err?.message || t("Λάθος κωδικός","Wrong code"));
 }
 };

 const handleResendCode = async () => {
 setCodeError("");
 try {
 await authAPI.resendLoginCode(challengeToken);
 setMessage(t("Στείλαμε νέο κωδικό στο email σας.","A new code was sent to your email."));
 } catch (err: any) {
 setCodeError(err?.response?.data?.message || t("Δοκιμάστε ξανά σε λίγο.","Please try again in a moment."));
 }
 };

 const handleResendVerification = async () => {
 try {
 await authAPI.resendVerification(email.trim(), redirect || undefined);
 setNeedsVerification(false);
 setEmailError("");
 setMessage(t("Στείλαμε νέο σύνδεσμο επιβεβαίωσης στο email σας.","We sent a new verification link to your email."));
 } catch {
 setMessage(t("Δοκιμάστε ξανά σε λίγο.","Please try again in a moment."));
 }
 };

 const registerHref = redirect ? `/register?redirect=${encodeURIComponent(redirect)}` :"/register";

 return (
 <div className={loginContainerStyle}>
 <Card className={loginCardStyle}>
 <h2 className={loginHeaderStyle}>
 {step ==="code" ? t("Κωδικός σύνδεσης","Enter your login code") : t("Σύνδεση στον λογαριασμό σας","Login to Your Account")}
 </h2>

 {sessionExpired && step ==="password" && (
 <p className={errorStyle} role="alert">
 {t("Η σύνδεσή σας έληξε. Παρακαλώ συνδεθείτε ξανά.","Your session has expired. Please log in again.")}
 </p>
 )}
 {message && <p className={errorStyle} style={{ color:"#15803d" }}>{message}</p>}

 {step ==="code" ? (
 <form onSubmit={handleVerifyCode} className={formStyle}>
 <p style={{ textAlign:"center", color:"#6b7280", fontSize: 14 }}>
 {t("Στείλαμε έναν 6ψήφιο κωδικό στο","We sent a 6-digit code to")} <strong>{maskedEmail}</strong>
 </p>
 <input
 type="text"
 inputMode="numeric"
 autoComplete="one-time-code"
 maxLength={6}
 value={code}
 onChange={(e) => {
 setCode(e.target.value.replace(/\D/g,""));
 setCodeError("");
 }}
 placeholder="000000"
 autoFocus
 style={{
 width:"100%",
 textAlign:"center",
 fontSize: 28,
 fontWeight: 800,
 letterSpacing:"0.4em",
 padding:"14px 12px",
 border:"2px solid #e5e7eb",
 borderRadius: 12,
 fontFamily:"monospace",
 }}
 />
 {codeError && <p className={errorStyle}>{codeError}</p>}
 <Button
 type="submit"
 fullWidth
 disabled={isLoading}
 style={{ color:"#33373F", backgroundColor:"#CBFF38", paddingTop:"12px", paddingBottom:"12px" }}
 >
 {isLoading ? t("Έλεγχος...","Checking...") : t("Σύνδεση","Log in")}
 </Button>
 <div className="flex justify-between" style={{ fontSize: 14 }}>
 <button type="button" className={linkStyle} style={{ color:"cornflowerblue" }} onClick={() => { setStep("password"); setPassword(""); setMessage(""); }}>
 {t("Πίσω","Back")}
 </button>
 <button type="button" className={linkStyle} style={{ color:"cornflowerblue" }} onClick={handleResendCode}>
 {t("Αποστολή νέου κωδικού","Send a new code")}
 </button>
 </div>
 </form>
 ) : (
 <form onSubmit={handleSubmit} className={formStyle}>
 <div>
 <label htmlFor="email">Email</label>
 <Input
 id="email"
 type="email"
 placeholder="abc@gmail.com"
 value={email}
 onChange={(e) => {
 setEmail(e.target.value);
 setEmailError("");
 }}
 fullWidth
 className="bg-white text-[15px] mt-1"
 autoComplete="email"
 />
 {emailError && <p className={errorStyle}>{emailError}</p>}
 {needsVerification && (
 <p style={{ textAlign:"center", fontSize: 14 }}>
 <button type="button" className={linkStyle} style={{ color:"cornflowerblue" }} onClick={handleResendVerification}>
 {t("Αποστολή νέου συνδέσμου επιβεβαίωσης","Send a new verification link")}
 </button>
 </p>
 )}
 </div>
 <div>
 <div className="flex justify-between">
 <label htmlFor="password">{t("Κωδικός","Password")}</label>
 <Link
 to="/forgot-password"
 className={linkStyle}
 style={{ color:"cornflowerblue", fontSize:"14px" }}
 >
 {t("Ξεχάσατε;","Forgot?")}
 </Link>
 </div>
 <Input
 id="password"
 type="password"
 placeholder={t("Ο κωδικός σας","Enter Your Password")}
 value={password}
 onChange={(e) => {
 setPassword(e.target.value);
 setPasswordError("");
 setEmailError("");
 }}
 fullWidth
 className="bg-white text-[15px] mt-1"
 passwordToggle
 autoComplete="current-password"
 />
 {passwordError && <p className={errorStyle}>{passwordError}</p>}
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
 {isLoading ? t("Σύνδεση...","Logging in...") : t("Σύνδεση","Login")}
 </Button>
 </form>
 )}

 {step ==="password" && (
 <p style={{ textAlign:"center", marginTop:"var(--spacing-md)" }}>
 {t("Δεν έχετε λογαριασμό;","Don't have an account?")}{""}
 <Link
 to={registerHref}
 className={linkStyle}
 style={{ color:"cornflowerblue" }}
 >
 {t("Εγγραφή","Sign Up")}
 </Link>
 </p>
 )}
 </Card>
 </div>
 );
};
