import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={`px-6 py-24 max-w-7xl mx-auto ${styles.container}`}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          DEAD-RECKONING
          <br />
          TIME SYNC
          <br />
          FOR BROWSERS
        </h1>
        <p className={styles.heroSubtitle}>
          Synchronize continuous state across devices without streaming.
          Broadcast anchors. Evaluate anywhere. Latency doesn't matter.
        </p>
      </section>

      {/* Core concept */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>HOW IT WORKS</h2>
        <div className={styles.grid3}>
          <div>
            <div className={styles.stepNumber}>01</div>
            <h3 className={styles.stepTitle}>BROADCAST ANCHORS</h3>
            <p className={styles.stepText}>
              Instead of streaming position updates, broadcast rare anchors:
              timestamp + value + motion descriptor.
            </p>
          </div>
          <div>
            <div className={styles.stepNumber}>02</div>
            <h3 className={styles.stepTitle}>SHARED CLOCK</h3>
            <p className={styles.stepText}>
              Every client syncs to server time using NTP-style offset estimation.
              Monotonic. Deterministic.
            </p>
          </div>
          <div>
            <div className={styles.stepNumber}>03</div>
            <h3 className={styles.stepTitle}>EVALUATE ANYWHERE</h3>
            <p className={styles.stepText}>
              Given an anchor and server time, any client can compute current state
              via pure math. No network calls.
            </p>
          </div>
        </div>
      </section>

      {/* Two layer architecture */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>TWO LAYERS</h2>
        <div className={styles.grid2}>
          <div className={styles.card}>
            <div className={styles.layerLabel}>LAYER 1</div>
            <h3 className={styles.cardTitle}>@syncframe/core</h3>
            <p className={styles.cardText}>
              Clock synchronization, anchor protocol, evaluators, smoother, pluggable storage.
              Zero runtime dependencies.
            </p>
            <div className={styles.buttonGroup}>
              <Link
                href="/docs/core"
                className={styles.buttonPrimary}
              >
                READ DOCS
              </Link>
              <Link
                href="/demo/core"
                className={styles.buttonSecondary}
              >
                TRY DEMO
              </Link>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.layerLabelMuted}>LAYER 2</div>
            <h3 className={styles.cardTitle}>@syncframe/spatial</h3>
            <p className={styles.cardText}>
              Screen registry, world-coordinate poses, calibration UI.
              For multi-display setups where screens have geometric positions.
            </p>
            <div className={styles.buttonGroup}>
              <Link
                href="/docs/spatial"
                className={styles.buttonDisabled}
              >
                COMING SOON
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>USE CASES</h2>
        <ul className={styles.useCaseList}>
          <li className={styles.useCaseItem}>
            <span className={styles.arrow}>→</span>
            <span><strong>Video/audio sync</strong> — synchronized playback across devices</span>
          </li>
          <li className={styles.useCaseItem}>
            <span className={styles.arrow}>→</span>
            <span><strong>Multi-device audio</strong> — turn N phones into a spatial speaker array</span>
          </li>
          <li className={styles.useCaseItem}>
            <span className={styles.arrow}>→</span>
            <span><strong>Multi-screen installations</strong> — panoramic image flows across N monitors</span>
          </li>
          <li className={styles.useCaseItem}>
            <span className={styles.arrow}>→</span>
            <span><strong>Collaborative canvas</strong> — distributed 2D drawing surface</span>
          </li>
          <li className={styles.useCaseItem}>
            <span className={styles.arrow}>→</span>
            <span><strong>Event timers</strong> — identical countdowns across every display</span>
          </li>
        </ul>
      </section>

      {/* Pitch */}
      <section className={styles.pitch}>
        <p className={styles.pitchText}>
          As long as each device has a browser and internet connection, you can sync continuous state across all of them.
        </p>
      </section>
    </div>
  );
}
