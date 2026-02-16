'use client';

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useState } from "react";

export default function SignOutButton({ clientName }: { clientName: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSignOut = async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/client/login');
        router.refresh();
    };

    return (
        <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                    {clientName}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Client Account
                </span>
            </div>
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-slate-800 hidden sm:block"></div>
            <button 
                onClick={handleSignOut}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{loading ? '...' : 'Sign Out'}</span>
            </button>
        </div>
    );
}
