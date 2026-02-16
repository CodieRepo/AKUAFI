'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Loader2, Save, Lock, User, Building, Smartphone, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Fallback Input if standard one missing 
function SimpleInput({ label, icon: Icon, ...props }: any) {
    return (
        <div className="space-y-1.5">
             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
             <div className="relative">
                 {Icon && <Icon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />}
                 <input 
                    className="flex h-10 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pl-10 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    {...props}
                 />
             </div>
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
    const [email] = useState(user?.email || ''); // Read Only usually
    const [phone, setPhone] = useState(user?.phone || ''); 

    // Password State
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
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
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
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            
            setMessage({ type: 'success', text: 'Password updated successfully' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl">
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <div className="h-2 w-2 rounded-full bg-green-500" /> : <div className="h-2 w-2 rounded-full bg-red-500" />}
                    {message.text}
                </div>
            )}

            {/* Profile Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Details</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SimpleInput 
                        label="Company Name" 
                        value={companyName} 
                        onChange={(e: any) => setCompanyName(e.target.value)}
                        icon={Building}
                      />
                      <SimpleInput 
                        label="Email Address" 
                        value={email} 
                        disabled 
                        className="bg-gray-50 dark:bg-slate-800 text-gray-500"
                        icon={Mail}
                      />
                      <SimpleInput 
                        label="Phone Number" 
                        value={phone} 
                        onChange={(e: any) => setPhone(e.target.value)}
                        placeholder="+91..."
                        icon={Smartphone}
                      />
                 </div>
                 <div className="mt-6 flex justify-end">
                     <Button onClick={handleProfileUpdate} disabled={loading}>
                         {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                         Save Changes
                     </Button>
                 </div>
            </div>

            {/* Password Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Security</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SimpleInput 
                        label="New Password" 
                        type="password"
                        value={newPassword} 
                        onChange={(e: any) => setNewPassword(e.target.value)}
                        icon={Lock}
                      />
                      <SimpleInput 
                        label="Confirm Password" 
                        type="password"
                        value={confirmPassword} 
                        onChange={(e: any) => setConfirmPassword(e.target.value)}
                        icon={Lock}
                      />
                 </div>
                 <div className="mt-6 flex justify-end">
                     <Button variant="outline" onClick={handlePasswordUpdate} disabled={loading || !newPassword}>
                         Update Password
                     </Button>
                 </div>
            </div>

            {/* Account Info Section */}
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-gray-500">
                    <div>
                        <span className="block text-gray-400 mb-1">Client ID</span>
                        {client.id}
                    </div>
                     <div>
                        <span className="block text-gray-400 mb-1">User ID</span>
                        {user.id}
                    </div>
                </div>
            </div>
        </div>
    );
}
