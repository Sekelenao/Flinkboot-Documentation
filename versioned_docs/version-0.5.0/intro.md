---
sidebar_position: 1
slug: /
title: Overview
description: Declarative configuration, fail-fast bootstrapping, and native zero-Kryo serialization for Apache Flink applications.
keywords: [apache flink, flinkboot, flink configuration, spring boot flink, streaming, rocksdb, flink kafka connector, zero kryo]
image: img/flinkboot-social-card.png
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Overview

<div className="hero-punchline">
Building Apache Flink applications should feel as clean, safe, and productive as writing modern Spring Boot backend services. Once you experience declarative bootstrapping, fail-fast configuration, and zero-Kryo guarantees, you will never write manual Flink boilerplate again.
</div>

---

## 1. Type-safe configuration DTOs

Flinkboot ships with pre-built, production-tested DTOs for the execution environment (`JobProperties`) and official connectors (`KafkaSourceProperties`, `FlussSourceProperties`). Simply assemble them with your own domain records or POJOs with full Jakarta Bean Validation (`@NotNull`, `@Valid`), with no manual Jackson parsing required.

<Tabs>
  <TabItem value="flinkboot" label="With Flinkboot" default>

```java
// Composed application configuration record
public record AppConfig(
    // Built-in Flinkboot DTO: covers RocksDB, restart strategies, metrics, checkpoints
    @Valid @NotNull @JsonProperty("job") JobProperties job,

    // Built-in Flinkboot DTO: covers brokers, topics, offset strategies, vendor escape-hatch
    @Valid @NotNull @JsonProperty("kafka-source") KafkaSourceProperties kafkaSource,

    // Your custom business domain settings (records or POJOs with Bean Validation)
    @Valid @NotNull @JsonProperty("alerting") AlertingProperties alerting
) {}
```

  </TabItem>
  <TabItem value="standard" label="Standard Flink">

```java
// Untyped, error-prone manual Jackson tree traversal
ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
JsonNode root = mapper.readTree(new File("application.yaml"));

// Cryptic NullPointerExceptions at runtime if a single key is missing or misspelled
String jobName = root.path("job").path("name").asText();
int parallelism = root.path("job").path("parallelism").asInt(1);
long checkpointInterval = root.path("job").path("checkpointing").path("interval").asLong();

String brokers = root.path("kafka-source").path("bootstrap-servers").asText();
String topic = root.path("kafka-source").path("topics").get(0).asText();
String groupId = root.path("kafka-source").path("group-id").asText();

// Hand-rolled parsing and fragile validation for business fields
double threshold = root.path("alerting").path("threshold-amount").asDouble();
String email = root.path("alerting").path("notification-email").asText();
```

  </TabItem>
</Tabs>

---

## 2. Declarative YAML schema

Your configuration files map 1:1 to your type-safe DTOs. Instead of scattering parameters across ad-hoc CLI arguments, Java System Properties, and flat properties files, Flinkboot organizes everything into a hierarchical YAML contract supporting profile activation, parameter placeholders, and environment variable substitution.

<Tabs>
  <TabItem value="flinkboot" label="With Flinkboot" default>

```yaml
# application.yaml - Maps 1:1 to your AppConfig DTO
job:
  name: "order-fraud-detector"
  parallelism: 8
  checkpointing:
    interval: 60000
    timeout: 120000
  state-backend:
    type: "rocksdb"
    incremental: true

kafka-source:
  name: "fraud-orders-source"
  bootstrap-servers:
    - "kafka-1.internal.net:9092"
    - "kafka-2.internal.net:9092"
  topics:
    - "orders-v1"
  group-id: "fraud-detector-service"
  starting-offsets:
    strategy: LATEST
  # Universal escape hatch for vendor client tuning & SSL credentials
  properties:
    security.protocol: "SSL"
    ssl.truststore.location: "/var/private/ssl/kafka.truststore.jks"
    # Auto-templated at runtime from host or container environment variables
    ssl.truststore.password: "${KAFKA_TRUSTSTORE_PASSWORD}"
    fetch.max.wait.ms: "500"

alerting:
  threshold-amount: 5000.00
  notification-email: "fraud-alerts@company.com"
```

  </TabItem>
  <TabItem value="standard" label="Standard Flink">

```text
# Hardcoded, flat properties or repetitive CLI flags
--job.name order-fraud-detector \
--parallelism 8 \
--checkpoint.interval 60000 \
--rocksdb.incremental true \
--kafka.bootstrap.servers kafka-1.internal.net:9092,kafka-2.internal.net:9092 \
--kafka.topics orders-v1 \
--kafka.group.id fraud-detector-service \
--kafka.properties.security.protocol SSL \
--kafka.properties.ssl.truststore.location /var/private/ssl/kafka.truststore.jks \
--kafka.properties.ssl.truststore.password ${KAFKA_TRUSTSTORE_PASSWORD} \
--kafka.properties.fetch.max.wait.ms 500 \
--alerting.threshold-amount 5000.00 \
--alerting.notification-email fraud-alerts@company.com

# Fragile CLI parsing, lacks hierarchy, and offers zero validation
# when a parameter is misspelled or missing at runtime.
```

  </TabItem>
</Tabs>

---

## 3. Fail-fast application bootstrap

