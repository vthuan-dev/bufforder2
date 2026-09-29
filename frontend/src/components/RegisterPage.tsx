import React, { useState } from "react";
import { Eye, EyeOff, Phone, Lock, Ticket, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import api from "../services/api";
import authBg from '../assets/auth-bg.png';
const logo = new URL("../assets/image.png", import.meta.url).toString();

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
    <div className="min-h-screen bg-slate-300 flex justify-center">
      <div
        className="relative w-full min-h-screen overflow-hidden flex flex-col items-center justify-center p-4"
        style={{ maxWidth: '430px' }}
      >
        {/* Background clipped inside the 430px container */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${authBg})` }} />
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <img src={logo} alt="Overstock" className="h-16 md:h-20 mx-auto mb-2 object-contain" />
          <p className="text-gray-500 text-sm">Create Your Account</p>
        </motion.div>

        {/* Register Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-md border border-blue-200"
        >
          <h2 className="text-lg text-gray-800 mb-5">Register</h2>

          {/* Full Name */}
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1.5">Full Name</label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="off"
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-gray-50 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Phone Input */}
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="off"
                placeholder="Enter your phone number"
                className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1.5">Set Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="6-20 characters, include letters and numbers"
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Invite Code Input (Required) */}
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-1.5">
              Invitation Code <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invitation code (required)"
                className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Registration requires a valid invitation code
            </p>
          </div>

          {/* Terms Checkbox */}
          <div className="mb-5">
            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs text-gray-600 flex-1">
                I agree to the{" "}
                <button className="text-blue-600 hover:text-blue-700 underline">
                  Terms and Conditions
                </button>
              </span>
            </label>
          </div>

          {/* Register Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl shadow-md transition-all disabled:opacity-70 flex items-center justify-center gap-2 mb-4"
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
          {error && <div className="text-xs text-red-600 text-center mt-2">{error}</div>}

          {/* Login Link */}
          <div className="text-center">
            <span className="text-gray-600 text-xs">Already have an account? </span>
            <button
              onClick={onSwitchToLogin}
              className="text-xs text-blue-600 hover:text-blue-700"
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
