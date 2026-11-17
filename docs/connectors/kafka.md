---
title: Apache Kafka
sidebar_label: Apache Kafka
description: Configure Apache Flink Kafka sources and sinks declaratively with Flinkboot.
---

# Apache Kafka

Flinkboot provides typed configuration models and factories to initialize Apache Flink's `KafkaSource` and `KafkaSink` directly from declarative YAML configurations.

---

## 1. Maven dependency

Add `flinkboot-kafka` to your `pom.xml`. Versions are managed automatically by the Flinkboot BOM:

```xml
<dependencies>
    <dependency>
        <groupId>com.flinkboot</groupId>
        <artifactId>flinkboot-kafka</artifactId>
    </dependency>
</dependencies>
```

---

## 2. Kafka source

### YAML configuration

You can configure subscriptions using an explicit topic list, a regex pattern, or explicit topic partitions (`partitions`):

```yaml
kafka-source:
  name: "orders-source"
  bootstrap-servers:
    - "localhost:9092"
  group-id: "order-consumers"
  client-id-prefix: "orders-reader"
  topics:
    - "orders"
    - "payments"
  starting-offsets:
    strategy: EARLIEST
  # Escape hatch: any native Kafka consumer property (SSL, SASL, timeouts)
  properties:
    security.protocol: "SASL_SSL"
    sasl.mechanism: "SCRAM-SHA-512"
    sasl.jaas.config: "org.apache.kafka.common.security.scram.ScramLoginModule required username=\"${KAFKA_USER}\" password=\"${KAFKA_PASSWORD}\";"
    ssl.truststore.location: "/var/private/ssl/kafka.truststore.jks"
    ssl.truststore.password: "${KAFKA_TRUSTSTORE_PASSWORD}"
    session.timeout.ms: "45000"
```

For bounded batch executions, specify `boundedness: BOUNDED` and configure `stopping-offsets`:

```yaml
kafka-source:
  name: "batch-orders-source"
  bootstrap-servers:
    - "localhost:9092"
  group-id: "analytics-batch"
  topic-pattern: "^analytics-.*$"
  boundedness: BOUNDED
  starting-offsets:
    strategy: TIMESTAMP
    timestamp: 1689717600000
  stopping-offsets:
    strategy: TIMESTAMP
    timestamp: 1689721200000
```

### Configuration reference

| Property Key | Type | Required | Validation | Description |
|:---|:---|:---|:---|:---|
| `name` | String | **Yes** | `@NotBlank` | Operator name registered in the Flink DAG graph. |
| `bootstrap-servers` | `List<String>` | **Yes** | `@NotEmpty`, items `@NotBlank` | Kafka bootstrap broker hosts and ports. |
| `group-id` | String | Conditional | Non-blank `@Pattern` | Optional consumer group ID. **Mandatory** when `starting-offsets` or `stopping-offsets` uses a `COMMITTED*` strategy (`COMMITTED`, `COMMITTED_EARLIEST`, `COMMITTED_LATEST`). |
| `client-id-prefix` | String | No | Non-blank `@Pattern` | Prefix for unique Kafka client IDs across parallel source subtasks (`KafkaSourceBuilder.setClientIdPrefix`). |
| `topics` | `List<String>` | Conditional | items `@NotBlank` | Explicit topic subscriptions (mutually exclusive with `topic-pattern` and `partitions`). |
| `topic-pattern` | String | Conditional | Non-blank `@Pattern`, valid regex | Topic subscription regex pattern (mutually exclusive with `topics` and `partitions`). |
| `partitions` | `List<TopicPartitionProperties>` | Conditional | items `@NotNull @Valid` (`topic`, `partition`) | Explicit topic-partition subscriptions (mutually exclusive with `topics` and `topic-pattern`), wired to `KafkaSourceBuilder.setPartitions`. |
| `starting-offsets` | `KafkaOffsetProperties` | **Yes** | `@NotNull @Valid` | Offset strategy used on startup. |
| `boundedness` | Enum | No | Enum | `UNBOUNDED` (default) or `BOUNDED`. |
| `stopping-offsets` | `KafkaOffsetProperties` | Conditional | `@Valid` | Stopping offset position. **Mandatory** when `boundedness` is `BOUNDED`. |
| `properties` | `Map<@NotBlank String, @NotNull String>` | No | Non-blank keys, non-null values | Escape hatch passed to `KafkaSourceBuilder.setProperties(...)` (e.g. SSL, SASL, timeouts). Applied last so properties override typed defaults. |

### Offset positioning (`starting-offsets` / `stopping-offsets`)

