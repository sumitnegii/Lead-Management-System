"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function Login() {
  const router = useRouter();
  const [role, setRole] = useState<"agent" | "team_lead">("team_lead");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("crm_token", data.token);
      localStorage.setItem("crm_role", data.role);
      localStorage.setItem("crm_user", JSON.stringify(data.user));

      toast.success("Welcome back!");
      
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-blue-100 flex items-center justify-center p-6">
      <Toaster position="top-right" />
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="p-8 relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30 transform rotate-3">
              <svg className="w-8 h-8 text-white -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Welcome Back</h1>
            <p className="text-slate-500 font-medium text-sm">Sign in to your CRM dashboard</p>
          </div>

          <div className="flex p-1 bg-slate-100/80 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => setRole("team_lead")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                role === "team_lead"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Team Lead Login
            </button>
            <button
              type="button"
              onClick={() => setRole("agent")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                role === "agent"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Agent Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm outline-none"
                  placeholder="name@company.com"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <Link href="#" className="flex-1 text-right text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm outline-none"
                  placeholder="••••••••"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-8">
            Don't have an account?{" "}
            <Link href="/signup" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
