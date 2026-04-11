import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "@/store/slices/authSlice";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Card } from "@/components/atoms/Card/Card";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import { KeyRound, ArrowLeft, Mail, ChevronRight } from "lucide-react";

const containerStyle = css`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
  background: linear-gradient(
    135deg,
    #f8fafc 0%,
    #f1f5f9 100%
  );
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    background: #CBFF38;
    filter: blur(100px);
    opacity: 0.1;
    top: -100px;
    right: -100px;
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    width: 250px;
    height: 250px;
    background: #3b82f6;
    filter: blur(100px);
    opacity: 0.05;
    bottom: -80px;
    left: -80px;
    border-radius: 50%;
  }
`;

const cardStyle = css`
  width: 100%;
  max-width: 480px;
  padding: 40px;
  border-radius: 32px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
  background: white;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  z-index: 10;
`;

const headerStyle = css`
  text-align: center;
  margin-bottom: 32px;
`;

const iconContainerStyle = css`
  width: 64px;
  height: 64px;
  background: #CBFF38;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 15px -3px rgba(203, 255, 56, 0.3);
`;

const titleStyle = css`
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
`;

const subtitleStyle = css`
  font-size: 15px;
  color: #64748b;
  font-weight: 500;
  line-height: 1.6;
`;

const formStyle = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const errorStyle = css`
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #ef4444;
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const successStyle = css`
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  color: #166534;
  padding: 16px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
`;

export const ForgotPassword: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    try {
      await dispatch(forgotPassword({ email })).unwrap();
      setIsSuccess(true);
      setMessage("Recovery link has been dispatched to your email address.");
    } catch (err: any) {
      setMessage(err || "Failed to initiate recovery. Please verify your email.");
    }
  };

  if (isSuccess) {
    return (
      <div className={containerStyle}>
        <Card className={cardStyle}>
          <div className={headerStyle}>
            <div className={iconContainerStyle} style={{ background: '#dcfce7' }}>
              <Mail className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className={titleStyle}>Check your inbox</h2>
            <p className={subtitleStyle}>
              We've sent a password reset link to <br/>
              <span className="font-bold text-slate-800">{email}</span>
            </p>
          </div>
          
          <div className={successStyle}>
            Email sent successfully!
          </div>

          <Button
            onClick={() => navigate("/login")}
            fullWidth
            className="mt-8 h-12 rounded-[16px] bg-slate-900 text-white hover:bg-slate-800 font-bold uppercase tracking-widest text-[11px]"
          >
            Return to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={containerStyle}>
      <Link 
        to="/login"
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold uppercase text-[11px] tracking-widest group"
      >
        <div className="size-8 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:-translate-x-1 transition-transform">
          <ArrowLeft size={14} />
        </div>
        Back to Login
      </Link>

      <Card className={cardStyle}>
        <div className={headerStyle}>
          <div className={iconContainerStyle}>
            <KeyRound className="h-8 w-8 text-slate-900" />
          </div>
          <h2 className={titleStyle}>Forgot Password?</h2>
          <p className={subtitleStyle}>
            Enter the email associated with your account <br/>
            and we'll send you instructions to reset.
          </p>
        </div>

        {message && !isSuccess && <div className={errorStyle}>{message}</div>}
        {error && <div className={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} className={formStyle}>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <Input
              type="email"
              placeholder="e.g. alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              className="bg-slate-50 border-slate-100 h-14 rounded-[16px] text-[15px] font-medium focus:bg-white transition-all"
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
            />
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={isLoading}
            className="mt-4 h-14 rounded-[16px] bg-[#CBFF38] text-slate-900 hover:bg-[#b0e625] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="font-black uppercase tracking-widest text-[12px]">
              {isLoading ? "Processing..." : "Reset Password"}
            </span>
            {!isLoading && <ChevronRight size={18} className="translate-y-[1px]" />}
          </Button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-500 font-medium">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-bold hover:underline"
          >
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default ForgotPassword;
