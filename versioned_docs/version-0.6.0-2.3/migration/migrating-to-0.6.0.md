---
title: Migrating from 0.5.0 to 0.6.0
sidebar_label: 0.5.0 → 0.6.0
description: Step-by-step guide to upgrading Flinkboot applications from 0.5.0-1.20 to 0.6.0-1.20, including namespace relocation, YAML naming strategies, and breaking configuration changes.
---

# Migrating from 0.5.0 to 0.6.0

This guide covers all breaking changes, behavioral updates, and stricter validation rules introduced in **Flinkboot `0.6.0`** (`0.6.0-2.3` and `0.6.0-1.20`), along with exact migration steps from `0.5.0-1.20`.

---

## 1. Maven coordinates, Java packages & JPMS modules

Flinkboot has moved to its canonical `com.flinkboot` namespace across Maven coordinates, Java packages, and JPMS module descriptors.

### Maven `pom.xml`

Update the BOM and all Flinkboot dependencies from `io.github.sekelenao` to `com.flinkboot`:

```xml
<!-- Before (0.5.0-1.20) -->
<dependency>
    <groupId>io.github.sekelenao</groupId>
    <artifactId>flinkboot</artifactId>
    <version>0.5.0-1.20</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>

<!-- After (0.6.0-2.3) -->
<dependency>
    <groupId>com.flinkboot</groupId>
    <artifactId>flinkboot</artifactId>
    <version>0.6.0-2.3</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
```

Update `<groupId>` to `com.flinkboot` on `flinkboot-core`, `flinkboot-kafka`, `flinkboot-fluss`, and `flinkboot-test`. If you use `maven-shade-plugin`, update the Jackson relocation pattern to `com.flinkboot.shaded.fasterxml`.

### Java imports & JPMS modules

Replace all `io.github.sekelenao.flinkboot.*` imports with `com.flinkboot.*`:

```java
// Before
import io.github.sekelenao.flinkboot.core.api.Flinkboot;
import io.github.sekelenao.flinkboot.kafka.api.source.KafkaSourceFactory;
import static io.github.sekelenao.flinkboot.test.api.assertion.FlinkbootAssertions.assertThat;

// After
import com.flinkboot.core.api.Flinkboot;
import com.flinkboot.kafka.api.source.KafkaSourceFactory;
import static com.flinkboot.test.api.assertion.FlinkbootAssertions.assertThat;
```

If your project uses `module-info.java`, update the module names:

| 0.5.0 Module | 0.6.0 Module |
|:---|:---|
| `io.github.sekelenao.flinkboot.core` | `com.flinkboot.core` |
| `io.github.sekelenao.flinkboot.test` | `com.flinkboot.test` |
| `io.github.sekelenao.flinkboot.kafka` | `com.flinkboot.kafka` |
| `io.github.sekelenao.flinkboot.fluss` | `com.flinkboot.fluss` |

---

## 2. YAML property naming (`KEBAB_CASE` vs `camelCase`)

In `0.6.0`, `YamlParser` uses Jackson's `PropertyNamingStrategies.KEBAB_CASE` by default. CamelCase Java fields now automatically map to kebab-case YAML keys without needing `@JsonProperty(...)` annotations, and Bean Validation violation paths are consistently reported in kebab-case (e.g. `database.max-connections`).

### Reverting to `camelCase` in YAML

If your existing YAML files use `camelCase` keys (for example `thresholdAmount` instead of `threshold-amount`) and you do not want to rename them yet, you have two options:

#### Option A: Revert globally via `YAMLMapper` builder customizer

Pass a builder customizer to `boot.configuration(...)` to restore `LOWER_CAMEL_CASE`:

```java
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

AppConfig config = boot.configuration(AppConfig.class, builder ->
    builder.propertyNamingStrategy(PropertyNamingStrategies.LOWER_CAMEL_CASE)
);
```

#### Option B: Override individual fields with `@JsonProperty`

Keep `KEBAB_CASE` globally and annotate specific fields that must remain `camelCase`:

```java
public record AlertingProperties(
    @JsonProperty("thresholdAmount") double thresholdAmount,
    Duration evaluationWindow // still maps to "evaluation-window"
) implements Serializable {}
```

---

## 3. Core execution & state configuration (`flinkboot-core`)

### Relocated checkpoint storage (`checkpointing.storage`)

`checkpoint-storage` has been moved from `state-backend` to `checkpointing` to align with Flink's `CheckpointConfig`:

```yaml
# Before (0.5.0)
environment:
  state-backend:
    type: "ROCKSDB"
    checkpoint-storage: "FILESYSTEM"

# After (0.6.0)
environment:
  checkpointing:
    storage: "FILESYSTEM"
  state-backend:
    type: "ROCKSDB"
```

In Java, `CheckpointStorageType` moved from `com.flinkboot.core.api.properties.state` to `com.flinkboot.core.api.properties.checkpointing`.

### Removal of `StateBackendType.CHANGELOG`

`state-backend.type: CHANGELOG` has been removed (it caused runtime `DynamicCodeLoadingException` failures). Configure state changelogging using the boolean `changelog` flag on top of `HASHMAP` or `ROCKSDB`:

