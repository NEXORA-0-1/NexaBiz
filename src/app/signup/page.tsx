"use client"

import { useState } from "react";
import { Eye, EyeOff, User, Mail, Lock, Sparkles } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const generateUserId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "UID";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSignup = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const generatedUserId = generateUserId();
      alert(
        `Signup successful! Your User ID is ${generatedUserId}. Please wait for admin approval.`
      );
    } catch (error) {
      console.error("Signup error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength =
    password.length === 0
      ? 0
      : password.length < 6
      ? 33
      : password.length < 10
      ? 66
      : 100;
  const strengthColor =
    passwordStrength < 33
      ? "bg-red-500"
      : passwordStrength < 66
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-8 transform transition-all duration-500 hover:shadow-cyan-500/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl mb-4 shadow-lg transform transition-transform hover:scale-110 hover:rotate-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
              Create Account
            </h1>
            <p className="text-gray-300">Join us and start your journey</p>
          </div>

          <div className="space-y-5">
            {/* Name Input */}
            <div className="relative">
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                  focusedField === "name" ? "text-cyan-400" : "text-gray-400"
                }`}
              >
                <User className="w-5 h-5" />
              </div>
              <input
                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 focus:outline-none bg-gray-700 text-white ${
                  focusedField === "name"
                    ? "border-cyan-500 shadow-lg shadow-cyan-800"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                type="text"
                placeholder="Full Name"
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField("")}
                value={name}
              />
            </div>

            {/* Email Input */}
            <div className="relative">
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                  focusedField === "email" ? "text-cyan-400" : "text-gray-400"
                }`}
              >
                <Mail className="w-5 h-5" />
              </div>
              <input
                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-300 focus:outline-none bg-gray-700 text-white ${
                  focusedField === "email"
                    ? "border-cyan-500 shadow-lg shadow-cyan-800"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                type="email"
                placeholder="Email Address"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField("")}
                value={email}
              />
            </div>

           {/* Password Input */}
            <div className="relative">
              {/* Lock Icon */}
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                  focusedField === "password" ? "text-cyan-400" : "text-gray-400"
                }`}
              >
                <Lock className="w-5 h-5" />
              </div>

              {/* Input */}
              <input
                className={`w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all duration-300 focus:outline-none bg-gray-700 text-white ${
                  focusedField === "password"
                    ? "border-cyan-500 shadow-lg shadow-cyan-800"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField("")}
                value={password}
              />

              {/* Eye Icon */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors z-10"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        passwordStrength < 33
                          ? "bg-red-500"
                          : passwordStrength < 66
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {passwordStrength < 33 && "Weak password"}
                    {passwordStrength >= 33 && passwordStrength < 66 && "Medium strength"}
                    {passwordStrength >= 66 && "Strong password"}
                  </p>
                </div>
              )}
            </div>


            {/* Submit Button */}
            <button
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-2 rounded font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6 relative overflow-hidden group"
              onClick={handleSignup}
              disabled={loading || !name || !email || !password}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:underline"
              >
                Log In
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6 drop-shadow-lg">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
