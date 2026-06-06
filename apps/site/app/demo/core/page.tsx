import Link from "next/link";
import styles from "../demo.module.css";

export default function CoreDemo() {
  return (
    <div className={`px-6 py-16 max-w-4xl mx-auto ${styles.container}`}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.backLink}>
          ← BACK TO HOME
        </Link>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>CORE DEMO</h1>
        <p className={styles.subtitle}>
          Countdown timer synchronized across all connected devices.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.demoPlaceholder}>
          <p className={styles.placeholderText}>
            DEMO COMING SOON
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>HOW IT WILL WORK</h2>
        <div className={styles.stepList}>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber}>01</span>
            <p className={styles.stepText}>One user sets a countdown timer (e.g., 5 minutes)</p>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber}>02</span>
            <p className={styles.stepText}>Core broadcasts an anchor: startTime + duration + ratePerMs</p>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber}>03</span>
            <p className={styles.stepText}>All connected devices evaluate the current time remaining</p>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber}>04</span>
            <p className={styles.stepText}>Pause, resume, or adjust — new anchor broadcasts, all clients sync</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.buttonGroup}>
          <Link
            href="/docs/core"
            className={styles.buttonSecondary}
          >
            READ CORE DOCS
          </Link>
        </div>
      </section>
    </div>
  );
}
