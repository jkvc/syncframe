import Link from "next/link";
import styles from "../docs.module.css";

export default function CoreDocs() {
  return (
    <div className={`px-6 py-16 max-w-4xl mx-auto ${styles.container}`}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.backLink}>
          ← BACK TO HOME
        </Link>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>@syncframe/core</h1>
        <p className={styles.subtitle}>
          Minimum protocol for deterministic state extrapolation.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>OVERVIEW</h2>
        <p className={styles.paragraph}>
          Core provides the foundational sync protocol: clock synchronization, anchors, evaluators,
          smoother, and pluggable storage/transport.
        </p>
        <div className={styles.codeBlock}>
          <div className={styles.codeComment}>// Install</div>
          <div>pnpm add @syncframe/core</div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ANCHOR</h2>
        <p className={styles.paragraph}>
          An anchor describes deterministic state at a server time. Given an anchor and server time,
          any client can evaluate the current value.
        </p>
        <div className={styles.codeBlock}>
          <div className={styles.codeComment}>{`// Anchor<T, M>`}</div>
          <div className={styles.codeLine}>{`interface Anchor<T, M> {`}</div>
          <div className={styles.codeIndent}>{`at: number;        // server timestamp`}</div>
          <div className={styles.codeIndent}>{`value: T;          // value at time 'at'`}</div>
          <div className={styles.codeIndent}>{`motion: M;         // motion descriptor`}</div>
          <div className={styles.codeLine}>{`}`}</div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>EVALUATOR</h2>
        <p className={styles.paragraph}>
          Pure function: (anchor, serverTime) → current value. Same inputs always produce the same output.
          Deterministic across all clients.
        </p>
        <div className={styles.codeBlock}>
          <div className={styles.codeComment}>{`// evaluateScalar`}</div>
          <div className={styles.codeLine}>{`function evaluateScalar(`}</div>
          <div className={styles.codeIndent}>{`anchor: Anchor<number, ScalarMotion>,`}</div>
          <div className={styles.codeIndent}>{`serverTimeMs: number`}</div>
          <div className={styles.codeLine}>{`): number`}</div>
        </div>
        <p className={styles.codeNote}>
          Returns: value + (serverTimeMs - anchor.at) × motion.ratePerMs
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>SCALAR MOTION</h2>
        <p className={styles.paragraph}>
          Core ships with scalar motion: a number that changes at a constant rate per millisecond.
          Consumers define their own motion shapes for complex trajectories.
        </p>
        <div className={styles.codeBlock}>
          <div className={styles.codeLine}>{`interface ScalarMotion {`}</div>
          <div className={styles.codeIndent}>{`kind: 'scalar';`}</div>
          <div className={styles.codeIndent}>{`ratePerMs: number;  // units per millisecond`}</div>
          <div className={styles.codeLine}>{`}`}</div>
        </div>
        <div className={styles.codeGrid}>
          <div className={styles.codeGridItem}>
            <div className={styles.codeGridLabel}>ratePerMs: 0.001</div>
            <div className={styles.codeGridNote}>Video at 1x speed</div>
          </div>
          <div className={styles.codeGridItem}>
            <div className={styles.codeGridLabel}>ratePerMs: 0</div>
            <div className={styles.codeGridNote}>Paused state</div>
          </div>
          <div className={styles.codeGridItem}>
            <div className={styles.codeGridLabel}>ratePerMs: -0.001</div>
            <div className={styles.codeGridNote}>Countdown timer</div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>SMOOTHER</h2>
        <p className={styles.paragraph}>
          Exponential chase interpolation hides network jitter. Tracks evaluated value smoothly,
          snaps on large discontinuities (seek, pause).
        </p>
        <div className={styles.codeBlock}>
          <div className={styles.codeLine}>{`function smoothStep(`}</div>
          <div className={styles.codeIndent}>{`current: number,`}</div>
          <div className={styles.codeIndent}>{`target: number,`}</div>
          <div className={styles.codeIndent}>{`dt: number,`}</div>
          <div className={styles.codeIndent}>{`options?: SmootherOptions`}</div>
          <div className={styles.codeLine}>{`): number`}</div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>PLUGGABLE STORAGE</h2>
        <p className={styles.paragraph}>
          Core is backend-agnostic. Ships with in-memory store. Bring your own database or cache.
        </p>
        <div className={styles.codeBlock}>
          <div className={styles.codeLine}>{`interface SyncStore {`}</div>
          <div className={styles.codeIndent}>{`getAnchor(roomId, key): Promise<Anchor | null>;`}</div>
          <div className={styles.codeIndent}>{`setAnchor(roomId, key, anchor): Promise<void>;`}</div>
          <div className={styles.codeIndent}>{`// ... more methods`}</div>
          <div className={styles.codeLine}>{`}`}</div>
        </div>
        <p className={styles.codeNote}>
          Implement SyncStore to use Redis, Postgres, DynamoDB, or any backend.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>NEXT STEPS</h2>
        <div className={styles.buttonGroup}>
          <Link
            href="/demo/core"
            className={styles.buttonPrimary}
          >
            TRY THE DEMO
          </Link>
          <Link
            href="/"
            className={styles.buttonSecondary}
          >
            BACK TO HOME
          </Link>
        </div>
      </section>
    </div>
  );
}
