---
sidebar_position: 1
slug: /
title: Overview
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Overview

<div className="hero-punchline">
Building Apache Flink applications should feel as clean, safe, and productive as writing modern Spring Boot backend services. Once you experience declarative bootstrapping, fail-fast configuration, and zero-Kryo guarantees, you will never write manual Flink boilerplate again.
</div>

---

<details className="overview-section">
<summary>1. Type-safe configuration DTOs</summary>
<div className="overview-body">

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

</div>
</details>

<details className="overview-section">
<summary>2. Declarative YAML schema</summary>
<div className="overview-body">

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

</div>
</details>

<details className="overview-section">
<summary>3. Fail-fast application bootstrap</summary>
<div className="overview-body">

Instead of handwriting hundreds of lines of imperative setup code, Flinkboot bootstraps your entire application in a single statement. Even if you've never configured RocksDB state backends, unaligned checkpoints, latency metrics, or exponential backoff restart strategies before, they are already built-in, pre-tuned for production, and ready to be declared in your YAML with zero plumbing code required.

<Tabs>
  <TabItem value="flinkboot" label="With Flinkboot" default>

```java
public static void main(String[] args) throws Exception {
    // 1. One-line bootstrap: loads YAML, resolves env vars, validates constraints fail-fast
    AppConfig config = Flinkboot.initialize(AppConfig.class, args);

    // 2. Production-ready out of the box: applies RocksDB, checkpointing, latency tracking,
    // and restart strategies directly from your YAML without writing a single line of setup code
    StreamExecutionEnvironment env = ExecutionEnvironmentFactory.create(config.job());

    // 3. Run pipeline
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

</div>
</details>

<details className="overview-section">
<summary>4. Turnkey production connectors</summary>
<div className="overview-body">

Instantiating sources and sinks in vanilla Flink requires verbose builders, duplicate properties, and manual schema binding. Flinkboot connector factories create fully tuned sources and sinks directly from your validated configuration objects with native serializer resolution.

<Tabs>
  <TabItem value="flinkboot" label="With Flinkboot" default>

```java
// Instantiates a fully configured, production-ready KafkaSource in one line
KafkaSource<OrderEvent> source = KafkaSourceFactory.create(
    config.kafkaSource(), 
    OrderEvent.class
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

</div>
</details>

<details className="overview-section">
<summary>5. Native collection & JDK serialization</summary>
<div className="overview-body">

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

</div>
</details>

<details className="overview-section">
<summary>6. Build-time POJO compliance auditing</summary>
<div className="overview-body">

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

</div>
</details>

<details className="overview-section">
<summary>7. Java serialization compliance assertion</summary>
<div className="overview-body">

Flink operators and user-defined functions (`ProcessFunction`, `MapFunction`, `KeySelector`) are serialized via standard Java serialization and shipped over the network to remote TaskManagers. An unintentionally captured non-serializable field (logger, open connection, outer class reference) crashes your job at submission. Flinkboot lets you verify full serialization round-trips in unit tests.

<Tabs>
  <TabItem value="flinkboot" label="With Flinkboot" default>

```java
@Test
void verifyFunctionIsSerializable() {
    var fraudEvaluator = new OrderFraudEvaluator(config.alerting());

    // Performs an in-memory serialization round-trip:
    // Fails immediately if any captured field or closure is not serializable
    FlinkbootAssertions.assertThat(fraudEvaluator)
        .isSerializable();
}
```

  </TabItem>
  <TabItem value="standard" label="Standard Flink">

```java
// In standard Flink, non-serializable fields are only caught at runtime
// when submitting the job graph to the cluster:
// java.io.NotSerializableException: org.slf4j.Logger
// or developers write custom ByteArrayOutputStream round-trip boilerplate:
try (var baos = new ByteArrayOutputStream();
     var oos = new ObjectOutputStream(baos)) {
    oos.writeObject(fraudEvaluator);
} // Cumbersome and rarely written for every pipeline operator
```

  </TabItem>
</Tabs>

</div>
</details>

<details className="overview-section">
<summary>8. Deterministic in-memory stream testing</summary>
<div className="overview-body">

For isolated operator logic (state, timers, watermarks), Flink's test harnesses (`KeyedOneInputStreamOperatorTestHarness`, etc.) remain the fastest choice without spinning up a cluster. However, validating complete multi-operator DAG wiring, key partitioning, and end-to-end integration requires running an in-memory MiniCluster (`env.execute()`). Because mini-cluster executions spawn threads and consume JVM resources, tests frequently suffered from flaky static lists or thread leaks. Flinkboot provides `CollectingSink`, an auto-closeable in-memory sink that safely collects records across parallel subtasks during pipeline execution with leak-free `try-with-resources` cleanup.

<Tabs>
  <TabItem value="flinkboot" label="With Flinkboot" default>

```java
@Test
void shouldProcessOrdersEndToEnd() throws Exception {
    StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

    // AutoCloseable in-memory sink prevents thread leaks and test pollution
    try (var sink = new CollectingSink<OrderEvent>()) {
        orderPipeline.sinkTo(sink).setParallelism(2);
        env.execute();

        var elements = sink.elements();
        assertAll(
            () -> assertEquals(2, elements.size()),
            () -> assertEquals("order-1", elements.get(0).id),
            () -> assertEquals("order-2", elements.get(1).id)
        );
    }
}
```

  </TabItem>
  <TabItem value="standard" label="Standard Flink">

```java
// Requires writing custom TestSink implementations with static synchronized lists:
public static class CustomTestSink implements SinkFunction<OrderEvent> {
    public static final List<OrderEvent> values = Collections.synchronizedList(new ArrayList<>());

    @Override
    public void invoke(OrderEvent value, Context context) {
        values.add(value); // Prone to concurrency race conditions and test pollution across runs
    }
}

// In test method:
CustomTestSink.values.clear(); // Fragile manual cleanup between test executions
pipeline.addSink(new CustomTestSink());
env.execute();
assertEquals(2, CustomTestSink.values.size());
```

  </TabItem>
</Tabs>

</div>
</details>
