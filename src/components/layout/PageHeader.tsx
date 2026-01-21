import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, className, children }: PageHeaderProps) {
  return (
    <section className={cn("pt-32 pb-16 lg:pt-48 lg:pb-24 bg-surface text-center px-6 relative overflow-hidden", className)}>
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            {title}
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
            {description}
        </p>
        {children}
      </div>
    </section>
  );
}
