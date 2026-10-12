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

          <div className={styles.pipelineFlow}>
            <div className={styles.flowItem}>
              <span className={styles.flowIcon}>📦</span>
              <span className={styles.flowName}>Space Cargo Source</span>
              <span className={styles.flowDetail}>Generates random cargo boxes</span>
            </div>
            <div className={styles.flowItem}>
              <span className={styles.flowIcon}>🔍</span>
              <span className={styles.flowName}>Contraband Filter</span>
              <span className={styles.flowDetail}>Flags dangerous Alien Eggs</span>
            </div>
            <div className={styles.flowItem}>
              <span className={styles.flowIcon}>🚨</span>
              <span className={styles.flowName}>Customs Alert Map</span>
              <span className={styles.flowDetail}>Formats quarantine alerts</span>
            </div>
            <div className={styles.flowItem}>
              <span className={styles.flowIcon}>🖨️</span>
              <span className={styles.flowName}>Printing Sink</span>
              <span className={styles.flowDetail}>Prints alerts to terminal</span>
            </div>
            <div className={styles.flowItem}>
              <span className={styles.flowIcon}>🖥️</span>
              <span className={styles.flowName}>Live Radar (Web UI)</span>
              <span className={styles.flowDetail}>Live graph on localhost:8080</span>
            </div>
          </div>
        </section>

        {/* Prerequisites */}
        <section className={styles.section}>
          <Heading as="h2" className={styles.centeredTitle}>
            Prerequisites
          </Heading>

          <div className={styles.prereqGrid}>
            <div className={styles.prereqItem}>
              <span className={styles.prereqIcon}>☕</span>
              <span className={styles.prereqName}>Java 11+</span>
            </div>
            <div className={styles.prereqItem}>
              <span className={styles.prereqIcon}>🪶</span>
              <span className={styles.prereqName}>Maven</span>
            </div>
            <div className={styles.prereqItem}>
              <span className={styles.prereqIcon}>💻</span>
              <span className={styles.prereqName}>IntelliJ IDEA</span>
            </div>
          </div>
        </section>

        {/* Section 1: Clone */}
        <section className={styles.section}>
          <Heading as="h2" className={styles.sectionTitle}>
            1. Clone the project
          </Heading>
          <CodeBlock language="bash">
{`git clone https://github.com/Sekelenao/Flinkboot-Quickstart.git
cd Flinkboot-Quickstart`}
          </CodeBlock>
        </section>

        {/* Section 2: IntelliJ IDEA setup */}
        <section className={styles.section}>
          <Heading as="h2" className={styles.sectionTitle}>
            2. IntelliJ IDEA setup
          </Heading>
          <p className={styles.sectionIntro}>
            Flink runtime dependencies are scoped as <code>provided</code> so fat JARs stay lightweight for remote clusters.
            To run locally in IntelliJ IDEA without a <code>ClassNotFoundException</code>, enable provided dependencies on the classpath:
          </p>

          <div className={styles.stepSequence}>
            <div className={styles.stepItem}>
              <div className={styles.stepHeader}>
                <span className={styles.stepPill}>1</span>
                <Heading as="h3" className={styles.stepHeading}>
                  Open Run Configuration
                </Heading>
              </div>
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
              <div className={styles.stepHeader}>
                <span className={styles.stepPill}>2</span>
                <Heading as="h3" className={styles.stepHeading}>
                  Access options
                </Heading>
              </div>
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
              <div className={styles.stepHeader}>
                <span className={styles.stepPill}>3</span>
                <Heading as="h3" className={styles.stepHeading}>
                  Include provided dependencies
                </Heading>
              </div>
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
              <div className={styles.stepHeader}>
                <span className={styles.stepPill}>4</span>
                <Heading as="h3" className={styles.stepHeading}>
                  Launch
                </Heading>
              </div>
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
          <Heading as="h2" className={styles.sectionTitle}>
            3. Watch the scanner run live!
          </Heading>
          <p className={styles.sectionIntro}>
            Your pipeline is actively streaming data and inspecting cargo boxes in real time. The output prints directly in your IntelliJ console, and by default, a local Flink Web UI is available at{' '}
            <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">
              http://localhost:8080
            </a>.
          </p>
        </section>
      </main>
    </Layout>
  );
}
