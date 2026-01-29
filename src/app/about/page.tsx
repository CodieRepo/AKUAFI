import type { Metadata } from "next";
import ClientAbout from "./ClientAbout";

export const metadata: Metadata = {
  title: "About Akuafi – India’s QR Powered Bottle Advertising Platform",
  description: "Learn about Akuafi, India’s first QR-powered water bottle advertising platform helping brands convert offline ads into measurable digital results.",
};

export default function AboutPage() {
  return (
    <ClientAbout />
  );
}
