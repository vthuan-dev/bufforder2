import React, { useState } from "react";
import { Eye, EyeOff, Phone, Lock, Ticket, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import api from "../services/api";
import authBg from '../assets/auth-bg.png';
import { OverstockLogo } from './common/OverstockLogo';

interface RegisterPageProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onRegister, onSwitchToLogin }: RegisterPageProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");

  // Client-side validation to improve UX (backend also validates)
  const VALID_INVITE_CODES = new Set([
    '570318',
    '942615',
    '803247',
    '169437',
    '285074',
    '637890',
    '451908',
    '726349',
    '394176',
    '820564',
  ]);

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!agreedToTerms) {
      setError("Please agree to the Terms and Conditions");
      return;
    }
    if (!phone || !password || !confirmPassword || !inviteCode) {
      setError("Please fill in all required fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!VALID_INVITE_CODES.has(inviteCode.trim())) {
      setError("Invalid invitation code");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await api.register({ phoneNumber: phone, password, fullName, inviteCode });
      const token = res?.data?.token;
      const user = res?.data?.user;
      if (!token) throw new Error("Registration failed: missing token");
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user || {}));
      onRegister();
    } catch (e: any) {
      setError(e?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/90 flex justify-center">
      <div
        className="relative w-full min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6"
        style={{ maxWidth: '430px' }}
      >
        {/* Background clipped inside the 430px container */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${authBg})` }} />

        {/* Soft atmospheric overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-blue-900/25 pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-center mb-5 flex flex-col items-center"
          >
            <div className="inline-flex items-center justify-center px-6 py-3 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] border border-white/80 transition-transform duration-200 hover:scale-102">
              <OverstockLogo href="/" svgClassName="h-7 md:h-8 w-auto text-gray-900" />
            </div>
            <p className="text-white/90 text-xs font-medium tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] mt-2">
              Create your account
            </p>
          </motion.div>

          {/* Register Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(15,40,95,0.22),0_4px_12px_rgba(0,0,0,0.03)] border border-white/90 ring-1 ring-black/[0.02]"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Register</h2>
              <p className="text-xs text-slate-500 mt-1">Fill in the information below to get started</p>
            </div>

            {/* Full Name */}
            <div className="mb-3">
              <label className="block text-[13px] font-medium text-slate-600 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="off"
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-blue-500 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="mb-3">
              <label className="block text-[13px] font-medium text-slate-600 mb-1">Phone Number</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="off"
                  placeholder="Enter your phone number"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-blue-500 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="mb-3">
              <label className="block text-[13px] font-medium text-slate-600 mb-1">Set Password</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="6-20 characters, letters & numbers"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-blue-500 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="mb-3">
              <label className="block text-[13px] font-medium text-slate-600 mb-1">Confirm Password</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-blue-500 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Invite Code Input (Required) */}
            <div className="mb-3">
              <label className="block text-[13px] font-medium text-slate-600 mb-1">
                Invitation Code <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none flex items-center justify-center">
                  <Ticket className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invitation code (required)"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-blue-500 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 shadow-sm"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Registration requires a valid invitation code
              </p>
            </div>

            {/* Terms Checkbox */}
            <div className="mb-4">
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded-md border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-colors"
                />
                <span className="text-xs text-slate-600 flex-1 leading-relaxed">
                  I agree to the{" "}
                  <button type="button" className="font-medium text-blue-600 hover:text-blue-700 underline transition-colors">
                    Terms and Conditions
                  </button>
                </span>
              </label>
            </div>

            {/* Register Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-2xl shadow-[0_12px_28px_-6px_rgba(37,99,235,0.45)] hover:shadow-[0_16px_32px_-6px_rgba(37,99,235,0.55)] transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 mb-4 cursor-pointer"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <span>Register Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-600 bg-red-50/90 border border-red-100 rounded-xl p-2.5 text-center mb-4"
              >
                {error}
              </motion.div>
            )}

            {/* Login Link */}
            <div className="text-center pt-3 border-t border-slate-100">
              <span className="text-slate-500 text-xs">Already have an account? </span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                Login
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
