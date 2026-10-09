---
title: Apache Fluss
sidebar_label: Apache Fluss
description: Configure Apache Flink Fluss sources and sinks declaratively with Flinkboot.
---

# Apache Fluss

Flinkboot provides typed configuration models and factories to initialize Apache Flink's `FlussSource` and `FlussSink` directly from declarative YAML configurations.

---

## 1. Maven dependency

Add `flinkboot-fluss` to your `pom.xml`. Versions are managed automatically by the Flinkboot BOM:

```xml
<dependencies>
    <dependency>
        <groupId>io.github.sekelenao</groupId>
        <artifactId>flinkboot-fluss</artifactId>
    </dependency>
</dependencies>
```

---

## 2. Fluss source

### YAML configuration

```yaml
fluss-source:
  name: "events-source"
  bootstrap-servers:
    - "localhost:9123"
  database: "analytics_db"
  table: "user_events"
  startup-mode: "EARLIEST"
  # Escape hatch: any native Fluss client option (security, buffers, timeouts)
  properties:
    client.security.protocol: "SASL_PLAINTEXT"
    client.security.sasl.mechanism: "PLAIN"
    client.security.sasl.username: "${FLUSS_USERNAME}"
    client.security.sasl.password: "${FLUSS_PASSWORD}"
    client.scanner.fetch.max-bytes: "1048576"
```

For timestamp-based positioning:

```yaml
fluss-source:
  name: "replay-source"
  bootstrap-servers:
    - "localhost:9123"
  database: "analytics_db"
  table: "user_events"
  startup-mode: "TIMESTAMP"
  startup-timestamp: 1700000000000
```

### Configuration reference

| Property Key | Type | Required | Validation | Description |
|:---|:---|:---|:---|:---|
| `name` | String | **Yes** | `@NotBlank` | Unique operator identifier in the Flink DAG graph. |
| `bootstrap-servers` | `List<String>` | **Yes** | `@NotEmpty`, items `@NotBlank` | Addresses of Fluss coordinators. |
| `database` | String | **Yes** | `@NotBlank` | Target Fluss database. |
| `table` | String | **Yes** | `@NotBlank` | Target Fluss table. |
| `startup-mode` | Enum | **Yes** | `@NotNull` | Startup strategy: `EARLIEST`, `LATEST`, `FULL`, `TIMESTAMP`. |
| `startup-timestamp` | Long | Conditional | `@PositiveOrZero` | Epoch millisecond timestamp (**mandatory** if `startup-mode: TIMESTAMP`, forbidden otherwise). |
| `properties` | `Map<String, String>` | No | Non-blank keys/values | Escape hatch passed to `FlussSourceBuilder.setFlussConfig(...)` (e.g. SASL security, fetch sizes). |

---

## 3. Fluss sink

### YAML configuration

```yaml
fluss-sink:
  name: "aggregates-sink"
  bootstrap-servers:
    - "localhost:9123"
  database: "analytics_db"
  table: "user_aggregates"
  # Escape hatch: any native Fluss writer option (batching, timeouts, acks)
  properties:
    client.writer.batch-size: "1mb"
    client.writer.batch-timeout: "50ms"
    client.writer.acks: "all"
```

### Configuration reference

| Property Key | Type | Required | Validation | Description |
|:---|:---|:---|:---|:---|
| `name` | String | **Yes** | `@NotBlank` | Unique operator identifier in the Flink DAG graph. |
| `bootstrap-servers` | `List<String>` | **Yes** | `@NotEmpty`, items `@NotBlank` | Addresses of Fluss coordinators. |
| `database` | String | **Yes** | `@NotBlank` | Target Fluss database. |
| `table` | String | **Yes** | `@NotBlank` | Target Fluss table. |
| `properties` | `Map<String, String>` | No | Non-blank keys/values | Escape hatch passed to `FlussSinkBuilder.setOptions(...)` (e.g. batch size, timeout, acks). |

---

## 4. Pipeline integration

Combine `FlussSourceProperties` and `FlussSinkProperties` in your configuration model and initialize them with `FlussSourceFactory` and `FlussSinkFactory`:

```java
package com.company.analytics.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.github.sekelenao.flinkboot.core.api.properties.JobProperties;
import io.github.sekelenao.flinkboot.fluss.api.properties.sink.FlussSinkProperties;
import io.github.sekelenao.flinkboot.fluss.api.properties.source.FlussSourceProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;

public record AppConfig(
    @Valid @NotNull @JsonProperty("job") JobProperties job,
    @Valid @NotNull @JsonProperty("fluss-source") FlussSourceProperties flussSource,
    @Valid @NotNull @JsonProperty("fluss-sink") FlussSinkProperties flussSink
) implements Serializable {}
```

In your main entrypoint:

```java
package com.company.analytics;

import com.company.analytics.config.AppConfig;
import io.github.sekelenao.flinkboot.core.api.Flinkboot;
import io.github.sekelenao.flinkboot.fluss.api.sink.FlussSinkFactory;
import io.github.sekelenao.flinkboot.fluss.api.source.FlussSourceFactory;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.data.RowData;
import org.apache.fluss.flink.sink.FlussSink;
import org.apache.fluss.flink.sink.serializer.RowDataSerializationSchema;
import org.apache.fluss.flink.source.FlussSource;
import org.apache.fluss.flink.source.deserializer.RowDataDeserializationSchema;

public class FlussPipelineJob {
    public static void main(String[] args) throws Exception {
        Flinkboot boot = Flinkboot.initialize(args);
        AppConfig config = boot.configuration(AppConfig.class);
        StreamExecutionEnvironment env = boot.executionEnvironment(config.job());

        // 1. Build Fluss Source
        RowDataDeserializationSchema deserializer = ...; // Your deserialization schema
        FlussSource<RowData> source = FlussSourceFactory.supplyFor(config.flussSource(), deserializer);

        // 2. Build Fluss Sink
        RowDataSerializationSchema serializer = ...; // Your serialization schema
        FlussSink<RowData> sink = FlussSinkFactory.supplyFor(config.flussSink(), serializer);

        // 3. Connect stream pipeline
        DataStream<RowData> stream = env.fromSource(
            source,
            WatermarkStrategy.noWatermarks(),
            config.flussSource().name()
        );

        stream.sinkTo(sink).name(config.flussSink().name());

        env.execute(config.job().name());
    }
}
```

---

## 5. Java 17+ and Apache Arrow JVM options

Apache Fluss utilizes Apache Arrow for off-heap buffer management. On Java 17 and later, add the following JVM argument to open `java.nio` to unnamed modules:

```bash
--add-opens=java.base/java.nio=ALL-UNNAMED
```

When running unit/integration tests with Maven Surefire:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <argLine>--add-opens=java.base/java.nio=ALL-UNNAMED</argLine>
    </configuration>
</plugin>
```
