import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './legal.module.css';

export default function LegalNotice(): ReactNode {
  return (
    <Layout
      title="Legal Notice"
      description="Legal notice, publisher, and hosting information for Flinkboot.">
      <main className={styles.legalContainer}>
        <Heading as="h1" className={styles.title}>
          Legal Notice
        </Heading>

        <section className={styles.section}>
          <Heading as="h2" className={styles.sectionTitle}>
            1. Website Publisher
          </Heading>
          <p>
            This website (<strong>flinkboot.com</strong>) is an open-source technical documentation project
            published by an individual for non-commercial purposes.
          </p>
          <p>
            In accordance with Article 6, III, 2 of the French Law for Confidence in the Digital Economy
            (LCEN n° 2004-575 of June 21, 2004), non-professional publishers are entitled to preserve their anonymity,
            provided that the hosting provider's identification details and an accessible contact email are publicly available.
          </p>
          <p>
            <strong>Contact:</strong>{' '}
            <a href="mailto:sekelenao@protonmail.com">sekelenao@protonmail.com</a>
          </p>
        </section>

        <section className={styles.section}>
          <Heading as="h2" className={styles.sectionTitle}>
            2. Hosting Provider
          </Heading>
          <p>
            This website is globally hosted and distributed via Cloudflare Pages by:
          </p>
          <p>
            <strong>Cloudflare, Inc.</strong><br />
            101 Townsend St,<br />
            San Francisco, CA 94107, USA<br />
            Website:{' '}
            <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer">
              https://www.cloudflare.com
            </a>
          </p>
        </section>

        <section className={styles.section}>
          <Heading as="h2" className={styles.sectionTitle}>
            3. Intellectual Property & Open Source License
          </Heading>
          <p>
            Flinkboot is an open-source framework distributed under the{' '}
            <a
              href="https://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer">
              Apache License 2.0
            </a>.
          </p>
          <p>
            Apache Flink, Flink, and the Apache feather logo are either registered trademarks or trademarks
            of The Apache Software Foundation. Flinkboot is an independent open-source project and is not affiliated
            with, endorsed by, or sponsored by The Apache Software Foundation.
          </p>
        </section>

        <section className={styles.section}>
          <Heading as="h2" className={styles.sectionTitle}>
            4. Disclaimer & Limitation of Liability
          </Heading>
          <p>
            The documentation, code samples, and resources provided on this website are supplied "as is",
            without warranty of any kind, express or implied. The author and contributors cannot be held liable
            for any direct, indirect, incidental, or consequential damages arising from the use of the code or information
            presented on this website.
          </p>
        </section>
      </main>
    </Layout>
  );
}
