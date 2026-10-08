---
title: Configuration serialization for operators
sidebar_label: Configuration serialization for operators
description: Load default classpath configurations in tests and assert Java serialization compliance for Flink operators.
---

# Configuration serialization for operators

In Apache Flink streaming topologies, user-defined functions and operators (`ProcessFunction`, `MapFunction`, sinks, etc.) are instantiated on the client or JobManager and serialized over the network to remote TaskManagers.

When operators require configuration values (such as thresholds, batch sizes, or connection options), passing non-serializable objects causes job submission to fail immediately with a fatal `java.io.NotSerializableException`.

A recommended practice is to load the application configuration in a unit test and assert its Java serialization compliance before shipping fields to operators.

---

## 1. Why assert configuration serialization?

Configuration classes mapped by Flinkboot often hold structured domain properties used across the streaming topology. Flink uses standard Java serialization (`ObjectOutputStream` / `ObjectInputStream`) to transfer operator instances across cluster nodes.

Testing configuration serialization guarantees that:
* The configuration class and all nested properties implement `java.io.Serializable`.
* Any piece of configuration passed as a constructor argument to an operator can be safely distributed across TaskManagers.
* Potential issues are caught early in the test suite rather than during deployment on the cluster.

---

## 2. Testing configuration serialization

Calling `Flinkboot.initialize()` with no arguments loads the default configuration from `src/test/resources/job-configuration.yaml` in the test classpath.

All configuration loading features remain available in tests: you can specify custom paths via `-flinkboot-configurations`, merge multiple configuration files (e.g. `classpath:base.yaml,classpath:override.yaml`), pass CLI overrides, or use environment placeholders.

Once initialized, verify that the configuration instance passes the serialization round-trip using `FlinkbootAssertions.assertThat(...).isSerializable()`:

```java
import io.github.sekelenao.flinkboot.core.api.Flinkboot;
import io.github.sekelenao.flinkboot.test.api.assertion.FlinkbootAssertions;
import org.junit.jupiter.api.Test;

class JobConfigurationTest {

    @Test
    void shouldBeSerializable() throws Exception {
        MyApplicationConfig config = Flinkboot.initialize()
            .configuration(MyApplicationConfig.class);

        FlinkbootAssertions.assertThat(config)
            .isSerializable();
    }
}
```

---

## 3. Passing configuration slices to operators

Instead of passing the entire global configuration object to every operator, extract only the necessary nested configuration records or sub-properties:

```java
import org.apache.flink.api.common.functions.MapFunction;
import java.util.Objects;

public class FilterFunction implements MapFunction<Event, Event> {

    private final FilterConfig config;

    public FilterFunction(FilterConfig config) {
        this.config = Objects.requireNonNull(config);
    }

    @Override
    public Event map(Event value) {
        return value.score() >= config.threshold() ? value : null;
    }
}
```

Because `JobConfigurationTest` validates the complete configuration object graph recursively, you can safely pass `config.filter()` or other configuration sections directly into operator constructors without risking runtime serialization errors.
