"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateClientModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateClientModalProps) {
  const [formData, setFormData] = useState({
    client_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (
      !formData.client_name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("All fields are required");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/admin/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: formData.client_name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create client");
      }

      // Success
      // Clear form (State reset)
      setFormData({
        client_name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      onSuccess(); // Trigger refresh
      onClose(); // Close modal

      // Simple alert as fallback/toast replacement for now
      alert("Client created successfully!");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (typeof err === "object" && err !== null && "message" in err
              ? (err as { message?: string }).message
              : null) || "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Create New Client
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 text-gray-500 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <AdminInput
            label="Client Name"
            name="client_name"
            type="text"
            value={formData.client_name}
            onChange={handleChange}
            placeholder="e.g. Acme Corp"
            required
          />

          <AdminInput
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="client@company.com"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <AdminInput
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
            <AdminInput
              label="Confirm"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="pt-2">
            <AdminButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
              loading={loading}
            >
              {loading ? "Creating..." : "Create Client"}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
