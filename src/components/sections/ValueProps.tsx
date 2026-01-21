import { CheckCircle, TrendingUp, MapPin, Leaf, Wallet } from "lucide-react";

const valuePoints = [
  { icon: CheckCircle, label: "QR-powered bottle ads" },
  { icon: TrendingUp, label: "Built-in analytics" },
  { icon: MapPin, label: "Hyperlocal reach" },
  { icon: Leaf, label: "Green campaigns" },
  { icon: Wallet, label: "Affordable costs" },
];

export function ValueProps() {
  return (
    <section className="py-10 border-b border-slate-100 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-4">
          {valuePoints.map((point, index) => (
            <div 
              key={index}
              className="group flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-full border border-slate-200 transition-all hover:bg-white hover:border-primary/30 hover:shadow-soft-md hover:-translate-y-0.5"
            >
              <point.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium text-slate-700 text-sm md:text-base">{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
