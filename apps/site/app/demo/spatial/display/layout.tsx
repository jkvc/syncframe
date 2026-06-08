/**
 * Chrome-free layout — no site header/footer on kiosk displays.
 */
export default function SpatialDisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[200] overflow-hidden bg-black">
      {children}
    </div>
  );
}
