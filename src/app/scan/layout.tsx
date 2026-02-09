export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="scan-isolation-layer">
      {children}
    </div>
  );
}
