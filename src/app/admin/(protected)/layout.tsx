import { verifyAdmin } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await verifyAdmin();
  } catch (error) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
