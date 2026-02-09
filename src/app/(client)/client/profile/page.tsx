import { Button } from '@/components/ui/Button';
import { User, Mail, Globe, MapPin, CreditCard, Download } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
         <h1 className="text-3xl font-bold tracking-tight text-foreground">Company Profile</h1>
         <p className="text-text-muted">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[250px_1fr]">
         {/* Sidebar / Stats */}
         <div className="space-y-6">
             <div className="rounded-2xl border border-border bg-white p-6 text-center shadow-soft-sm">
                 <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-3xl font-bold text-white mb-4">
                     AC
                 </div>
                 <h3 className="text-lg font-bold">Acme Corp</h3>
                 <p className="text-sm text-text-muted">Premium Member</p>
                 <div className="mt-4 pt-4 border-t border-border text-left space-y-2">
                     <div className="flex justify-between text-sm">
                         <span className="text-text-muted">Plan</span>
                         <span className="font-medium text-primary">Growth</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-text-muted">Member Since</span>
                         <span className="font-medium">Jan 2024</span>
                     </div>
                 </div>
             </div>
         </div>

         {/* Form */}
         <div className="space-y-6">
             <div className="rounded-2xl border border-border bg-white p-6 shadow-soft-sm">
                 <h2 className="text-lg font-semibold mb-6">General Information</h2>
                 <div className="grid gap-6 md:grid-cols-2">
                     <div className="space-y-2">
                         <label className="text-sm font-medium text-foreground">Company Name</label>
                         <div className="relative">
                             <User className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                             <input type="text" defaultValue="Acme Corp" className="w-full rounded-lg border border-border bg-surface pl-10 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                         </div>
                     </div>
                     <div className="space-y-2">
                         <label className="text-sm font-medium text-foreground">Email Address</label>
                         <div className="relative">
                             <Mail className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                             <input type="email" defaultValue="admin@acmecorp.com" className="w-full rounded-lg border border-border bg-surface pl-10 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                         </div>
                     </div>
                     <div className="space-y-2">
                         <label className="text-sm font-medium text-foreground">Website</label>
                         <div className="relative">
                             <Globe className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                             <input type="url" defaultValue="https://acmecorp.com" className="w-full rounded-lg border border-border bg-surface pl-10 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                         </div>
                     </div>
                     <div className="space-y-2">
                         <label className="text-sm font-medium text-foreground">Location</label>
                         <div className="relative">
                             <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                             <input type="text" defaultValue="Mumbai, India" className="w-full rounded-lg border border-border bg-surface pl-10 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                         </div>
                     </div>
                 </div>
                 <div className="mt-8 flex justify-end">
                     <Button>Save Changes</Button>
                 </div>
             </div>
             
             <div className="rounded-2xl border border-border bg-white p-6 shadow-soft-sm">
                 <h2 className="text-lg font-semibold mb-6">Plan & Usage</h2>
                 <div className="space-y-6">
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Total Scans Used</span>
                            <span className="text-text-muted">45,231 / 100,000</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-surface">
                            <div className="h-2 rounded-full bg-primary" style={{ width: '45%' }}></div>
                        </div>
                        <p className="text-xs text-text-muted">Plan resets on Feb 1, 2024</p>
                     </div>
                     
                     <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-surface/50">
                         <div className="h-10 w-10 bg-white rounded flex items-center justify-center border border-border">
                             <CreditCard className="h-6 w-6 text-primary" />
                         </div>
                         <div className="flex-1">
                             <p className="font-medium text-sm">Visa ending in 4242</p>
                             <p className="text-xs text-text-muted">Expires 12/26</p>
                         </div>
                         <Button variant="outline" size="sm">Edit</Button>
                     </div>
                 </div>
             </div>

             <div className="rounded-2xl border border-border bg-white p-6 shadow-soft-sm">
                 <h2 className="text-lg font-semibold mb-6">Invoices</h2>
                 <div className="space-y-4">
                     {[
                        { id: 'INV-0012', date: 'Jan 01, 2024', amount: '$499.00', status: 'Paid' },
                        { id: 'INV-0011', date: 'Dec 01, 2023', amount: '$499.00', status: 'Paid' },
                        { id: 'INV-0010', date: 'Nov 01, 2023', amount: '$499.00', status: 'Paid' },
                     ].map((inv) => (
                         <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface transition-colors">
                             <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                     <Download className="h-4 w-4" />
                                 </div>
                                 <div>
                                     <p className="text-sm font-medium">{inv.date}</p>
                                     <p className="text-xs text-text-muted">{inv.id}</p>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <p className="text-sm font-medium">{inv.amount}</p>
                                 <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                                     {inv.status}
                                 </span>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>

             <div className="rounded-2xl border border-border bg-white p-6 shadow-soft-sm">
                 <h2 className="text-lg font-semibold mb-6">Support</h2>
                 <div className="grid gap-4 sm:grid-cols-2">
                     <div className="p-4 rounded-lg border border-border bg-surface/30 hover:bg-surface transition-colors cursor-pointer">
                         <p className="font-medium text-foreground">Documentation</p>
                         <p className="text-sm text-text-muted">Read guides and API docs</p>
                     </div>
                     <div className="p-4 rounded-lg border border-border bg-surface/30 hover:bg-surface transition-colors cursor-pointer">
                         <p className="font-medium text-foreground">Contact Support</p>
                         <p className="text-sm text-text-muted">Get help from our team</p>
                     </div>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
}
