"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Building2,
  Megaphone,
  QrCode,
  Ticket,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import CreateClientModal from "@/components/admin/clients/CreateClientModal";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  AdminTableHeadCell,
} from "@/components/admin/ui/AdminTable";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminLoadingState } from "@/components/admin/ui/AdminLoadingState";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";

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
    <div className="space-y-8">
      <AdminPageHeader
        title="Clients"
        description="Manage client accounts and campaign analytics"
        actions={
          <AdminButton
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Create Client
          </AdminButton>
        }
      />

      {/* Summary Stats */}
      {!isLoading && clients.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AdminCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Total Clients
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clients.length}
                </p>
              </div>
            </div>
          </AdminCard>
          <AdminCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Campaigns
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clients
                    .reduce((s, c) => s + c.total_campaigns, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </AdminCard>
          <AdminCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  QR Codes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clients.reduce((s, c) => s + c.total_qr, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </AdminCard>
          <AdminCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Claims
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clients
                    .reduce((s, c) => s + c.total_claims, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* Clients Table */}
      {isLoading ? (
        <AdminLoadingState text="Loading clients..." />
      ) : error ? (
        <AdminCard className="p-8 text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </AdminCard>
      ) : clients.length === 0 ? (
        <AdminEmptyState
          icon={<Users className="h-8 w-8" strokeWidth={1.5} />}
          title="No clients yet"
          description="Create your first client to get started with campaign management"
          action={
            <AdminButton onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Client
            </AdminButton>
          }
        />
      ) : (
        <AdminTable>
          <AdminTableHeader>
            <AdminTableRow>
              <AdminTableHeadCell>Client Name</AdminTableHeadCell>
              <AdminTableHeadCell>Campaigns</AdminTableHeadCell>
              <AdminTableHeadCell>QR Generated</AdminTableHeadCell>
              <AdminTableHeadCell>Claims</AdminTableHeadCell>
              <AdminTableHeadCell>Unique Users</AdminTableHeadCell>
              <AdminTableHeadCell>Action</AdminTableHeadCell>
            </AdminTableRow>
          </AdminTableHeader>
          <AdminTableBody>
            {clients.map((client) => (
              <AdminTableRow key={client.id}>
                <AdminTableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {client.client_name}
                    </span>
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-purple-500" />
                    <span>{client.total_campaigns.toLocaleString()}</span>
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-blue-500" />
                    <span>{client.total_qr.toLocaleString()}</span>
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminBadge variant="success">
                    {client.total_claims.toLocaleString()}
                  </AdminBadge>
                </AdminTableCell>
                <AdminTableCell>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-500" />
                    <span>{client.unique_users.toLocaleString()}</span>
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-semibold"
                  >
                    View Details
                  </Link>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTableBody>
        </AdminTable>
      )}

      <CreateClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchClients}
      />
    </div>
  );
}
