'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
// import { Button } from '@/components/ui/Button'; // Swapping for raw button as requested for specific styling
import { Save, Lock, User, Building, Smartphone, Mail, AlertCircle, CheckCircle, Loader2, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Production Ready Input with strict dark mode contrast (User Requirement 2)
function SimpleInput({ label, icon: Icon, type = "text", error, ...props }: any) {
    return (
        <div className="space-y-1.5">
             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
             <div className="relative group">
                 {Icon && <Icon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />}
                 <input 
                    type={type}
                    className={`
                        bg-slate-900
                        text-white
                        placeholder:text-slate-400
                        border border-slate-700
                        focus:border-blue-500
                        focus:ring-1 focus:ring-blue-500
                        px-4 py-2 ${Icon ? 'pl-10' : ''}
                        rounded-lg
                        w-full
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        ${props.className || ''}
                    `}
                    {...props}
                 />
             </div>
             {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}

interface CampaignMOVRow {
    id: string;
    name: string;
    minimum_order_value: number | null;
}

interface ClientSettingsFormProps {
    user: any;
    client: any;
    campaigns: CampaignMOVRow[];
}

export default function ClientSettingsForm({ user, client, campaigns }: ClientSettingsFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [movLoading, setMovLoading] = useState(false);

    // MOV state — keyed by campaign id
    const [movValues, setMovValues] = useState<Record<string, string>>(
        () => Object.fromEntries(
            campaigns.map(c => [c.id, String(c.minimum_order_value ?? 0)])
        )
    );

    // Re-sync when campaigns prop updates after router.refresh()
    // (useState lazy init only runs once; useEffect catches subsequent renders with fresh DB data)
    useEffect(() => {
        setMovValues(
            Object.fromEntries(
                campaigns.map(c => [c.id, String(c.minimum_order_value ?? 0)])
            )
        );
    }, [campaigns]);
    
    // Profile State
    const [companyName, setCompanyName] = useState(client?.client_name || '');
    // Phone is primarily from client profile now, fallback to auth phone for legacy
    const [phone, setPhone] = useState(client?.phone || user?.phone || ''); 

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
                    .from('clients')
                    .update({ 
                        client_name: companyName,
                        phone: cleanPhone 
                    })
                    .eq('id', client.id);
                
                 if (clientError) throw clientError;
            } else {
                 // Safe fallback: Update by user_id if client.id missing?
                 const { error: upsertError } = await supabase
                    .from('clients')
                    .upsert({
                        user_id: user.id,
                        client_name: companyName,
                        phone: cleanPhone
                    }, { onConflict: 'user_id' });
                    
                 if (upsertError) throw upsertError;
            }

            setMessage({ type: 'success', text: 'Profile updated successfully' });
            router.refresh();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (!currentPassword) {
            setMessage({ type: 'error', text: 'Current password is required' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (newPassword.length < 6) {
             setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
             return;
        }

        setLoading(true);
        setMessage(null);
        const supabase = createClient();

        try {
            // 1. Verify Current Password via Re-Auth attempt
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            });

            if (signInError) {
                throw new Error('Incorrect current password');
            }

            // 2. Update Password
            const { error: updateError } = await supabase.auth.updateUser({ 
                password: newPassword 
            });

            if (updateError) throw updateError;
            
            setMessage({ type: 'success', text: 'Password updated successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    // ── MOV save handler — updates campaigns table per-campaign
    const handleMOVUpdate = async () => {
        setMovLoading(true);
        setMessage(null);
        const supabase = createClient();
        try {
            // Execute all campaign updates in parallel
            // Security: scope by both id AND client_id to prevent cross-client writes
            const updates = campaigns.map(c => {
                const val = parseFloat(movValues[c.id] || '0');
                if (isNaN(val) || val < 0) throw new Error(`Invalid value for campaign "${c.name}"`);
                return supabase
                    .from('campaigns')
                    .update({ minimum_order_value: val })
                    .eq('id', c.id)
                    .eq('client_id', client?.id)  // Security scope — prevents cross-client writes
                    .select('id, minimum_order_value') // Confirm persisted value
                    .single();
            });
            const results = await Promise.all(updates);
            const firstErr = results.find(r => r.error);
            if (firstErr?.error) throw firstErr.error;
            // Log persisted values for debugging
            console.log('[MOV Save] Persisted values:', results.map(r => r.data));
            setMessage({ type: 'success', text: 'Campaign order values updated successfully' });
            router.refresh();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update order values' });
        } finally {
            setMovLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl animate-in fade-in duration-500">
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-50 text-red-900 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
                    {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            {/* Profile Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Profile Details</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Update your company information</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SimpleInput 
                        label="Company Name" 
                        value={companyName} 
                        onChange={(e: any) => setCompanyName(e.target.value)}
                        icon={Building}
                        placeholder="Your Company Name"
                      />
                      
                      {/* User Requirement 1: Email Field */}
                      <SimpleInput 
                        label="Email Address" 
                        value={user?.email ?? ""} 
                        readOnly
                        // Overriding any default opacity logic from SimpleInput if needed, though SimpleInput style looks clean now
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
                 <div className="mt-8 flex justify-end border-t border-gray-100 dark:border-slate-800 pt-6">
                     <button 
                        onClick={handleProfileUpdate} 
                        disabled={loading} 
                        className="
                            bg-blue-600 
                            hover:bg-blue-700 
                            text-white 
                            font-semibold 
                            px-6 py-2 
                            rounded-lg 
                            transition
                            flex items-center
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                     >
                         {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                         Save Profile
                     </button>
                 </div>
            </div>

            {/* Password Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Security</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your password</p>
                    </div>
                 </div>

                 <div className="space-y-6 max-w-2xl">
                    <div className="bg-gray-50 dark:bg-slate-950/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800 mb-6">
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
                 <div className="mt-8 flex justify-end border-t border-gray-100 dark:border-slate-800 pt-6">
                     {/* User Requirement 3: Update Password Button Visibility */}
                     <button
                      onClick={handlePasswordUpdate}
                      disabled={loading || !currentPassword || !newPassword}
                      className="
                        mt-4
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        font-semibold
                        px-6 py-2
                        rounded-lg
                        transition
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                 </div>
            </div>

            {/* Campaign Minimum Order Value Section */}
            {campaigns.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Campaign Revenue Settings</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Set minimum order value per campaign to unlock revenue estimates</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {campaigns.map(c => (
                            <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Minimum order value for revenue calculation</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={movValues[c.id] ?? '0'}
                                        onChange={e => setMovValues(prev => ({ ...prev, [c.id]: e.target.value }))}
                                        className="w-32 bg-slate-900 text-white placeholder:text-slate-400 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-3 py-2 rounded-lg text-sm transition-all duration-200"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end border-t border-gray-100 dark:border-slate-800 pt-6">
                        <button
                            onClick={handleMOVUpdate}
                            disabled={movLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-lg transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {movLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Order Values
                        </button>
                    </div>
                </div>
            )}

            {/* Account Info — dev only, not visible in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 p-6 flex flex-col md:flex-row gap-8 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-slate-900/30">
                  <div>
                      <span className="block text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider text-[10px] font-sans font-bold">Client ID</span>
                      <span className="bg-white dark:bg-slate-950 px-2 py-1 rounded border border-gray-200 dark:border-slate-800">{client?.id || 'Not Assigned'}</span>
                  </div>
                  <div>
                      <span className="block text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider text-[10px] font-sans font-bold">User ID</span>
                       <span className="bg-white dark:bg-slate-950 px-2 py-1 rounded border border-gray-200 dark:border-slate-800">{user.id}</span>
                  </div>
              </div>
            )}
        </div>
    );
}
