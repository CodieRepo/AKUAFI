import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, User, Building } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-soft-lg border border-border">
        {/* Logo */}
        <div className="text-center">
           <div className="flex justify-center mb-4">
             <Image 
               src="/logo/akuafi-logo.png" 
               alt="Akuafi" 
               width={200} 
               height={72} 
               priority
               className="h-16 w-auto object-contain" 
             />
           </div>
          <p className="mt-2 text-sm text-text-muted">Create your partner account</p>
        </div>

        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="First Name" className="w-full rounded-lg border border-border bg-surface py-3 pl-10 text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Last Name" className="w-full rounded-lg border border-border bg-surface py-3 pl-10 text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
            </div>
            
            <div className="relative">
                <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Company Name" className="w-full rounded-lg border border-border bg-surface py-3 pl-10 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="email" placeholder="Work Email" className="w-full rounded-lg border border-border bg-surface py-3 pl-10 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="password" placeholder="Password" className="w-full rounded-lg border border-border bg-surface py-3 pl-10 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div className="flex items-start">
             <input
                id="terms"
                name="terms"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-500">
                I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
              </label>
          </div>

          <div>
            <Button className="w-full justify-center" size="lg">Create Account</Button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">Already a partner? </span>
          <Link href="/auth/login" className="font-medium text-primary hover:text-primary-dark">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
