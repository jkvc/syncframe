import InteriorPageShell from "@/components/editorial/InteriorPageShell";
import PageStampHeader from "@/components/editorial/PageStampHeader";
import { EmptyState } from "@/components/docs/DocSection";

export default function SpatialDemo() {
  return (
    <InteriorPageShell>
      <PageStampHeader
        meta={{ eyebrow: "Preview" }}
        title="Spatial demo"
        subtitle="Multi-display installations with world-coordinate positioning."
        className="mb-12"
      />

      <EmptyState title="Coming soon" />
    </InteriorPageShell>
  );
}
