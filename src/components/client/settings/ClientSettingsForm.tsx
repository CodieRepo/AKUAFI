'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Loader2, Save, Lock, User, Building, Smartphone, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Production Ready Input with strict dark mode contrast
function SimpleInput({ label, icon: Icon, type = "text", error, ...props }: any) {
    return (
        <div className="space-y-1.5">
             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
             <div className="relative group">
                 {Icon && <Icon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />}
                 <input 
                    type={type}
                    className={`
                        flex h-10 w-full rounded-lg border 
                        bg-white dark:bg-slate-950 
                        text-gray-900 dark:text-white 
                        placeholder:text-gray-400 dark:placeholder:text-gray-500
                        px-3 py-2 pl-10 text-sm 
                        ring-offset-white dark:ring-offset-slate-950
                        file:border-0 file:bg-transparent file:text-sm file:font-medium 
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 
                        disabled:cursor-not-allowed disabled:opacity-50
                        transition-all duration-200
                        ${error ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-200 dark:border-slate-800'}
                    `}
                    {...props}
                 />
             </div>
             {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}

interface ClientSettingsFormProps {
    user: any;
    client: any;
}

export default function ClientSettingsForm({ user, client }: ClientSettingsFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Profile State
    const [companyName, setCompanyName] = useState(client?.client_name || '');
    // Using company name as username for now as requested, or just editable name
    const [email] = useState(user?.email || ''); 
    const [phone, setPhone] = useState(user?.phone || ''); 

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleProfileUpdate = async () => {
        setLoading(true);
        setMessage(null);
        const supabase = createClient();

        try {
            // Update Client Table
            const { error: clientError } = await supabase
                .from('clients')
                .update({ client_name: companyName })
                .eq('id', client.id);

            if (clientError) throw clientError;

            // Update Auth Metadata (Phone)
            if (phone !== user.phone) {
                 const { error: authError } = await supabase.auth.updateUser({
                     phone: phone
                 });
                 if (authError) throw authError;
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
                      <SimpleInput 
                        label="Email Address" 
                        value={email} 
                        disabled 
                        className="opacity-70 cursor-not-allowed bg-gray-50 dark:bg-slate-900"
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
                     <Button onClick={handleProfileUpdate} disabled={loading} className="px-6">
                         {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                         Save Profile
                     </Button>
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
                            className="bg-white dark:bg-slate-950"
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
                     <Button variant="outline" onClick={handlePasswordUpdate} disabled={loading || !currentPassword || !newPassword} className="px-6">
                         Update Password
                     </Button>
                 </div>
            </div>

            {/* Account Info Section */}
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 p-6 flex flex-col md:flex-row gap-8 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-slate-900/30">
                <div>
                    <span className="block text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider text-[10px] font-sans font-bold">Client ID</span>
                    <span className="bg-white dark:bg-slate-950 px-2 py-1 rounded border border-gray-200 dark:border-slate-800">{client.id}</span>
                </div>
                <div>
                    <span className="block text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider text-[10px] font-sans font-bold">User ID</span>
                     <span className="bg-white dark:bg-slate-950 px-2 py-1 rounded border border-gray-200 dark:border-slate-800">{user.id}</span>
                </div>
            </div>
        </div>
    );
}
