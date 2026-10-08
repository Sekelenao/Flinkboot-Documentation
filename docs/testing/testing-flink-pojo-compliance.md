---
title: Testing Flink POJO compliance
sidebar_label: Testing Flink POJO compliance
description: Assert Apache Flink POJO compliance recursively in tests to prevent Kryo fallback using FlinkbootAssertions.
---

# Testing Flink POJO compliance

Flinkboot provides test assertions to ensure your data classes strictly comply with Apache Flink's POJO serialization requirements and prevent runtime Kryo fallback.

---

## 1. Flink POJO requirements

Apache Flink uses an optimized serializer (`PojoSerializer`) for state and stream data exchange. When Flink recognizes a class as a valid POJO, it can perform direct field access and serialize elements with minimal overhead.

If a class does not satisfy Flink POJO criteria:
* Flink falls back to Kryo serialization, which is slower, less space-efficient, and risky for state schema evolution.
* Keyed operations on nested fields (e.g. `keyBy("fieldName")`) will fail.

A class must satisfy the following criteria:
1. The class must be **public** and standalone (or a `public static` nested class).
2. It must have a **public zero-argument constructor**.
3. All fields must be either **public** (non-final) or have **public getter and setter** methods following JavaBean conventions. Both styles are fully supported.
4. **No Kryo fallback fields**: No field or nested field may resolve to `GenericTypeInfo`. `FlinkbootAssertions.assertThat(MyClass.class).isPojo()` inspects fields recursively to guarantee pure native Flink serialization.

---

## 2. Usage in JUnit 5

Use `FlinkbootAssertions.assertThat(Class<?> type).isPojo()` to verify your model classes:

```java
import org.junit.jupiter.api.Test;

import static io.github.sekelenao.flinkboot.test.api.assertion.FlinkbootAssertions.assertThat;

class ModelComplianceTest {

    @Test
    void shouldComplyWithPojoRules() {
        assertThat(MyModel.class).isPojo();
    }
}
```

If the class violates any of Flink's requirements or contains fields falling back to Kryo serialization, the assertion fails immediately with a descriptive error message indicating the exact path of the invalid field.

---

## 3. Asserting generic types

A `Class` literal erases generic parameters, so `assertThat(Map.class)` cannot tell Flink which key and
value types are involved. Use a `TypeHint` to retain them:

```java
import org.apache.flink.api.common.typeinfo.TypeHint;
import java.util.List;
import java.util.Map;

import static io.github.sekelenao.flinkboot.test.api.assertion.FlinkbootAssertions.assertThat;

class ModelComplianceTest {

    @Test
    void shouldComplyWithGenericTypes() {
        assertThat(new TypeHint<Map<String, List<MyModel>>>() {}).isPojo();
    }
}
```

Every nested type is validated recursively: the assertion fails if the key type, the value type, or any
nested field falls back to Kryo.

---

## 4. Asserting existing `TypeInformation`

When a type description already exists (produced by a custom `TypeInfoFactory`, by
`TypeInformation.of(...)`, or returned by an operator), pass it directly:

```java
import org.apache.flink.api.common.typeinfo.TypeInformation;

import static io.github.sekelenao.flinkboot.test.api.assertion.FlinkbootAssertions.assertThat;

class ModelComplianceTest {

    @Test
    void shouldComplyWithTypeInformation() {
        TypeInformation<MyModel> typeInfo = TypeInformation.of(MyModel.class);
        assertThat(typeInfo).isPojo();
    }
}
```

This verifies directly that a custom factory produces a native Flink serializer instead of a Kryo fallback.

