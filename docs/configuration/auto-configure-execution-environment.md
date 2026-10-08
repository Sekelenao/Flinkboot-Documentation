---
title: Bootstrapping execution environment
sidebar_label: Bootstrapping execution environment
description: Reference guide to bootstrapping Apache Flink's StreamExecutionEnvironment directly from declarative YAML via JobProperties.
---

# Bootstrapping execution environment

Flinkboot automatically resolves, instantiates, and wires Apache Flink's `StreamExecutionEnvironment` directly from your YAML configuration with zero imperative plumbing.

Instead of handwriting hundreds of lines configuring state backends, checkpoints, exponential backoffs, and metrics, Flinkboot translates your declarative `JobProperties` into production-grade Flink execution settings in a single call.

```java
// Instantiates and auto-configures the Flink environment from your YAML
StreamExecutionEnvironment env = boot.executionEnvironment(config.job());
```

---

## 1. How Auto-Configuration Works

When you invoke `boot.executionEnvironment(JobProperties properties)`, Flinkboot applies the following lifecycle under the hood:

1. **Fail-Fast Invariant Checks**: Verifies all cross-field constraints (e.g. exponential backoff boundaries, valid state backend classes, and checkpoint storage paths).
2. **Context Discovery (MiniCluster vs Cluster)**:
   - **Local WebUI Mode (`local-web-ui.enabled: true`)**: Instantiates an embedded local MiniCluster with the Flink WebUI active (`StreamExecutionEnvironment.createLocalEnvironmentWithWebUI(...)`).
   - **Cluster Mode (`local-web-ui.enabled: false` or omitted)**: Calls Flink's native `StreamExecutionEnvironment.getExecutionEnvironment(...)` to automatically adapt to your runtime context (Standalone, Kubernetes, YARN, or local testing).
3. **Automated Setting Application**: Injects RocksDB state backend, unaligned checkpointing, restart strategies, buffer timeouts, and watermark intervals directly onto Flink's native `Configuration` object.

---

## 2. Complete Production YAML Example

Here is a complete YAML reference demonstrating all supported execution environment features:

```yaml
# Configuration block mapped to JobProperties
name: "order-stream-processor"

environment:
  execution:
    runtime-mode: "STREAMING"
    parallelism: 8
    max-parallelism: 128
    buffer-timeout: "PT0.05S"
    auto-watermark-interval: "PT0.2S"
    object-reuse: true

  checkpointing:
    enabled: true
    interval: "PT30S"
    mode: "EXACTLY_ONCE"
    timeout: "PT2M"
    min-pause-between-checkpoints: "PT5S"
    max-concurrent-checkpoints: 1
    externalized-checkpoint-cleanup: "RETAIN_ON_CANCELLATION"
    unaligned-checkpoints: true
    aligned-checkpoint-timeout: "PT1S"
    storage-uri: "s3://flink-checkpoints/order-processor"

  state-backend:
    type: "ROCKSDB"
    checkpoint-storage: "FILESYSTEM"
    incremental: true
    latency-tracking: true

  restart-strategy:
    type: "EXPONENTIAL_DELAY"
    exponential-delay:
      initial-backoff: "PT1S"
      max-backoff: "PT1M"
      backoff-multiplier: 2.0
      reset-backoff-threshold: "PT1H"
      jitter-factor: 0.1

  savepoint-restore:
    savepoint-path: "/mnt/savepoints/savepoint-0001"
    allow-non-restored-state: false
    restore-mode: "CLAIM"

  local-web-ui:
    enabled: false
    port: 8081
    bind-address: "localhost"

  # Universal escape-hatch for arbitrary Flink Configuration options
  properties:
    taskmanager.memory.managed.fraction: "0.4"
    pipeline.operator-chaining.enabled: "true"
```

---

## 3. Configuration Reference Specification

Below is the complete specification of all properties supported by `JobProperties`.

### A. Job Metadata

| Property Key  | Type   | Required | Description |
|:--------------|:-------|:---------|:------------|
| `name`        | String | **Yes**  | Canonical job name registered with Flink (`PipelineOptions.NAME`). |
| `environment` | Object | No       | Execution environment settings (`ExecutionEnvironmentProperties`). |

---

