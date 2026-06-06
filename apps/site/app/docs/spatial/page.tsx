import Link from "next/link";
import styles from "../docs.module.css";

export default function SpatialDocs() {
  return (
    <div className={`px-6 py-16 max-w-4xl mx-auto ${styles.container}`}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.backLink}>
          ← BACK TO HOME
        </Link>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>@syncframe/spatial</h1>
        <p className={styles.subtitle}>
          Screen registry, world-coordinate poses, calibration UI.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.demoPlaceholder}>
          <p className={styles.placeholderText}>
            COMING SOON
          </p>
          <p className={styles.placeholderSubtext}>
            Spatial layer documentation is in progress.
          </p>
        </div>
      </section>
    </div>
  );
}
