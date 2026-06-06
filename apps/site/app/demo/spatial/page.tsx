import Link from "next/link";
import styles from "../demo.module.css";

export default function SpatialDemo() {
  return (
    <div className={`px-6 py-16 max-w-4xl mx-auto ${styles.container}`}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.backLink}>
          ← BACK TO HOME
        </Link>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>SPATIAL DEMO</h1>
        <p className={styles.subtitle}>
          Multi-display installations with world-coordinate positioning.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.demoPlaceholder}>
          <p className={styles.placeholderText}>
            COMING SOON
          </p>
        </div>
      </section>
    </div>
  );
}