| Strategy | Required Parameters | Prohibited Parameters | Description |
|:---|:---|:---|:---|
| `EARLIEST` | None | `timestamp`, `partitions`, `reset-strategy` | Start from earliest available log offsets. |
| `LATEST` | None | `timestamp`, `partitions`, `reset-strategy` | Start from latest log offsets. |
| `COMMITTED` | None | `timestamp`, `partitions`, `reset-strategy` | Start from consumer group committed offsets. |
| `COMMITTED_EARLIEST` | None | `timestamp`, `partitions`, `reset-strategy` | Start from committed offsets, falling back to earliest if none are committed. |
| `COMMITTED_LATEST` | None | `timestamp`, `partitions`, `reset-strategy` | Start from committed offsets, falling back to latest if none are committed. |
| `TIMESTAMP` | `timestamp` (`Long`, `@PositiveOrZero`) | `partitions`, `reset-strategy` | Position based on record epoch millisecond timestamps. |
| `OFFSETS` | `partitions` (`List<TopicPartitionOffsetProperties>`), `reset-strategy` (`EARLIEST \| LATEST \| NONE`) | `timestamp` | Explicit mapping of `(topic, partition, offset)` entries with a reset strategy for unmapped partitions. Duplicate `(topic, partition)` entries fail fast. |

---

## 3. Kafka sink

### YAML configuration

```yaml
kafka-sink:
  name: "alerts-sink"
  bootstrap-servers:
    - "localhost:9092"
  topic: "fraud-alerts"
  delivery-guarantee: "EXACTLY_ONCE"
  transactional-id-prefix: "fraud-evaluator"
  # Escape hatch: any native Kafka producer property (acks, compression, batching)
  properties:
    acks: "all"
    compression.type: "zstd"
    linger.ms: "20"
```

### Configuration reference

| Property Key | Type | Required | Validation | Description |
|:---|:---|:---|:---|:---|
| `name` | String | **Yes** | `@NotBlank` | Logical identifier for the sink operator. |
| `bootstrap-servers` | `List<String>` | **Yes** | `@NotEmpty`, items `@NotBlank` | Kafka broker endpoints. |
| `topic` | String | **Yes** | `@NotBlank` | Target Kafka topic for emitted events. |
| `delivery-guarantee` | Enum | **Yes** | `NONE`, `AT_LEAST_ONCE`, `EXACTLY_ONCE` | Delivery semantic guarantee. |
| `transactional-id-prefix` | String | Conditional | String | Transactional prefix. **Mandatory** if `delivery-guarantee` is `EXACTLY_ONCE`, prohibited otherwise. |
| `properties` | `Map<@NotBlank String, @NotNull String>` | No | Non-blank keys, non-null values | Escape hatch passed to `KafkaSinkBuilder.setKafkaProducerConfig(...)` (e.g. acks, compression, batching). Applied last so properties override typed defaults. |

---

## 4. Pipeline integration

Combine `KafkaSourceProperties` and `KafkaSinkProperties` in your configuration model and instantiate them via `KafkaSourceFactory` and `KafkaSinkFactory`:

```java
package com.company.fraud.config;

import com.flinkboot.core.api.properties.JobProperties;
import com.flinkboot.kafka.api.properties.sink.KafkaSinkProperties;
import com.flinkboot.kafka.api.properties.source.KafkaSourceProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;

public record AppConfig(
    @Valid @NotNull JobProperties job,
    @Valid @NotNull KafkaSourceProperties kafkaSource,
    @Valid @NotNull KafkaSinkProperties kafkaSink
) implements Serializable {}
```

In your main entrypoint:

```java
package com.company.fraud;

import com.company.fraud.config.AppConfig;
import com.flinkboot.core.api.Flinkboot;
import com.flinkboot.kafka.api.sink.KafkaSinkFactory;
import com.flinkboot.kafka.api.source.KafkaSourceFactory;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.connector.kafka.sink.KafkaSink;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

public class FraudDetectionJob {
    public static void main(String[] args) throws Exception {
        Flinkboot boot = Flinkboot.initialize(args);
        AppConfig config = boot.configuration(AppConfig.class);
        StreamExecutionEnvironment env = boot.executionEnvironment(config.job());

        // 1. Build Kafka Source (accepts DeserializationSchema<T> or KafkaRecordDeserializationSchema<T>)
        KafkaSource<String> source = KafkaSourceFactory.supplyFor(
            config.kafkaSource(),
            new SimpleStringSchema()
        );

        // 2. Build Kafka Sink (accepts SerializationSchema<T>, customizer lambda, or KafkaRecordSerializationSchema<T>)
        KafkaSink<String> sink = KafkaSinkFactory.supplyFor(
            config.kafkaSink(),
            new SimpleStringSchema()
        );

        // 3. Connect stream pipeline
        env.fromSource(source, WatermarkStrategy.noWatermarks(), config.kafkaSource().name())
            .sinkTo(sink)
            .name(config.kafkaSink().name());

        env.execute(config.job().name());
    }
}
```

If you need programmatic customization on Flink's native builders, use `KafkaSourceFactory.supplyBuilderFor(...)` or `KafkaSinkFactory.supplyBuilderFor(...)`.
