"use client";

import React, { useEffect, useState } from 'react';

type Lead = {
  lead_id: string;
  name: string;
  phone: string;
  requirement: string;
  budget: number;
  status: string;
  agent_name: string;
  previous_agent_name: string;
  created_time: string;
};

type Agent = {
  _id?: string;
  name: string;
  chatId: string;
  status: string;
  mobileNumber: string;
};

const AgentsPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error('Load leads error', err);
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(data);
    } catch (err) {
      console.error('Load agents error', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchAgents();
  }, []);

  const handleAssign = async (lead_id: string) => {
    const agentChatId = selectedAgent[lead_id];
    if (!agentChatId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id, assigned_agent: agentChatId }),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchLeads();
      setSelectedAgent((prev) => {
        const newSel = { ...prev };
        delete newSel[lead_id];
        return newSel;
      });
    } catch (err) {
      console.error('Assign error', err);
      setError(err instanceof Error ? err.message : 'Failed to assign agent');
    } finally {
      setLoading(false);
    }
  };

  if (loading && leads.length === 0) {
    return <div className="container mx-auto p-8 text-center">Loading leads...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Leads Management - Current vs Change Agent</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change Agent (Previous)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign New Agent</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.lead_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">{lead.lead_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {lead.agent_name || 'Unassigned'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {lead.previous_agent_name || 'None'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {lead.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <select 
                    value={selectedAgent[lead.lead_id] || ''}
                    onChange={(e) => setSelectedAgent(prev => ({ ...prev, [lead.lead_id]: e.target.value }))}
                    className="border-gray-300 rounded-md shadow-sm text-xs p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="">Select Agent</option>
                    {agents.map((agent) => (
                      <option key={agent.chatId || agent._id} value={agent.chatId}>
                        {agent.name} ({agent.status})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssign(lead.lead_id)}
                    disabled={!selectedAgent[lead.lead_id] || loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Change Agent
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leads.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500 text-lg">
          No leads found. Ensure backend server is running at localhost:4000 and has data.
        </div>
      )}
    </div>
  );
};

export default AgentsPage;
