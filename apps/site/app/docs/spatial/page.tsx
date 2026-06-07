import InteriorPageShell from "@/components/editorial/InteriorPageShell";
import PageStampHeader from "@/components/editorial/PageStampHeader";
import { EmptyState } from "@/components/docs/DocSection";

export default function SpatialDocs() {
  return (
    <InteriorPageShell>
      <PageStampHeader
        meta={{ eyebrow: "Layer 2", trailing: "Preview" }}
        title="@syncframe/spatial"
        subtitle="Screen registry, world-coordinate poses, calibration UI."
        className="mb-12"
      />

      <EmptyState
        title="Coming soon"
        subtitle="Spatial layer documentation is in progress."
      />
    </InteriorPageShell>
  );
}
