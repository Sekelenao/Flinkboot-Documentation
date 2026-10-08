---
title: Collecting sink for integration testing
sidebar_label: Collecting sink for integration testing
description: Capture and assert Apache Flink stream outputs in integration tests using CollectingSink.
---

# Collecting sink for integration testing

Testing streaming topologies often requires asserting on the actual data elements produced by a pipeline. Flinkboot provides the thread-safe `CollectingSink<T>` utility in `flinkboot-test` to collect stream elements during integration tests.

---

## 1. Overview

`CollectingSink<T>` is an in-memory, thread-safe Flink sink designed specifically for testing:
* `new CollectingSink<T>()`: Creates a new sink instance.
* `sink.elements()`: Returns an immutable snapshot list of all collected elements.
* `sink.clear()`: Empties the internal buffer for subsequent test runs.
* `AutoCloseable`: Implements `AutoCloseable` for automatic buffer cleanup via `try-with-resources`.

The sink safely collects elements emitted across parallel sink subtasks during local Flink MiniCluster test execution.

---

## 2. Usage in integration tests

Attach `CollectingSink` to your stream with `.sinkTo(sink)`, execute the pipeline, and assert on the collected elements:

```java
import io.github.sekelenao.flinkboot.test.api.sink.CollectingSink;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StreamPipelineTest {

    @Test
    void shouldProcessAndCollectEvents() throws Exception {
        var env = StreamExecutionEnvironment.getExecutionEnvironment();

        try (var sink = new CollectingSink<String>()) {
            env.fromData("event-1", "event-2")
               .sinkTo(sink)
               .setParallelism(2);

            env.execute();

            List<String> elements = sink.elements();

            assertAll(
                () -> assertEquals(2, elements.size()),
                () -> assertTrue(elements.containsAll(List.of("event-1", "event-2")))
            );
        }
    }
}
```

Because Flink does not guarantee global ordering across parallel subtasks, assertions should verify element presence and count rather than relying on strict index ordering.

---

## 3. Buffer management & snapshots

* **Immutable snapshots**: Calling `sink.elements()` creates an immutable list copy. Further emissions or buffer clear operations do not mutate previously obtained snapshots.
* **Automatic resource cleanup**: Using `try-with-resources` automatically reclaims the in-memory sink storage once the test block completes.
* **Manual reuse with `clear()`**: If executing multiple pipelines sequentially in the same test method, call `sink.clear()` to reset the buffer between runs.
