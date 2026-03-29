"use client"
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

interface Lead {
  lead_id: string;
  name: string;
  phone: string;
  requirement: string;
  budget: number;
  user_chat_id: number;
  status: string;
  assigned_agent: string;
  previous_agent: string;
  last_update: string;
  created_time: string;
  agent_name?: string;
}

interface Agent {
  id: string;
  name: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  assigned: { label: 'Assigned', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  queued: { label: 'Queued', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  on_hold: { label: 'On Hold', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200' },
  closed: { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-300' },
  active: { label: 'Active', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  pending: { label: 'Pending', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200' },
};

const LEADS_PER_PAGE = 15;

const formatDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const getDateKey = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'unknown';
    return d.toISOString().split('T')[0];
  } catch {
    return 'unknown';
  }
};

const Page = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'daywise'>('table');

  const fetchData = async () => {
    const fetchLeads = async () => {
      try {
        const res = await fetch("/api/leads");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLeads(data);
      } catch (err) {
        console.error("Fetch leads error:", err);
        setError("Failed to connect to backend server");
      }
    };

    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAgents(data.map((agent: any) => ({
          id: agent.chatId || agent._id,
          name: agent.name || 'Unassigned'
        })));
      } catch (err) {
        console.error("Fetch agents error:", err);
      }
    };

    setLoading(true);
    await Promise.all([fetchLeads(), fetchAgents()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterDate, viewMode]);

  const handleAgentChange = async (leadId: string, newAgentId: string) => {
    try {
      const res = await fetch(`/api/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, assigned_agent: newAgentId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Agent updated successfully');
      const leadsRes = await fetch('/api/leads');
      const data = await leadsRes.json();
      setLeads(data);
    } catch (err) {
      console.error("Error updating agent:", err);
      toast.error('Failed to update agent');
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch =
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm) ||
        lead.requirement?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || lead.status === filterStatus;

      const matchesDate = filterDate === "all" || getDateKey(lead.created_time) === filterDate;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [leads, searchTerm, filterStatus, filterDate]);

  // Available dates for the date filter
  const availableDates = useMemo(() => {
    const dateMap = new Map<string, { key: string; label: string; count: number }>();
    leads.forEach(lead => {
      const key = getDateKey(lead.created_time);
      if (!dateMap.has(key)) {
        dateMap.set(key, { key, label: formatDateLabel(lead.created_time), count: 0 });
      }
      dateMap.get(key)!.count++;
    });
    return Array.from(dateMap.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [leads]);

  // Day-wise grouping
  const dayWiseLeads = useMemo(() => {
    const grouped = new Map<string, { label: string; leads: Lead[] }>();
    filteredLeads.forEach(lead => {
      const key = getDateKey(lead.created_time);
      if (!grouped.has(key)) {
        grouped.set(key, { label: formatDateLabel(lead.created_time), leads: [] });
      }
      grouped.get(key)!.leads.push(lead);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredLeads]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * LEADS_PER_PAGE;
    return filteredLeads.slice(start, start + LEADS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  // Day-wise pagination (paginate by total leads across all days)
  const paginatedDayWise = useMemo(() => {
    const start = (currentPage - 1) * LEADS_PER_PAGE;
    const end = start + LEADS_PER_PAGE;
    let count = 0;
    const result: { key: string; label: string; leads: Lead[] }[] = [];
    for (const [key, { label, leads: dayLeads }] of dayWiseLeads) {
      const dayStart = count;
      const dayEnd = count + dayLeads.length;
      if (dayEnd > start && dayStart < end) {
        const sliceStart = Math.max(0, start - dayStart);
        const sliceEnd = Math.min(dayLeads.length, end - dayStart);
        result.push({ key, label, leads: dayLeads.slice(sliceStart, sliceEnd) });
      }
      count += dayLeads.length;
    }
    return result;
  }, [dayWiseLeads, currentPage]);

  const stats = {
    total: leads.length,
    assigned: leads.filter(l => l.status === "assigned").length,
    queued: leads.filter(l => l.status === "queued").length,
    on_hold: leads.filter(l => l.status === "on_hold").length,
    closed: leads.filter(l => l.status === "closed").length
  };

  const renderLeadRow = (lead: Lead, index: number) => {
    const sc = statusConfig[lead.status] || { label: lead.status, bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-300' };
    return (
      <tr key={lead.lead_id || index} className="hover:bg-blue-50/40 transition-colors group">
        <td className="py-4 px-6">
          <div>
            <div className="font-semibold text-slate-800 text-sm">{lead.name}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">{lead.lead_id}</div>
          </div>
        </td>
        <td className="py-4 px-6">
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {lead.phone}
          </div>
        </td>
        <td className="py-4 px-6">
          <div className="max-w-[200px] text-sm text-slate-600 line-clamp-2">{lead.requirement}</div>
        </td>
        <td className="py-4 px-6">
          <div className="font-bold text-emerald-600 text-sm">
            ${lead.budget?.toLocaleString()}
          </div>
        </td>
        <td className="py-4 px-6">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${sc.bg} ${sc.text} border ${sc.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
            {sc.label}
          </span>
        </td>
        <td className="py-4 px-6">
          <select
            value={lead.assigned_agent}
            onChange={(e) => handleAgentChange(lead.lead_id, e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-50 transition-all font-medium text-xs text-slate-700 hover:bg-white cursor-pointer"
          >
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          {lead.previous_agent && (
            <div className="text-[10px] text-slate-400 mt-1 truncate">
              Prev: {agents.find(a => a.id === lead.previous_agent)?.name || '—'}
            </div>
          )}
        </td>
        <td className="py-4 px-6">
          <div className="flex justify-center">
            <Link
              href={`/lead/${lead.lead_id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold text-xs hover:bg-blue-100 hover:text-blue-700 transition-all group-hover:shadow-sm border border-transparent hover:border-blue-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
          </div>
        </td>
      </tr>
    );
  };

  const renderTableHeader = () => (
    <thead>
      <tr className="bg-slate-50/80 border-b border-slate-200">
        <th className="py-3.5 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Info</th>
        <th className="py-3.5 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
        <th className="py-3.5 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Requirement</th>
        <th className="py-3.5 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Budget</th>
        <th className="py-3.5 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
        <th className="py-3.5 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Agent</th>
        <th className="py-3.5 px-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          Showing {((currentPage - 1) * LEADS_PER_PAGE) + 1}–{Math.min(currentPage * LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          {pages.map((page, i) =>
            page === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-xs">...</span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page as number)}
                className={`min-w-[32px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex justify-center items-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
            <div className="w-16 h-16 rounded-full border-4 border-transparent border-b-indigo-400 animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="text-lg font-semibold text-slate-600 mt-4">Loading leads...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-8">
        <div className="max-w-lg mx-auto mt-20">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Connection Error</h1>
            <p className="text-slate-500 mb-6">{error}</p>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
              <p className="text-sm text-slate-600 mb-2 font-medium">Start the backend server:</p>
              <code className="block bg-slate-900 text-emerald-400 px-4 py-2.5 rounded-lg font-mono text-sm">
                cd backend && node server.js
              </code>
            </div>
            <button
              onClick={() => { setError(null); fetchData(); }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              Retry Connection
            </button>
          </div>
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
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
        <div className="container mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">Lead Management</h1>
              <p className="text-blue-200 text-sm">Track and manage your sales leads efficiently</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10"
                title="Refresh data"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <Link
                href="/agent"
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Manage Agents
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Total</div>
              <div className="text-3xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">Assigned</div>
              <div className="text-3xl font-bold">{stats.assigned}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-amber-200 text-xs font-semibold uppercase tracking-wider mb-1">Queued</div>
              <div className="text-3xl font-bold">{stats.queued}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-orange-200 text-xs font-semibold uppercase tracking-wider mb-1">On Hold</div>
              <div className="text-3xl font-bold">{stats.on_hold}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-slate-200 text-xs font-semibold uppercase tracking-wider mb-1">Closed</div>
              <div className="text-3xl font-bold">{stats.closed}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-8">
        {/* Search, Filter, and View Toggle */}
        <div className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200/60 p-5 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <input
                type="text"
                placeholder="Search by name, phone, or requirement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all font-medium text-sm text-slate-700 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="queued">Queued</option>
              <option value="on_hold">On Hold</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all font-medium text-sm text-slate-700 cursor-pointer"
            >
              <option value="all">All Dates</option>
              {availableDates.map(d => (
                <option key={d.key} value={d.key}>{d.label} ({d.count})</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('daywise')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'daywise'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Day-wise View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Leads Display */}
        {filteredLeads.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200/60 p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No leads found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'table' ? (
          /* ===== TABLE VIEW ===== */
          <div className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" suppressHydrationWarning>
                {renderTableHeader()}
                <tbody className="divide-y divide-slate-100">
                  {paginatedLeads.map((lead, index) => renderLeadRow(lead, index))}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </div>
        ) : (
          /* ===== DAY-WISE VIEW ===== */
          <div className="space-y-6">
            {paginatedDayWise.map(({ key, label, leads: dayLeads }) => (
              <div key={key} className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                {/* Day Header */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{label}</h3>
                      <p className="text-xs text-slate-500">{key !== 'unknown' ? key : 'No date'}</p>
                    </div>
                  </div>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {dayLeads.length} lead{dayLeads.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* Day Table */}
                <div className="overflow-x-auto">
                  <table className="w-full" suppressHydrationWarning>
                    {renderTableHeader()}
                    <tbody className="divide-y divide-slate-100">
                      {dayLeads.map((lead, index) => renderLeadRow(lead, index))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {/* Pagination for day-wise */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-md shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                {renderPagination()}
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-5 text-center text-xs text-slate-400">
          Showing {filteredLeads.length} of {leads.length} leads
          {searchTerm && ` · Filtered by "${searchTerm}"`}
          {filterStatus !== "all" && ` · Status: ${filterStatus}`}
          {filterDate !== "all" && ` · Date: ${filterDate}`}
          {` · Page ${currentPage} of ${totalPages || 1}`}
        </div>
      </div>
    </div>
  );
};

export default Page;