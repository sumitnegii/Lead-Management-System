"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

type Agent = {
  _id?: string;
  name: string;
  chatId: string;
  status: string;
  mobileNumber: string;
  createdAt?: string;
};

const agentStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  inactive: { label: 'Inactive', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-300' },
  busy: { label: 'Busy', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
  away: { label: 'Away', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
};

const defaultAgent: Agent = { name: "", chatId: "", status: "active", mobileNumber: "" };

const AgentPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [form, setForm] = useState<Agent>(defaultAgent);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(data);
    } catch (err) {
      console.error("Load agents error", err);
      toast.error("Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleChange = (field: keyof Agent, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.chatId.trim() || !form.mobileNumber.trim()) {
      toast.error("All fields are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Agent creation failed");
      }
      toast.success(`Agent "${form.name}" created successfully!`);
      setForm(defaultAgent);
      setShowForm(false);
      fetchAgents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.chatId.includes(searchTerm) ||
      agent.mobileNumber.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || agent.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === "active").length,
    inactive: agents.filter(a => a.status === "inactive").length,
    busy: agents.filter(a => a.status === "busy").length,
    away: agents.filter(a => a.status === "away").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex justify-center items-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
            <div className="w-16 h-16 rounded-full border-4 border-transparent border-b-indigo-400 animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="text-lg font-semibold text-slate-600 mt-4">Loading agents...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '14px', padding: '12px 16px' },
          success: { style: { background: '#059669' } },
          error: { style: { background: '#dc2626' } },
        }}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white">
        <div className="container mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/" className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm font-medium mb-2 transition-colors group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold tracking-tight mb-1">Agent Management</h1>
              <p className="text-indigo-200 text-sm">Manage your team of sales agents</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition-all shadow-lg"
            >
              {showForm ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Agent
                </>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">Total</div>
              <div className="text-3xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">Active</div>
              <div className="text-3xl font-bold">{stats.active}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-red-200 text-xs font-semibold uppercase tracking-wider mb-1">Busy</div>
              <div className="text-3xl font-bold">{stats.busy}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-amber-200 text-xs font-semibold uppercase tracking-wider mb-1">Away</div>
              <div className="text-3xl font-bold">{stats.away}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-slate-200 text-xs font-semibold uppercase tracking-wider mb-1">Inactive</div>
              <div className="text-3xl font-bold">{stats.inactive}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-8 py-8">
        {/* Add Agent Form (Collapsible) */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200/60 overflow-hidden mb-6 animate-in">
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-200 px-6 py-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                Add New Agent
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Agent name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Chat ID</label>
                  <input
                    type="text"
                    value={form.chatId}
                    onChange={(e) => handleChange("chatId", e.target.value)}
                    placeholder="Telegram Chat ID"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Mobile Number</label>
                  <input
                    type="tel"
                    value={form.mobileNumber}
                    onChange={(e) => handleChange("mobileNumber", e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="busy">Busy</option>
                    <option value="away">Away</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Create Agent
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200/60 p-5 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <input
                type="text"
                placeholder="Search by name, chat ID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-sm text-slate-700 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="busy">Busy</option>
              <option value="away">Away</option>
            </select>
          </div>
        </div>

        {/* Agent Cards Grid */}
        {filteredAgents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200/60 p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No agents found</h3>
            <p className="text-slate-500 text-sm">
              {agents.length === 0 ? 'Click "Add Agent" to create your first agent' : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => {
              const sc = agentStatusConfig[agent.status] || agentStatusConfig.inactive;
              return (
                <div key={agent._id ?? agent.chatId} className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200/60 overflow-hidden hover:shadow-lg transition-all group">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{agent.name}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text} border ${sc.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${agent.status === 'active' ? 'animate-pulse' : ''}`}></span>
                            {sc.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Chat ID</div>
                          <div className="font-mono text-slate-700 text-xs">{agent.chatId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Mobile</div>
                          <div className="text-slate-700 font-medium text-xs">{agent.mobileNumber}</div>
                        </div>
                      </div>
                      {agent.createdAt && (
                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Added</div>
                            <div className="text-slate-700 text-xs">{new Date(agent.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 text-center text-xs text-slate-400">
          Showing {filteredAgents.length} of {agents.length} agents
          {searchTerm && ` · Filtered by "${searchTerm}"`}
          {filterStatus !== "all" && ` · Status: ${filterStatus}`}
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
