import Link from "next/link";
import React from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>
      
      {/* Brand Header */}
      <div className="mb-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200">
          <svg width="32" height="32" fill="none" stroke="#fff" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">LeadCRM</h1>
        <p className="text-slate-500 font-medium text-lg">Select your workspace to continue</p>
      </div>

      {/* Button Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        
        {/* Lead Dashboard (Team Lead) */}
        <Link href="/lead-dashboard" 
          className="group relative bg-white border border-slate-200 rounded-3xl p-8 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-white rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
          
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-200/50 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 mb-2">Team Lead Dashboard</h2>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 flex-1">
            Manage the entire lead pipeline, assign agents, view analytics, and monitor performance.
          </p>
          
          <div className="flex items-center text-sm font-bold text-indigo-600">
            Access Dashboard
            <svg className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </div>
        </Link>
        
        {/* Agent Dashboard */}
        <Link href="/agent-dashboard" 
          className="group relative bg-white border border-slate-200 rounded-3xl p-8 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-white rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
          
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-200/50 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 mb-2">Agent Workspace</h2>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 flex-1">
            View your assigned leads, take private notes, copy numbers, and close deals directly.
          </p>
          
          <div className="flex items-center text-sm font-bold text-emerald-600">
            Access Workspace 
            <svg className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </div>
        </Link>
        
      </div>

      {/* Footer Text */}
      <div className="mt-16 text-xs text-slate-400 font-medium">
        Powered by LeadCRM
      </div>
    </div>
  );
}
