import ChartCard from '@/components/dashboard/ChartCard';
import { Button } from '@/components/ui/Button';
import { Download, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-text-muted">Deep dive into your campaign performance.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="h-9">
                <Calendar className="mr-2 h-4 w-4" />
                Last 30 Days
            </Button>
            <Button variant="outline" className="h-9">
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <ChartCard title="Scan Locations" subtitle="Top performing regions">
             <div className="flex flex-col gap-4 h-[300px] overflow-y-auto pr-2">
                 {[
                    { city: 'Mumbai', value: 85, color: 'bg-primary' },
                    { city: 'Bangalore', value: 65, color: 'bg-accent-cyan' },
                    { city: 'Delhi', value: 45, color: 'bg-indigo-500' },
                    { city: 'Pune', value: 30, color: 'bg-purple-500' },
                    { city: 'Hyderabad', value: 25, color: 'bg-pink-500' },
                 ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4">
                         <span className="w-24 text-sm font-medium">{item.city}</span>
                         <div className="flex-1 h-3 rounded-full bg-surface overflow-hidden">
                             <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                         </div>
                         <span className="w-12 text-sm text-right text-text-muted">{item.value}%</span>
                     </div>
                 ))}
             </div>
         </ChartCard>

         <ChartCard title="Device Types" subtitle="Scans by device OS">
             <div className="h-[300px] flex items-center justify-center gap-8">
                 <div className="relative h-48 w-48 rounded-full border-[16px] border-surface flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-[16px] border-primary border-t-transparent border-l-transparent rotate-45"></div>
                      <div className="absolute inset-0 rounded-full border-[16px] border-accent-cyan border-b-transparent border-r-transparent -rotate-12 transform scale-90"></div>
                      <div className="text-center">
                          <p className="text-2xl font-bold">Total</p>
                          <p className="text-sm text-text-muted">Devices</p>
                      </div>
                 </div>
                 <div className="space-y-3">
                     <div className="flex items-center gap-2">
                         <div className="h-3 w-3 rounded-full bg-primary"></div>
                         <span className="text-sm">Android (65%)</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <div className="h-3 w-3 rounded-full bg-accent-cyan"></div>
                         <span className="text-sm">iOS (35%)</span>
                     </div>
                 </div>
             </div>
         </ChartCard>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
          {/* Peak Scan Times */}
          <ChartCard title="Peak Scan Times" subtitle="Activity by time of day (24h)">
              <div className="h-[300px] w-full flex items-end justify-between gap-1 pt-8">
                  {[12, 8, 5, 3, 2, 1, 2, 5, 15, 25, 45, 65, 85, 90, 75, 60, 50, 55, 65, 70, 55, 40, 25, 15].map((val, i) => (
                      <div key={i} className="group relative flex-1 bg-surface hover:bg-primary transition-colors rounded-t" style={{ height: `${val}%` }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {i}:00 - {val} scans
                          </div>
                      </div>
                  ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-text-muted">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
              </div>
          </ChartCard>

          {/* Conversion Funnel */}
          <ChartCard title="Conversion Funnel" subtitle="Session to Redemption">
              <div className="h-[300px] flex flex-col justify-center gap-6 px-4">
                  <div className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                          <span>Total Scans</span>
                          <span>45,231</span>
                      </div>
                      <div className="w-full h-8 bg-surface rounded-r-lg relative overflow-hidden">
                          <div className="h-full bg-primary/20 w-full flex items-center px-3 text-xs text-primary font-bold">100%</div>
                      </div>
                  </div>
                  
                  <div className="space-y-1 pl-4">
                      <div className="flex justify-between text-sm font-medium">
                          <span>Unique Visitors</span>
                          <span>38,400</span>
                      </div>
                      <div className="w-full h-8 bg-surface rounded-r-lg relative overflow-hidden">
                          <div className="h-full bg-primary/40 w-[85%] flex items-center px-3 text-xs text-primary-dark font-bold">85%</div>
                      </div>
                  </div>

                  <div className="space-y-1 pl-8">
                      <div className="flex justify-between text-sm font-medium">
                          <span>Engaged (&gt;30s)</span>
                          <span>21,500</span>
                      </div>
                      <div className="w-full h-8 bg-surface rounded-r-lg relative overflow-hidden">
                          <div className="h-full bg-primary/60 w-[47%] flex items-center px-3 text-xs text-white font-bold">47%</div>
                      </div>
                  </div>

                  <div className="space-y-1 pl-12">
                      <div className="flex justify-between text-sm font-medium">
                          <span>Redeemed / Action</span>
                          <span>5,420</span>
                      </div>
                      <div className="w-full h-8 bg-surface rounded-r-lg relative overflow-hidden">
                          <div className="h-full bg-primary w-[12%] flex items-center px-3 text-xs text-white font-bold">12%</div>
                      </div>
                  </div>
              </div>
          </ChartCard>
      </div>
      
      <ChartCard title="Traffic Source" className="col-span-full">
         <div className="h-[250px] w-full bg-surface/50 rounded-lg flex items-center justify-center text-text-muted">
             {/* Simple Area Chart Placeholder */}
             <div className="w-full h-full p-4 flex items-end gap-1">
                 {Array.from({ length: 40 }).map((_, i) => (
                     <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors" style={{ height: `${20 + Math.random() * 60}%` }}></div>
                 ))}
             </div>
         </div>
      </ChartCard>

    </div>
  );
}
