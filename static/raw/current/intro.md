---
sidebar_position: 1
slug: /
title: Overview
---

# Flinkboot

> **The Bootstrapping & Reliability Framework for Apache Flink.**  
> Fail fast on configuration, serialize natively without Kryo, and bootstrap stream pipelines with zero boilerplate.

[![Java](https://img.shields.io/badge/Java_11%2B-%23ED8B00.svg?logo=openjdk&logoColor=white)](https://docs.oracle.com/en/java/javase/11/docs/api/index.html)
[![Flink](https://img.shields.io/badge/Flink_1.20-%23E6526F.svg?logo=apacheflink&logoColor=white)](https://flink.apache.org/)
[![Maven Central](https://img.shields.io/maven-central/v/io.github.sekelenao/flinkboot-core?label=Maven%20central&logo=apachemaven&logoColor=white&color=C71A36&labelColor=C71A36)](https://central.sonatype.com/artifact/io.github.sekelenao/flinkboot-core)

---

## What is Flinkboot?

**Flinkboot** is a comprehensive, production-grade development and reliability framework designed to bootstrap, configure, and secure Apache Flink applications with **zero boilerplate**.

In standard Flink deployments, misconfigurations, missing parameters, state backend errors, and silent fallbacks to slow Kryo serialization often go unnoticed until runtime, leading to costly cluster failures or degraded pipeline throughput. Flinkboot eliminates these risks before your code ever reaches the TaskManagers.

### 🔴 Before

```java
public static void main(String[] args) throws Exception {
    // 1. Manual YAML parsing with Jackson (untyped tree navigation, zero validation, fails on first missing key)
    ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
    JsonNode yaml = mapper.readTree(new File("job-configuration.yaml"));
    String brokers = yaml.get("kafka").get("brokers").asText();
    String topic = yaml.get("kafka").get("topic").asText();
    long checkpointInterval = yaml.get("checkpoint").get("interval").asLong();

    // 2. Imperative environment setup (hardcoded: adding Web UI, latency tracking, or unaligned checkpoints requires code change & redeployment)
    StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
    env.enableCheckpointing(checkpointInterval);
    env.getCheckpointConfig().setCheckpointTimeout(60000L);
    env.setStateBackend(new EmbeddedRocksDBStateBackend(true));
    env.setRestartStrategy(RestartStrategies.fixedDelayRestart(3, Time.seconds(10)));

    // 3. Rigid manual connector builder (unverified OrderEvent could silently fall back to slow Kryo)
    KafkaSource<OrderEvent> source = KafkaSource.<OrderEvent>builder()
            .setBootstrapServers(brokers)
            .setTopics(topic)
            .setGroupId("order-service")
            .setStartingOffsets(OffsetsInitializer.latest())
            .setDeserializer(new OrderEventDeserializationSchema())
            .build();

    env.fromSource(source, WatermarkStrategy.noWatermarks(), "kafka-source").print();
    env.execute("LegacyJob");
}
```

### 🟢 With Flinkboot

```java
// 1. Build-time guarantee in unit tests: fails build if OrderEvent could fall back to slow Kryo
@Test
void verifyPojoCompliance() {
    FlinkbootAssertions.assertThat(OrderEvent.class).isPojo();
}

// 2. User-defined composed configuration (record or class): assemble independent blocks like Legos
public record AppConfiguration(
    // 100% validated fail-fast & covers every Flink environment setting (RocksDB, restart, checkpoints...)
    @Valid @NotNull @JsonProperty("job") JobProperties job,

    // 100% validated fail-fast & exhaustively covers the connector options with raw escape hatch
    @Valid @NotNull @JsonProperty("kafka-source") KafkaSourceProperties kafkaSource
) {}

// 3. One-line bootstrap: loads YAML, resolves ${ENV} variables, validates Jakarta Bean Constraints fail-fast
public static void main(String[] args) throws Exception {
    AppConfiguration config = Flinkboot.initialize(AppConfiguration.class, args);

    // Instant zero-boilerplate environment creation with all RocksDB, metrics & restart rules applied
    StreamExecutionEnvironment env = ExecutionEnvironmentFactory.create(config.job());

    // Instant connector instantiation from strongly typed, fully validated configuration
    KafkaSource<OrderEvent> source = KafkaSourceFactory.create(config.kafkaSource(), OrderEvent.class);

    env.fromSource(source, WatermarkStrategy.noWatermarks(), "kafka-source").print();
    env.execute(config.job().name());
}
```

---

## Key Pillars

1. **Fail-Fast Configuration**: Merges multiple YAML files, CLI arguments, and environment variables with strict Jackson & Jakarta Bean Validation before Flink starts.
2. **Zero Kryo Fallback**: Built-in test assertions recursively audit POJOs to guarantee high-performance Flink serializers are used.
3. **Turnkey Connectors**: Type-safe factories for Apache Kafka, Apache Fluss, and more with standardized YAML schemas and escape hatches for vendor tuning.
4. **Testing Productivity**: `CollectingSink` and test helpers let you assert stream outputs in JUnit 5 unit and integration tests without mocks or flakiness.

---

## Documentation Index

Explore the step-by-step guides by domain:

- **[Project Setup & Packaging](./setup/bom-managed-dependencies.md)**: Dependency management with Flinkboot BOM and shading best practices.
- **[Configuration & Environment](./configuration/load-configurations.md)**: Declarative YAML loading, environment variables, and execution environment creation.
- **[Apache Kafka Connector](./kafka/configure-kafka-source.md)**: Sources and sinks with delivery guarantees and offset strategies.
- **[Apache Fluss Connector](./fluss/configure-fluss-source.md)**: Lakehouse streaming sources and sinks with snapshot strategies.
- **[Serialization](./serialization/serialize-jdk-types.md)**: Native serialization for JDK types and POJOs.
- **[Testing](./testing/assert-pojo-compliance.md)**: POJO auditing, serialization verification, and stream collection in tests.
- **[Compatibility Matrix](./compatibility.md)**: Supported Apache Flink and Java runtime versions.
