"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function Signup() {
  const router = useRouter();
  const [role, setRole] = useState<"agent" | "team_lead">("team_lead");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobileNumber: "",
    chatId: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: any = {
      role,
      name: formData.name,
      email: formData.email,
      password: formData.password,
    };

    if (role === "agent") {
      payload.mobileNumber = formData.mobileNumber;
      payload.chatId = formData.chatId;
    }

    try {
      const res = await fetch("http://localhost:4000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      toast.success(data.message || "Account created successfully!");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100 flex items-center justify-center p-6">
      <Toaster position="top-right" />
      <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

        <div className="p-8 relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 mb-2">
              Join Us
            </h1>
            <p className="text-slate-500 font-medium text-sm">Create your CRM account</p>
          </div>

          <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => setRole("team_lead")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                role === "team_lead"
                  ? "bg-white text-indigo-700 shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              I'm a Team Lead
            </button>
            <button
              type="button"
              onClick={() => setRole("agent")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                role === "agent"
                  ? "bg-white text-blue-700 shadow-md"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              I'm an Agent
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm outline-none"
                  placeholder="••••••••"
                />
              </div>

              {role === "agent" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Mobile Number</label>
                    <input
                      name="mobileNumber"
                      type="tel"
                      required
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm outline-none"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Chat ID <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      name="chatId"
                      type="text"
                      value={formData.chatId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm outline-none"
                      placeholder="e.g. AGT-1001"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-8">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
