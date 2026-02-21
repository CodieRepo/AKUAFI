"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
// Wait, I should check if 'sonner' or 'react-hot-toast' is installed.
// Creating without toast import first, will check package.json in next step if generic alert is needed or strictly toast.
// Plan said "Success Toast", I'll assume a standard simple alert or console if no library found, but usually standard stacks have one.
// Actually, I'll use a simple embedded success message or standard alert for now to be safe, or just 'alert()' if no UI lib.
// Better: I see 'Global' css has 'glass-panel', I'll use that style.

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
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Create New Client
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Client Name
            </label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="client@company.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Creating...
                </>
              ) : (
                "Create Client"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
