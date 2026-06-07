import ContentColumn from "@/components/site/ContentColumn";

export default function SiteFooter() {
  return (
    <footer className="px-5 pb-8 pt-4 sm:px-8">
      <ContentColumn>
        <p className="caption-mono text-center text-ink-faint">
          syncframe · © 2026
        </p>
      </ContentColumn>
    </footer>
  );
}
