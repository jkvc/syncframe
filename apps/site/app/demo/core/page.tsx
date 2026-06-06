import Link from "next/link";
import styles from "../demo.module.css";
import { Timer } from "./timer";
import { QrCode } from "./qr-code";

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
        <div className={styles.headerRow}>
          <div className={styles.subtitleStack}>
            <p className={styles.subtitle}>
              A single global countdown, synced across every browser.
            </p>
            <p className={styles.subtitle}>
              Anyone can control it — open a second tab and watch them stay
              locked together.
            </p>
            <p className={styles.subtitle}>
              Or better yet, scan this QR code to open it on your phone and watch
              it stay in sync.
            </p>
          </div>
          <QrCode />
        </div>
      </header>

      <section className={styles.section}>
        <Timer />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>HOW IT WORKS</h2>
        <div className={styles.stepList}>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber}>01</span>
            <p className={styles.stepText}>
              One Redis key holds the current anchor: server time, value, and
              rate. No rooms — it&apos;s a single global clock.
            </p>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber}>02</span>
            <p className={styles.stepText}>
              Every control (reset, pause/resume, speed) re-anchors on the
              server, then broadcasts the new anchor over Redis pub/sub.
            </p>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber}>03</span>
            <p className={styles.stepText}>
              Each browser syncs to server time with an NTP-style clock, then
              evaluates the anchor locally every frame — no value streaming.
            </p>
          </div>
          <div className={styles.stepItem}>
            <span className={styles.stepNumber}>04</span>
            <p className={styles.stepText}>
              Because the math is deterministic, latency doesn&apos;t matter:
              every client lands on the same number for any given moment.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.buttonGroup}>
          <Link href="/docs/core" className={styles.buttonSecondary}>
            READ CORE DOCS
          </Link>
        </div>
      </section>
    </div>
  );
}
