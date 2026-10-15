import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';

export default function Quickstart(): ReactNode {
  return (
    <Layout
      title="Quickstart"
      description="Flinkboot quickstart: clone, launch, and inspect a live Apache Flink pipeline.">
      <main className={styles.pageContainer}>
        {/* Header */}
        <section className={styles.section}>
          <Heading as="h1" className={styles.mainTitle}>
            Quickstart
          </Heading>
          <p className={styles.pageSubtitle}>
            Clone, launch, and inspect a live Apache Flink pipeline in under 2 minutes.
          </p>

          <p className={styles.prereqText}>
            <span className={styles.prereqLabel}>Prerequisite:</span>
            <span className={styles.prereqValue}>IntelliJ IDEA (with Java 11+)</span>
          </p>
        </section>

        {/* Section 1: Clone */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.stepPill}>1</span>
            <Heading as="h2" className={styles.sectionTitle}>
              Clone the project
            </Heading>
          </div>
          <CodeBlock language="bash">
{`git clone https://github.com/Sekelenao/Flinkboot-Quickstart.git
cd Flinkboot-Quickstart`}
          </CodeBlock>
        </section>

        {/* Section 2: IntelliJ IDEA setup */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.stepPill}>2</span>
            <Heading as="h2" className={styles.sectionTitle}>
              IntelliJ IDEA setup
            </Heading>
          </div>
          <p className={styles.sectionIntro}>
            Flink runtime dependencies are scoped as <code>provided</code> so fat JARs stay lightweight for remote clusters.
            To run locally in IntelliJ IDEA without a <code>ClassNotFoundException</code>, enable provided dependencies on the classpath:
          </p>

          <div className={styles.stepSequence}>
            <div className={styles.stepItem}>
              <Heading as="h3" className={styles.subStepTitle}>
                Open Run Configuration
              </Heading>
              <p className={styles.stepExplanation}>
                Right-click <code>Main.java</code> &gt; <strong>More Run/Debug</strong> &gt; <strong>Modify Run Configuration...</strong>
              </p>
              <img
                src="/img/quickstart/rightclick_main_run_configuration.png"
                alt="Right-click Main class and open Run Configuration"
                className={styles.stepImage}
              />
            </div>

            <div className={styles.stepItem}>
              <Heading as="h3" className={styles.subStepTitle}>
                Access options
              </Heading>
              <p className={styles.stepExplanation}>
                In the top-right of the modal, click <strong>Modify options</strong> (or press <code>Alt + M</code>).
              </p>
              <img
                src="/img/quickstart/modify_options.png"
                alt="Click Modify options in run configuration"
                className={styles.stepImage}
              />
            </div>

            <div className={styles.stepItem}>
              <Heading as="h3" className={styles.subStepTitle}>
                Include provided dependencies
              </Heading>
              <p className={styles.stepExplanation}>
                Under <strong>Java</strong>, check <strong>Add dependencies with "provided" scope to classpath</strong>.
              </p>
              <img
                src="/img/quickstart/add_provided_classpath.png"
                alt="Check Add dependencies with provided scope to classpath"
                className={styles.stepImage}
              />
            </div>

            <div className={styles.stepItem}>
              <Heading as="h3" className={styles.subStepTitle}>
                Launch
              </Heading>
              <p className={styles.stepExplanation}>
                Click <strong>Apply</strong>, then hit the green <strong>Run 'Main'</strong> button!
              </p>
              <img
                src="/img/quickstart/run_main.png"
                alt="Click Run Main"
                className={styles.stepImage}
              />
            </div>
          </div>
        </section>

        {/* Section 3: Live Results */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.stepPill}>3</span>
            <Heading as="h2" className={styles.sectionTitle}>
              Watch the scanner run live!
            </Heading>
          </div>
          <p className={styles.sectionIntro}>
            Your pipeline is actively streaming data and inspecting cargo boxes in real time. The output prints directly in your IntelliJ console, and by default, a local Flink Web UI is available at{' '}
            <a
              href="http://localhost:8080"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}>
              http://localhost:8080
            </a>.
          </p>
        </section>
      </main>
    </Layout>
  );
}
