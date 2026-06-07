import Link from "next/link";

/** sync + frame — italic sans accent on "frame". */
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-sans text-base font-black uppercase tracking-tight text-ink ${className}`}
    >
      sync<span className="italic text-hot">frame</span>
    </Link>
  );
}
