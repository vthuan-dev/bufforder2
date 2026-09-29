import React, { useState } from "react";
import { Eye, EyeOff, Phone, Lock, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import api from "../services/api";
import logoImage from '../assets/image.png';
import authBg from '../assets/auth-bg.png';

interface LoginPageProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
  onSwitchToAdmin?: () => void;
}

export function LoginPage({ onLogin, onSwitchToRegister, onSwitchToAdmin }: LoginPageProps) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await api.login(phone, password);
      const token = res?.data?.token;
      const user = res?.data?.user;
      if (!token) throw new Error("Missing token");
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user || {}));
      onLogin();
    } catch (e: any) {
      setError(e?.message || "Login failed");
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
          <img src={logoImage} alt="Overstock" className="h-16 md:h-20 inline-block mb-2" style={{ mixBlendMode: 'multiply' }} />
          {/* <p className="text-gray-500 text-sm">Welcome Back</p> */}
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-md border border-blue-200"
        >
          <h2 className="text-lg text-gray-800 mb-5">Login</h2>

          {/* Phone Input */}
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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

          {/* Forgot Password */}
          <div className="text-right mb-5">
            <button className="text-xs text-blue-600 hover:text-blue-700">
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
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
                <span>Login Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
          {error && <div className="text-xs text-red-600 text-center mt-2">{error}</div>}

          {/* Register Link */}
          <div className="text-center">
            <span className="text-gray-600 text-xs">Don't have an account? </span>
            <button
              onClick={onSwitchToRegister}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Register
            </button>
          </div>

          {/* Admin Access */}
          {/* {onSwitchToAdmin && (
            // <div className="mt-4 text-center">
            //   <button
            //     onClick={onSwitchToAdmin}
            //     className="text-xs text-gray-400 hover:text-gray-600 underline"
            //   >
            //     Admin Access
            //   </button>
            // </div>
          )} */}
        </motion.div>
      </div>
      </div>
    </div>
  );
}
