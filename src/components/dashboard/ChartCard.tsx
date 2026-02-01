import { cn } from '@/components/ui/Button';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export default function ChartCard({ title, subtitle, children, className, action }: ChartCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-white p-6 shadow-soft-sm", className)}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
