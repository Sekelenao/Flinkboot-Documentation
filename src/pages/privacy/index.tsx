import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from '../legal/legal.module.css';

export default function PrivacyPolicy(): ReactNode {
  return (
    <Layout
      title="Privacy Policy"
      description="Privacy policy and data protection practices for Flinkboot.">
      <main className={styles.legalContainer}>
        <Heading as="h1" className={styles.title}>
          Privacy Policy
        </Heading>

        <section className={styles.section}>
          <Heading as="h2" className={styles.sectionTitle}>
            1. Zero Tracking & No Cookies
          </Heading>
          <p>
            Flinkboot is dedicated to safeguarding your privacy. We believe developer documentation should be completely free
            from invasive trackers.
          </p>
          <ul>
            <li><strong>No tracking cookies:</strong> This website does not use tracking cookies, marketing pixels, or advertising beacons.</li>
            <li><strong>No third-party analytics:</strong> We do not embed external analytics platforms (such as Google Analytics).</li>
            <li><strong>Local search:</strong> The documentation search operates entirely client-side in your browser using an offline local index. No search queries or keystrokes are transmitted to any server.</li>
            <li><strong>Local preferences:</strong> Your preferred theme (dark mode) is stored locally on your device in <code>localStorage</code>.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <Heading as="h2" className={styles.sectionTitle}>
            2. Hosting & Connection Logs
          </Heading>
          <p>
            This website is hosted by Cloudflare Pages. When you visit any website on the internet, Cloudflare's
            edge network automatically receives standard technical connection data (including your IP address, browser user-agent,
            and requested URL).
          </p>
          <p>
            This information is processed strictly for security purposes, DDoS mitigation, network reliability,
            and caching, in full compliance with applicable data protection regulations, including the General Data
            Protection Regulation (GDPR). For further details, refer to the{' '}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer">
              Cloudflare Privacy Policy
            </a>.
          </p>
        </section>

        <section className={styles.section}>
          <Heading as="h2" className={styles.sectionTitle}>
            3. External Links & Repositories
          </Heading>
          <p>
            This documentation site contains links to third-party services (such as GitHub, Maven Central, and Sonatype).
            Once you navigate to those third-party websites, their respective privacy policies and terms of service apply.
          </p>
        </section>

        <section className={styles.section}>
          <Heading as="h2" className={styles.sectionTitle}>
            4. Contact
          </Heading>
          <p>
            If you have any questions about this Privacy Policy or wish to exercise any data rights under the GDPR,
            please reach out to:
          </p>
          <p>
            <strong>Email:</strong>{' '}
            <a href="mailto:sekelenao@protonmail.com">sekelenao@protonmail.com</a>
          </p>
        </section>
      </main>
    </Layout>
  );
}