### B. Execution Options (`environment.execution:`)

| Property Key              | Type       | Required | Validation                  | Description |
|:--------------------------|:-----------|:---------|:----------------------------|:------------|
| `runtime-mode`            | Enum       | No       | Enum                        | Execution runtime mode: `STREAMING`, `BATCH`, or `AUTOMATIC` (`ExecutionOptions.RUNTIME_MODE`). |
| `parallelism`             | Integer    | No       | `@Positive`                 | Default execution parallelism (`CoreOptions.DEFAULT_PARALLELISM`). |
| `max-parallelism`         | Integer    | No       | `@Positive`                 | Maximum parallelism for key groups rescale (`PipelineOptions.MAX_PARALLELISM`). |
| `buffer-timeout`          | `Duration` | No       | `@DurationMin(millis = 0)`  | Buffer timeout (`ExecutionOptions.BUFFER_TIMEOUT`), e.g. `"PT0.05S"`. |
| `auto-watermark-interval` | `Duration` | No       | `@DurationMin(millis = 0)`  | Periodic watermark emission interval (`PipelineOptions.AUTO_WATERMARK_INTERVAL`), e.g. `"PT0.2S"`. |
| `object-reuse`            | Boolean    | No       | Boolean                     | Enable object reuse optimization (`PipelineOptions.OBJECT_REUSE`). Defaults to `false`. |

---

### C. Fault Tolerance & Checkpointing (`environment.checkpointing:`)

| Property Key                      | Type       | Required | Validation                  | Description |
|:----------------------------------|:-----------|:---------|:----------------------------|:------------|
| `enabled`                         | Boolean    | No       | Boolean                     | Master switch for checkpointing. Defaults to `true` when block is present. |
| `interval`                        | `Duration` | No       | `@DurationMin(millis = 1)`  | Time interval between checkpoints (`CheckpointingOptions.CHECKPOINTING_INTERVAL`), e.g. `"PT30S"`. |
| `mode`                            | Enum       | No       | Enum                        | Consistency mode: `EXACTLY_ONCE` or `AT_LEAST_ONCE`. |
| `timeout`                         | `Duration` | No       | `@DurationMin(millis = 1)`  | Maximum checkpoint duration before aborting (`CheckpointingOptions.CHECKPOINTING_TIMEOUT`). |
| `min-pause-between-checkpoints`   | `Duration` | No       | `@DurationMin(millis = 0)`  | Minimum rest duration between consecutive checkpoints. |
| `max-concurrent-checkpoints`      | Integer    | No       | `@Positive`                 | Maximum concurrent checkpoints allowed. |
| `externalized-checkpoint-cleanup` | Enum       | No       | Enum                        | Cleanup retention on cancel: `RETAIN_ON_CANCELLATION`, `DELETE_ON_CANCELLATION`, or `NO_EXTERNALIZED_CHECKPOINTS`. |
| `unaligned-checkpoints`           | Boolean    | No       | Boolean                     | Enable unaligned checkpoints (`CheckpointingOptions.ENABLE_UNALIGNED`). |
| `aligned-checkpoint-timeout`      | `Duration` | No       | `@DurationMin(millis = 0)`  | Timeout before switching to unaligned checkpoints, e.g. `"PT1S"`. |
| `storage-uri`                     | String     | No       | String                      | Target checkpoint storage URI, e.g. `s3://bucket/checkpoints`. |

---

### D. State Backend & RocksDB (`environment.state-backend:`)

| Property Key         | Type    | Required                      | Validation | Description |
|:---------------------|:--------|:------------------------------|:-----------|:------------|
| `type`               | Enum    | No                            | Enum       | State backend type: `ROCKSDB`, `HASHMAP`, `CHANGELOG`, or `CUSTOM`. |
| `checkpoint-storage` | Enum    | No                            | Enum       | Storage mechanism: `JOBMANAGER` or `FILESYSTEM`. |
| `incremental`        | Boolean | No                            | Boolean    | Enable incremental checkpoints for RocksDB (`CheckpointingOptions.INCREMENTAL_CHECKPOINTS`). |
| `latency-tracking`   | Boolean | No                            | Boolean    | Enable latency tracking metrics for state access (`StateBackendOptions.LATENCY_TRACK_ENABLED`). |
| `custom-class`       | String  | **Yes** (if `type == CUSTOM`) | String     | Fully qualified class name for custom state backend. Allowed **only** when `type: CUSTOM`. |