Instead of handwriting hundreds of lines of imperative setup code, Flinkboot bootstraps your entire application in a single statement. Even if you've never configured RocksDB state backends, unaligned checkpoints, latency metrics, or exponential backoff restart strategies before, they are already built-in, pre-tuned for production, and ready to be declared in your YAML with zero plumbing code required.

<Tabs>
  <TabItem value="flinkboot" label="With Flinkboot" default>

```java
public static void main(String[] args) throws Exception {
    // 1. Initialize Flinkboot with CLI arguments
    Flinkboot boot = Flinkboot.initialize(args);

    // 2. Load and validate YAML configurations fail-fast into your type-safe record
    AppConfig config = boot.configuration(AppConfig.class);

    // 3. Pre-configured environment: RocksDB, checkpoints, restarts from YAML in one call
    StreamExecutionEnvironment env = boot.executionEnvironment(config.job());

    // 4. Run pipeline
    env.execute(config.job().name());
}
```

  </TabItem>
  <TabItem value="standard" label="Standard Flink">

```java
public static void main(String[] args) throws Exception {
    ParameterTool params = ParameterTool.fromArgs(args);
    StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

    // Imperative wiring scattered across the main method
    env.setParallelism(params.getInt("parallelism", 1));
    env.enableCheckpointing(params.getLong("checkpoint.interval", 60000L));
    env.getCheckpointConfig().setCheckpointTimeout(params.getLong("checkpoint.timeout", 120000L));
    env.setStateBackend(new EmbeddedRocksDBStateBackend(true));
    env.setRestartStrategy(RestartStrategies.fixedDelayRestart(3, Time.seconds(10)));

    // Misconfigurations and type mismatches crash only after job submission
    env.execute("LegacyJob");
}
```

  </TabItem>
</Tabs>

---

## 4. Turnkey production connectors

Instantiating sources and sinks in vanilla Flink requires verbose builders, duplicate properties, and manual schema binding. Flinkboot connector factories create fully tuned sources and sinks directly from your validated configuration objects with native serializer resolution.

<Tabs>
  <TabItem value="flinkboot" label="With Flinkboot" default>

```java
// Instantiates a fully configured, production-ready KafkaSource in one line
KafkaSource<OrderEvent> source = KafkaSourceFactory.supplyFor(
    config.kafkaSource(), 
    deserializationSchema
);
```

  </TabItem>
  <TabItem value="standard" label="Standard Flink">

```java
// Repetitive builder with manual string mappings and custom deserializers
KafkaSource<OrderEvent> source = KafkaSource.<OrderEvent>builder()
    .setBootstrapServers(brokers)
    .setTopics(topic)
    .setGroupId(groupId)
    .setStartingOffsets(OffsetsInitializer.latest())
    .setValueOnlyDeserializer(new OrderEventDeserializationSchema())
    .setProperty("enable.auto.commit", "false")
    .build();
```

  </TabItem>
</Tabs>

---

## 5. Native collection & JDK serialization

In vanilla Flink, collections like `List<String>` inside a POJO silently fall back to Kryo serialization because Flink's type extractor cannot resolve generic parameters. Flinkboot provides turnkey `TypeInfoFactory` classes to guarantee high-throughput, native Flink serializers.

<Tabs>
  <TabItem value="flinkboot" label="With Flinkboot" default>

```java
public class OrderEvent {
    public String id;

    // Instructs Flink to resolve List<E> natively as Types.LIST(Types.STRING)
    @TypeInfo(ListTypeInfoFactory.class)
    public List<String> tags;
}
```

  </TabItem>
  <TabItem value="standard" label="Standard Flink">

```java
public class OrderEvent {
    public String id;
    public List<String> tags; // Flink cannot extract generic parameter E!
}

// In standard Flink, TypeInformation.of(OrderEvent.class) silently assigns
// GenericTypeInfo (Kryo) to the tags field, degrading streaming throughput
// by 3x to 10x and breaking savepoint state schema evolution.
```

  </TabItem>
</Tabs>

---

## 6. Build-time POJO compliance auditing

Apache Flink relies on its high-performance `PojoSerializer` to achieve maximum streaming throughput. If an event class lacks a default constructor, contains an unmapped collection, or misses getters/setters, Flink silently falls back to slow Kryo serialization without failing. Flinkboot provides build-time assertions to guarantee POJO compliance in your unit tests.

<Tabs>
  <TabItem value="flinkboot" label="With Flinkboot" default>

```java
@Test
void verifyOrderEventSerialization() {
    // Build-time guarantee: recursively audits all fields, getters, and constructors
    // Fails the test immediately if any field falls back to Kryo
    FlinkbootAssertions.assertThat(OrderEvent.class)
        .isPojo();
}
```

  </TabItem>
  <TabItem value="standard" label="Standard Flink">

```java
// No build-time guarantee in standard Flink!
// Developers either discover severe performance degradation in production,
// or attempt brittle runtime TypeInformation inspection:
TypeInformation<OrderEvent> ti = TypeInformation.of(OrderEvent.class);

// Returns GenericTypeInfo silently in production when POJO rules are violated,
// slowing down streaming pipelines by 3x to 10x without any explicit error.
```

  </TabItem>
</Tabs>

