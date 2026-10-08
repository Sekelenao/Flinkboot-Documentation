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
        <groupId>io.github.sekelenao</groupId>
        <artifactId>flinkboot-kafka</artifactId>
    </dependency>
</dependencies>
```

---

## 2. Kafka source

### YAML configuration

You can configure subscriptions using either an explicit topic list or a regex pattern:

```yaml
kafka-source:
  name: "orders-source"
  bootstrap-servers:
    - "localhost:9092"
  group-id: "order-consumers"
  topics:
    - "orders"
    - "payments"
  starting-offsets: "EARLIEST"
  properties:
    session.timeout.ms: "45000"
```

For timestamp-based positioning:

```yaml
kafka-source:
  name: "replay-orders-source"
  bootstrap-servers:
    - "localhost:9092"
  group-id: "replay-consumers"
  topics:
    - "orders"
  starting-offsets: "TIMESTAMP"
  starting-offsets-timestamp: 1689717600000
```

For explicit partition offsets:

```yaml
kafka-source:
  name: "partition-orders-source"
  bootstrap-servers:
    - "localhost:9092"
  group-id: "partition-consumers"
  topics:
    - "orders"
  starting-offsets: "OFFSETS"
  starting-offsets-partition-offsets:
    - topic: "orders"
      partition: 0
      offset: 12500
    - topic: "orders"
      partition: 1
      offset: 14200
```

### Configuration reference

| Property Key | Type | Required | Validation | Description |
|:---|:---|:---|:---|:---|
| `name` | String | **Yes** | `@NotBlank` | Operator name registered in the Flink DAG graph. |
| `bootstrap-servers` | `List<String>` | **Yes** | `@NotEmpty`, items `@NotBlank` | Kafka bootstrap broker hosts and ports. |
| `group-id` | String | **Yes** | `@NotBlank` | Consumer group ID. |
| `topics` | `List<String>` | Conditional | items `@NotBlank` | Explicit topic subscriptions (mutually exclusive with `topic-pattern`). |
| `topic-pattern` | String | Conditional | Valid regex | Topic subscription regex pattern (mutually exclusive with `topics`). |
| `starting-offsets` | Enum | **Yes** | `@NotNull` | Startup strategy: `EARLIEST`, `LATEST`, `COMMITTED`, `TIMESTAMP`, `OFFSETS`. |
| `starting-offsets-timestamp` | Long | Conditional | `@PositiveOrZero` | Timestamp in milliseconds (**mandatory** if `starting-offsets: TIMESTAMP`, forbidden otherwise). |
| `starting-offsets-partition-offsets` | List | Conditional | `@Valid` items | List of partition starting offsets (**mandatory** if `starting-offsets: OFFSETS`, forbidden otherwise). |
| `properties` | `Map<String, String>` | No | Free-form map | Additional Kafka consumer tuning properties (e.g. `session.timeout.ms`). |

### Offset strategies (`starting-offsets`)

| Strategy | Required Complementary Keys | Forbidden Complementary Keys | Description |
|:---|:---|:---|:---|
| `EARLIEST` | None | `starting-offsets-timestamp`, `starting-offsets-partition-offsets` | Start from earliest available log offsets. |
| `LATEST` | None | `starting-offsets-timestamp`, `starting-offsets-partition-offsets` | Start from latest log offsets. |
| `COMMITTED` | None | `starting-offsets-timestamp`, `starting-offsets-partition-offsets` | Start from consumer group committed offsets. |
| `TIMESTAMP` | `starting-offsets-timestamp` (`Long`) | `starting-offsets-partition-offsets` | Position based on record epoch millisecond timestamps. |
| `OFFSETS` | `starting-offsets-partition-offsets` (`List`) | `starting-offsets-timestamp` | Explicit starting offsets per topic partition. |

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
  properties:
    acks: "all"
```

### Configuration reference

| Property Key | Type | Required | Validation | Description |
|:---|:---|:---|:---|:---|
| `name` | String | **Yes** | `@NotBlank` | Logical identifier for the sink operator. |
| `bootstrap-servers` | `List<String>` | **Yes** | `@NotEmpty`, items `@NotBlank` | Kafka broker endpoints. |
| `topic` | String | **Yes** | `@NotBlank` | Target Kafka topic for emitted events. |
| `delivery-guarantee` | Enum | **Yes** | `NONE`, `AT_LEAST_ONCE`, `EXACTLY_ONCE` | Delivery semantic guarantee. |
| `transactional-id-prefix` | String | Conditional | String | Transactional prefix. **Mandatory** if `delivery-guarantee` is `EXACTLY_ONCE`, prohibited otherwise. |
| `properties` | `Map<String, String>` | No | Non-blank keys/values | Custom Kafka producer client settings. |

---

## 4. Pipeline integration

Combine `KafkaSourceProperties` and `KafkaSinkProperties` in your configuration model and instantiate them via `KafkaSourceFactory` and `KafkaSinkFactory`:

```java
package com.company.fraud.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.github.sekelenao.flinkboot.core.api.properties.JobProperties;
import io.github.sekelenao.flinkboot.kafka.api.properties.sink.KafkaSinkProperties;
import io.github.sekelenao.flinkboot.kafka.api.properties.source.KafkaSourceProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;

public record AppConfig(
    @Valid @NotNull @JsonProperty("job") JobProperties job,
    @Valid @NotNull @JsonProperty("kafka-source") KafkaSourceProperties kafkaSource,
    @Valid @NotNull @JsonProperty("kafka-sink") KafkaSinkProperties kafkaSink
) implements Serializable {}
```

In your main entrypoint:

```java
package com.company.fraud;

import com.company.fraud.config.AppConfig;
import io.github.sekelenao.flinkboot.core.api.Flinkboot;
import io.github.sekelenao.flinkboot.kafka.api.sink.KafkaSinkFactory;
import io.github.sekelenao.flinkboot.kafka.api.source.KafkaSourceFactory;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.connector.kafka.sink.KafkaRecordSerializationSchema;
import org.apache.flink.connector.kafka.sink.KafkaSink;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.reader.deserializer.KafkaRecordDeserializationSchema;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

public class FraudDetectionJob {
    public static void main(String[] args) throws Exception {
        Flinkboot boot = Flinkboot.initialize(args);
        AppConfig config = boot.configuration(AppConfig.class);
        StreamExecutionEnvironment env = boot.executionEnvironment(config.job());

        // 1. Build Kafka Source
        KafkaSource<String> source = KafkaSourceFactory.supplyFor(
            config.kafkaSource(),
            KafkaRecordDeserializationSchema.valueOnly(new SimpleStringSchema())
        );

        // 2. Build Kafka Sink
        KafkaSink<String> sink = KafkaSinkFactory.supplyFor(
            config.kafkaSink(),
            KafkaRecordSerializationSchema.builder()
                .setTopic(config.kafkaSink().topic())
                .setValueSerializationSchema(new SimpleStringSchema())
                .build()
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
