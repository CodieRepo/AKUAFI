"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, Plus, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import CreateClientModal from "@/components/admin/clients/CreateClientModal";

interface ClientDashboard {
  client_id: string;
  total_campaigns: number;
  total_qr: number;
  total_claims: number;
  unique_users: number;
}

type ClientRow = {
  id: string;
  client_name: string;
  total_campaigns: number;
  total_qr: number;
  total_claims: number;
  unique_users: number;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Fetch clients list and analytics view in parallel
      const [
        { data: clientsData, error: clientsErr },
        { data: viewData, error: viewErr },
      ] = await Promise.all([
        supabase.from("clients").select("id, client_name"),
        supabase.from("client_dashboard_v1").select("*"),
      ]);

      if (clientsErr) throw clientsErr;
      if (viewErr) throw viewErr;

      // Build analytics lookup by client_id
      const analyticsMap: Record<string, ClientDashboard> = {};
      (viewData || []).forEach((row) => {
        analyticsMap[row.client_id] = row;
      });

      // Merge
      const merged: ClientRow[] = (clientsData || []).map((c) => {
        const a = analyticsMap[c.id] || {};
        return {
          id: c.id,
          client_name: c.client_name,
          total_campaigns: Number(a.total_campaigns || 0),
          total_qr: Number(a.total_qr || 0),
          total_claims: Number(a.total_claims || 0),
          unique_users: Number(a.unique_users || 0),
        };
      });

      setClients(merged);
    } catch (err: Error | string | unknown) {
      setError("Failed to load clients");
      console.error("[ClientsPage]", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header — Create Client button preserved */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Clients
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage client accounts and campaign analytics
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Create Client
        </button>
      </div>

      {/* Analytics Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Totals summary bar */}
        {!isLoading && clients.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 flex gap-8 text-xs text-gray-500 dark:text-gray-400">
            <span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {clients.length}
              </span>{" "}
              clients
            </span>
            <span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {clients
                  .reduce((s, c) => s + c.total_campaigns, 0)
                  .toLocaleString()}
              </span>{" "}
              campaigns
            </span>
            <span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {clients.reduce((s, c) => s + c.total_qr, 0).toLocaleString()}
              </span>{" "}
              QR generated
            </span>
            <span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {clients
                  .reduce((s, c) => s + c.total_claims, 0)
                  .toLocaleString()}
              </span>{" "}
              claims
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                  Campaigns
                </th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                  QR Generated
                </th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                  Claims
                </th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                  Unique Users
                </th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No clients yet. Create one to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {client.client_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {client.total_campaigns.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {client.total_qr.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {client.total_claims.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {client.unique_users.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
                      >
                        View <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Client Modal — untouched */}
      <CreateClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchClients}
      />
    </div>
  );
}
