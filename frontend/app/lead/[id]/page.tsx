"use client"
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

interface Lead {
  lead_id: string;
  name: string;
  phone: string;
  requirement: string;
  budget: number;
  status: string;
  assigned_agent: string;
  previous_agent?: string;
  previous_agent_name?: string;
  notes?: string;
  agent_name?: string;
  created_time?: string;
  last_update?: string;
}

interface Agent {
  id: string;
  name: string;
}

const statuses = ['assigned', 'queued', 'on_hold', 'closed'] as const;

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  assigned: { label: 'Assigned', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  queued: { label: 'Queued', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  on_hold: { label: 'On Hold', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200' },
  closed: { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-300' },
};

const LeadDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    requirement: '',
    budget: '',
    status: '',
    assigned_agent: '',
    notes: ''
  });

  useEffect(() => {
    fetchLead();
    fetchAgents();
  }, [leadId]);

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) throw new Error('Failed to fetch lead');
      const data = await res.json();
      setLead(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        requirement: data.requirement || '',
        budget: data.budget?.toString() || '',
        status: data.status || 'assigned',
        assigned_agent: data.assigned_agent || '',
        notes: data.notes || ''
      });
    } catch {
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.map((agent: any) => ({
          id: agent.chatId || agent._id,
          name: agent.name || 'Unassigned'
        })));
      }
    } catch {
      console.error('Failed to fetch agents');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assigned_agent || !formData.status) {
      toast.error('Agent and status are required');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/update-lead', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          assigned_agent: formData.assigned_agent,
          status: formData.status,
          notes: formData.notes
        })
      });

      if (!res.ok) throw new Error('Update failed');

      toast.success('Lead updated successfully!');
      setTimeout(() => {
        router.push('/');
      }, 800);
    } catch {
      toast.error('Failed to update lead');
    } finally {
      setUpdating(false);
    }
  };

  const currentStatus = statusConfig[formData.status] || statusConfig.assigned;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
            <div className="w-16 h-16 rounded-full border-4 border-transparent border-b-indigo-400 animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-xl border border-slate-200/60 p-10">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Lead Not Found</h1>
          <p className="text-slate-500 mb-8">The lead you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
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

      {/* Top Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold transition-colors"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${currentStatus.bg} ${currentStatus.text} border ${currentStatus.border}`}>
            <span className={`w-2 h-2 rounded-full ${currentStatus.dot} animate-pulse`}></span>
            {currentStatus.label}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{lead.name}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-xs">ID: {lead.lead_id}</span>
                {lead.created_time && (
                  <span>Created {new Date(lead.created_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                )}
                {lead.last_update && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>Updated {new Date(lead.last_update).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden">

            {/* Info Summary Bar */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200/60 px-8 py-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</div>
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {lead.phone}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Budget</div>
                  <div className="font-bold text-emerald-600 text-lg">${lead.budget?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Agent</div>
                  <div className="font-semibold text-slate-800">{lead.agent_name || 'Unassigned'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Prev Agent</div>
                  <div className="font-medium text-slate-500">{lead.previous_agent_name || 'None'}</div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Full Name
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      Phone Number
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                    required
                  />
                </div>

                {/* Requirement - full width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      Requirement
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.requirement}
                    onChange={(e) => setFormData({...formData, requirement: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all resize-none"
                    required
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Budget
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Status
                    </span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
                    required
                  >
                    {statuses.map(status => {
                      const cfg = statusConfig[status];
                      return (
                        <option key={status} value={status}>
                          {cfg?.label || status}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Assigned Agent */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Assigned Agent
                    </span>
                  </label>
                  <select
                    value={formData.assigned_agent}
                    onChange={(e) => setFormData({...formData, assigned_agent: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select Agent</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Budget (readonly label placeholder for alignment) */}
                <div></div>

                {/* Notes - full width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Notes
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all resize-none"
                    placeholder="Add internal notes, follow-up details, or context about this lead..."
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-slate-50/80 border-t border-slate-200/60 px-8 py-5">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="px-6 py-3 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={updating}
                  className="relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Update Lead
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadDetailPage;