---

### E. Restart Strategies (`environment.restart-strategy:`)

The `restart-strategy` block accepts a `type` (`NO_RESTART`, `FIXED_DELAY`, `FAILURE_RATE`, `EXPONENTIAL_DELAY`, `FALLBACK`) and at most **one** matching sub-block.

#### 1. Fixed Delay (`type: FIXED_DELAY`)
```yaml
restart-strategy:
  type: "FIXED_DELAY"
  fixed-delay:
    attempts: 3
    delay: "PT10S"
```
* `attempts` (`Integer`): Number of restart attempts (`@PositiveOrZero`).
* `delay` (`Duration`): Delay between attempts (`@DurationMin(millis = 0)`).

#### 2. Failure Rate (`type: FAILURE_RATE`)
```yaml
restart-strategy:
  type: "FAILURE_RATE"
  failure-rate:
    max-failures-per-interval: 5
    failure-interval: "PT5M"
    delay: "PT10S"
```
* `max-failures-per-interval` (`Integer`): Maximum failures within interval (`@Positive`).
* `failure-interval` (`Duration`): Evaluation window (`@DurationMin(millis = 1)`).
* `delay` (`Duration`): Delay between attempts (`@DurationMin(millis = 0)`).

#### 3. Exponential Delay (`type: EXPONENTIAL_DELAY`)
```yaml
restart-strategy:
  type: "EXPONENTIAL_DELAY"
  exponential-delay:
    initial-backoff: "PT1S"
    max-backoff: "PT1M"
    backoff-multiplier: 2.0
    reset-backoff-threshold: "PT1H"
    jitter-factor: 0.1
```
* `initial-backoff` (`Duration`): Initial backoff delay (`@DurationMin(millis = 1)`).
* `max-backoff` (`Duration`): Maximum backoff cap (greater than or equal to `initial-backoff`).
* `backoff-multiplier` (`Double`): Multiplier strictly greater than 1.0.
* `reset-backoff-threshold` (`Duration`): Time required without failures to reset backoff.
* `jitter-factor` (`Double`): Jitter randomization factor between `0.0` and `1.0`.

---

### F. Savepoint Recovery (`environment.savepoint-restore:`)

```yaml
savepoint-restore:
  savepoint-path: "/mnt/savepoints/savepoint-0001"
  allow-non-restored-state: false
  restore-mode: "CLAIM"
```

| Property Key               | Type    | Required | Validation  | Description |
|:---------------------------|:--------|:---------|:------------|:------------|
| `savepoint-path`           | String  | **Yes**  | `@NotBlank` | Path to savepoint or initial checkpoint directory. |
| `allow-non-restored-state` | Boolean | No       | Boolean     | Start even if savepoint contains unmapped subtask state. |
| `restore-mode`             | Enum    | No       | Enum        | Restore mode: `CLAIM`, `NO_CLAIM`, or `LEGACY`. |

---

### G. Local Dev WebUI (`environment.local-web-ui:`)

```yaml
local-web-ui:
  enabled: true
  port: 8081
  bind-address: "localhost"
```

* `enabled` (`Boolean`): Starts a local Flink MiniCluster with the WebUI dashboard active during IDE testing.
* `port` (`Integer`): WebUI REST port (defaults to `8081`).
* `bind-address` (`String`): WebUI host bind address (defaults to `localhost`).

Enabling `local-web-ui.enabled: true` requires `org.apache.flink:flink-runtime-web` on the classpath. If set to `true` inside a remote Flink cluster, Flinkboot fails fast with an `UnsupportedExecutionEnvironmentException`.

---

### H. Universal Escape Hatch (`environment.properties:`)

Arbitrary Flink configuration key-value pairs (`Map<String, String>`) applied directly onto Flink's native `Configuration` object:

```yaml
environment:
  properties:
    taskmanager.memory.managed.fraction: "0.4"
    pipeline.operator-chaining.enabled: "true"
```

Properties specified in `properties` take direct precedence over typed YAML properties in case of conflict.