```yaml
# Before (0.5.0)
state-backend:
  type: "CHANGELOG"

# After (0.6.0)
state-backend:
  type: "ROCKSDB"
  changelog: true
```

### Removal of `RestoreMode.LEGACY`

`RestoreMode.LEGACY` has been removed. Update `savepoint-restore.restore-mode` to `CLAIM` or `NO_CLAIM`:

```yaml
savepoint-restore:
  savepoint-path: "/mnt/savepoints/savepoint-0001"
  restore-mode: "NO_CLAIM" # CLAIM or NO_CLAIM
```

### Stricter Bean Validation rules at startup

`0.6.0` catches several misconfigurations fail-fast during Bean Validation that Flink previously ignored or failed on at runtime:

- **Incremental checkpoints with `HASHMAP`**: `state-backend.incremental: true` is now rejected when `state-backend.type: HASHMAP`.
- **Unaligned checkpoints mode**: `checkpointing.unaligned-checkpoints: true` is rejected when `checkpointing.mode: AT_LEAST_ONCE` (use `EXACTLY_ONCE`).
- **Aligned checkpoint timeout**: `checkpointing.aligned-checkpoint-timeout` now requires `checkpointing.unaligned-checkpoints: true`.
- **Checkpoint concurrency**: a positive `checkpointing.min-pause-between-checkpoints` cannot be combined with `checkpointing.max-concurrent-checkpoints > 1`.
- **Exponential delay backoff**: `initial-backoff` and `max-backoff` must either both be specified or both be omitted; `backoff-multiplier` must be strictly greater than `1.0`.
- **Blank map keys**: blank keys in `environment.properties` are now rejected with `ConfigurationValidationException`.
- **Empty classpath locations**: `ClasspathResource.inputStream()` now fails fast with `ResourceNotFoundException` on empty or slash-only paths (such as `classpath:/` or `/`).

---

## 4. Kafka connector (`flinkboot-kafka`)

### `starting-offsets` migrated to a nested object

`starting-offsets` is now a nested object requiring a `strategy` key, replacing flat `starting-offsets-timestamp` and `starting-offsets-partition-offsets` keys:

```yaml
# Before (0.5.0)
kafka-source:
  starting-offsets: "TIMESTAMP"
  starting-offsets-timestamp: 1689717600000

# After (0.6.0)
kafka-source:
  starting-offsets:
    strategy: "TIMESTAMP"
    timestamp: 1689717600000
```

When using `strategy: OFFSETS`, configure `partitions` as a list of `{ topic, partition, offset }` objects along with `reset-strategy` (`EARLIEST`, `LATEST`, or `NONE`):

```yaml
kafka-source:
  starting-offsets:
    strategy: "OFFSETS"
    reset-strategy: "EARLIEST"
    partitions:
      - topic: "orders"
        partition: 0
        offset: 1024
```

In Java, update calls on `KafkaSourceProperties` to use `config.startingOffsets().strategy()`, `.timestamp()`, `.partitions()`, and `.resetStrategy()`.

### `group-id` now returns `Optional<String>`

`KafkaSourceProperties#groupId()` now returns `Optional<String>` instead of `String`:

```java
// Before (0.5.0)
String groupId = config.kafkaSource().groupId();

// After (0.6.0)
String groupId = config.kafkaSource().groupId().orElse("default-group");
```

In YAML, `group-id` is now optional unless `starting-offsets` or `stopping-offsets` uses a `COMMITTED*` strategy (`COMMITTED`, `COMMITTED_EARLIEST`, or `COMMITTED_LATEST`).

### Blank keys in connector `properties` maps

Blank keys in `kafka-source.properties`, `kafka-sink.properties`, `fluss-source.properties`, and `fluss-sink.properties` are now rejected with `ConfigurationValidationException` (empty string values `""` remain allowed).

---

## 5. Flink 2.3 specific changes (`0.6.0-2.3`)

If you are targeting Apache Flink `2.3.0` with **`0.6.0-2.3`**, note these additional requirements and removals:

* **Java 17+ baseline**: `0.6.0-2.3` targets Flink `2.3.0` (`flink-connector-kafka` `5.0.0-2.2`, `fluss-flink-2.3` `1.0.0`) and requires **Java 17 or later**.
* **Removal of `com.flinkboot.core.api.typing.collection`**: `ListTypeInfoFactory` and `MapTypeInfoFactory` have been removed, as Flink `2.3` natively extracts `List` and `Map` types without requiring `@TypeInfo` annotations. Remove `@TypeInfo(ListTypeInfoFactory.class)` and `@TypeInfo(MapTypeInfoFactory.class)` from your POJO fields.
* **Removal of Flink 1.x legacy overloads**: `DurationTypeInfo#createSerializer(ExecutionConfig)` and `CollectingSink#createWriter(InitContext)` have been removed along with Flink `1.x` compatibility. Use `DurationTypeInfo#createSerializer(SerializerConfig)` and `CollectingSink#createWriter(WriterInitContext)` instead.
