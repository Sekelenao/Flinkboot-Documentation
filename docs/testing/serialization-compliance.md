---
title: Serialization compliance
sidebar_label: Serialization compliance
description: Assert standard Java serialization compliance on user-defined objects using FlinkbootAssertions.
---

# Serialization compliance

In Apache Flink streaming applications, user-defined functions and helper objects are distributed across remote TaskManagers using standard Java serialization.

If any captured object or nested field does not implement `java.io.Serializable`, Flink fails at submission or initialization with a fatal `java.io.NotSerializableException`.

Flinkboot provides testing assertions in `flinkboot-test` to verify that your classes and object graphs comply with standard Java serialization requirements.

---

## 1. How `isSerializable()` works

The assertion `FlinkbootAssertions.assertThat(actual).isSerializable()` performs a complete in-memory serialization round-trip:

1. **Serialization**: Writes the target object into a byte buffer using `java.io.ObjectOutputStream`.
2. **Deserialization**: Reconstructs the object from the byte buffer using `java.io.ObjectInputStream`.

This verifies that:
* The target class implements `java.io.Serializable`.
* Every nested object, collection element, and referenced type in the object graph is serializable.
* Custom `writeObject` or `readObject` hooks execute without errors.

If any element fails serialization, the assertion fails immediately with a descriptive error detailing the exact offending field.

---

## 2. Usage in JUnit 5

Pass any object instance directly to `assertThat(actual).isSerializable()`:

```java
import org.junit.jupiter.api.Test;

import static io.github.sekelenao.flinkboot.test.api.assertion.FlinkbootAssertions.assertThat;

class SerializationComplianceTest {

    @Test
    void shouldBeSerializable() {
        assertThat(payload).isSerializable();
    }
}
```
