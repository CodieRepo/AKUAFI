"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Save,
  Lock,
  User,
  Building,
  Smartphone,
  Mail,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Production Ready Input with strict dark mode contrast
function SimpleInput({
  label,
  icon: Icon,
  type = "text",
  error,
  ...props
}: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
        )}
        <input
          type={type}
          className={`
                        w-full 
                        ${Icon ? "pl-11" : "pl-4"} pr-4 py-3
                        bg-white dark:bg-slate-800/80
                        text-slate-900 dark:text-slate-100
                        placeholder:text-slate-400 dark:placeholder:text-slate-500
                        border border-slate-200/80 dark:border-slate-700/80
                        focus:border-blue-500 dark:focus:border-blue-400
                        focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20
                        rounded-xl
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed 
                        disabled:bg-slate-50 dark:disabled:bg-slate-900/50
                        shadow-sm hover:shadow-md focus:shadow-md
                        ${error ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
                        ${props.className || ""}
                    `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 mt-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
          {error}
        </p>
      )}
    </div>
  );
}

interface ClientSettingsFormProps {
  user: any;
  client: any;
}

export default function ClientSettingsForm({
  user,
  client,
}: ClientSettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Profile State
  const [companyName, setCompanyName] = useState(client?.client_name || "");
  // Phone is primarily from client profile now, fallback to auth phone for legacy
  const [phone, setPhone] = useState(client?.phone || user?.phone || "");

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Phone Helper: Normalize to 10 digits with prefix if needed
  const normalizePhone = (p: string) => {
    // 1. Remove non-digits
    let n = p.replace(/\D/g, "");

    // 2. If 10 digits, add '91' prefix (assuming India based on context)
    if (n.length === 10) {
      n = "91" + n;
    }

    return n;
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    try {
      // Validate Phone
      const cleanPhone = normalizePhone(phone);

      // Basic length check (10-12 digits allowed)
      if (cleanPhone.length < 10 || cleanPhone.length > 12) {
        throw new Error("Phone number must be valid (10-12 digits)");
      }

      // Update OR Insert Client Table
      if (client?.id) {
        // Update existing
        const { error: clientError } = await supabase
          .from("clients")
          .update({
            client_name: companyName,
            phone: cleanPhone,
          })
          .eq("id", client.id);

        if (clientError) throw clientError;
      } else {
        // Safe fallback: Update by user_id if client.id missing
        const { error: upsertError } = await supabase.from("clients").upsert(
          {
            user_id: user.id,
            client_name: companyName,
            phone: cleanPhone,
          },
          { onConflict: "user_id" },
        );

        if (upsertError) throw upsertError;
      }

      setMessage({ type: "success", text: "Profile updated successfully" });
      router.refresh();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword) {
      setMessage({ type: "error", text: "Current password is required" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    try {
      // 1. Verify Current Password via Re-Auth attempt
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Incorrect current password");
      }

      // 2. Update Password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setMessage({ type: "success", text: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to update password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Alert Message */}
      {message && (
        <div
          className={`p-5 rounded-2xl flex items-start gap-4 shadow-lg border backdrop-blur-sm animate-in slide-in-from-top-3 duration-500 ${
            message.type === "success"
              ? "bg-emerald-50/90 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50"
              : "bg-red-50/90 dark:bg-red-900/20 text-red-900 dark:text-red-300 border-red-200/50 dark:border-red-800/50"
          }`}
        >
          <div
            className={`p-2 rounded-xl ${
              message.type === "success"
                ? "bg-emerald-100 dark:bg-emerald-800/50"
                : "bg-red-100 dark:bg-red-800/50"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 pt-0.5">
            <p className="font-semibold text-sm">{message.text}</p>
          </div>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 dark:from-slate-800/50 dark:via-slate-900/50 dark:to-slate-800/50 px-8 py-6 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Profile Details
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Update your company information
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SimpleInput
              label="Company Name"
              value={companyName}
              onChange={(e: any) => setCompanyName(e.target.value)}
              icon={Building}
              placeholder="Your Company Name"
            />

            {/* Email Field — read-only */}
            <SimpleInput
              label="Email Address"
              value={user?.email ?? ""}
              readOnly
              icon={Mail}
            />

            <SimpleInput
              label="Phone Number"
              value={phone}
              onChange={(e: any) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              icon={Smartphone}
              type="tel"
            />
          </div>

          <div className="mt-8 flex justify-end border-t border-slate-200/80 dark:border-slate-800/80 pt-6">
            <button
              onClick={handleProfileUpdate}
              disabled={loading}
              className="
                                bg-gradient-to-r from-blue-600 to-blue-700 
                                hover:from-blue-700 hover:to-blue-800
                                dark:from-blue-500 dark:to-blue-600
                                dark:hover:from-blue-600 dark:hover:to-blue-700
                                text-white 
                                font-semibold 
                                px-8 py-3
                                rounded-xl
                                shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40
                                transition-all duration-200
                                flex items-center gap-2
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                                active:scale-95
                            "
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50 dark:from-slate-800/50 dark:via-slate-900/50 dark:to-slate-800/50 px-8 py-6 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Security
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Manage your password
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            <div className="bg-slate-50/80 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              <SimpleInput
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e: any) => setCurrentPassword(e.target.value)}
                icon={Lock}
                placeholder="Required to set new password"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SimpleInput
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e: any) => setNewPassword(e.target.value)}
                icon={Lock}
                placeholder="Min 6 characters"
              />
              <SimpleInput
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e: any) => setConfirmPassword(e.target.value)}
                icon={Lock}
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end border-t border-slate-200/80 dark:border-slate-800/80 pt-6">
            <button
              onClick={handlePasswordUpdate}
              disabled={loading || !currentPassword || !newPassword}
              className="
                                bg-gradient-to-r from-purple-600 to-purple-700 
                                hover:from-purple-700 hover:to-purple-800
                                dark:from-purple-500 dark:to-purple-600
                                dark:hover:from-purple-600 dark:hover:to-purple-700
                                text-white
                                font-semibold
                                px-8 py-3
                                rounded-xl
                                shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40
                                transition-all duration-200
                                flex items-center gap-2
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                                active:scale-95
                            "
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>

      {/* Account Info — dev only, not visible in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300/50 dark:border-slate-700/50 p-6 flex flex-col md:flex-row gap-6 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
          <div>
            <span className="block text-slate-500 dark:text-slate-500 mb-2 uppercase tracking-wider text-[10px] font-sans font-bold">
              Client ID
            </span>
            <span className="bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
              {client?.id || "Not Assigned"}
            </span>
          </div>
          <div>
            <span className="block text-slate-500 dark:text-slate-500 mb-2 uppercase tracking-wider text-[10px] font-sans font-bold">
              User ID
            </span>
            <span className="bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
              {user.id}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
