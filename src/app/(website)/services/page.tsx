import type { Metadata } from "next";
import Link from "next/link";
import { 
  ArrowRight, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Leaf, 
  MapPin, 
  MousePointerClick, 
  QrCode, 
  Smartphone, 
  Zap,
  HelpCircle,
  Plus,
  Minus,
  Droplets
} from "lucide-react";
import ClientServices from "./ClientServices";

export const metadata: Metadata = {
  title: "Akuafi Services – QR Bottle Advertising & Analytics Platform",
  description: "Explore Akuafi services: bottle branding, dynamic QR campaigns, and real-time analytics to turn offline ads into measurable digital sales.",
};

export default function ServicesPage() {
  return (
    <ClientServices />
  );
}
