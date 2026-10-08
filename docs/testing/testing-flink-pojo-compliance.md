---
title: Testing Flink POJO compliance
sidebar_label: Testing Flink POJO compliance
description: Assert Apache Flink POJO compliance recursively in tests to prevent Kryo fallback using FlinkbootAssertions.
---

# Testing Flink POJO compliance

Flinkboot provides test assertions to ensure your data classes strictly comply with Apache Flink's POJO serialization requirements and prevent runtime Kryo fallback.

---

## 1. Maven dependency

Add `flinkboot-test` to your `pom.xml`:

```xml
<dependencies>
    <dependency>
        <groupId>io.github.sekelenao</groupId>
        <artifactId>flinkboot-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## 2. Flink POJO requirements

Apache Flink uses an optimized serializer (`PojoSerializer`) for data serialization within pipelines. When Flink recognizes a class as a valid POJO, it can perform direct field access and serialize elements with minimal overhead.

If your class is not recognized as a valid POJO:
* Flink falls back to Kryo serialization, which is slower, less space-efficient, and risky for state schema evolution.
* Flink will not be able to use key-selection on nested fields (e.g. `keyBy("fieldName")`).

A class must satisfy the following criteria:
1. The class must be **public** and standalone (or a `public static` nested class).
2. It must have a **public zero-argument constructor**.
3. All fields must be either **public** (non-final) or have **public getter and setter** methods following JavaBean conventions.
4. **No Kryo fallback fields**: No fields (or nested fields) may resolve to `GenericTypeInfo`. `FlinkbootAssertions.assertThat(MyClass.class).isPojo()` inspects fields recursively to guarantee pure native Flink serialization.

---

## 3. Usage in JUnit 5

Use `FlinkbootAssertions.assertThat(Class<?> type).isPojo()` to verify your model classes:

### Example Data Class

```java
public class UserActivity {
    private String userId;
    private long timestamp;

    // Public zero-argument constructor (Required)
    public UserActivity() {}

    public UserActivity(String userId, long timestamp) {
        this.userId = userId;
        this.timestamp = timestamp;
    }

    // Public Getters and Setters (Required)
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
```

### Writing the Test

Create a test class in your `src/test/java` directory:

```java
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static io.github.sekelenao.flinkboot.test.api.assertion.FlinkbootAssertions.assertThat;

class UserActivityTest {

    @Test
    @DisplayName("UserActivity should comply with Flink POJO serialization rules")
    void testPojoCompliance() {
        assertThat(UserActivity.class).isPojo();
    }
}
```

If the class violates any of Flink's requirements or contains fields falling back to Kryo serialization, the assertion fails immediately with a descriptive error message indicating the exact path of the invalid field (e.g., `UserActivity.timestamp`).

---

## 4. Asserting generic types

A `Class` literal erases generic parameters, so `assertThat(Map.class)` cannot tell Flink which key and
value types are involved. Use a `TypeHint` to keep them, exactly as you would when hinting a Flink operator:

```java
import org.apache.flink.api.common.typeinfo.TypeHint;

import static io.github.sekelenao.flinkboot.test.api.assertion.FlinkbootAssertions.assertThat;

class UserActivityTest {

    @Test
    @DisplayName("Activities grouped by user should comply with Flink POJO serialization rules")
    void testGenericPojoCompliance() {
        assertThat(new TypeHint<Map<String, List<UserActivity>>>() {}).isPojo();
    }
}
```

Every nested type is validated recursively, so the assertion fails if the key type, the value type, or any
field of `UserActivity` falls back to Kryo.

---

## 5. Asserting existing `TypeInformation`

When a type description already exists (produced by a custom `TypeInfoFactory`, by
`TypeInformation.of(...)`, or returned by a Flink operator), pass it directly:

```java
import org.apache.flink.api.common.typeinfo.TypeInformation;

import static io.github.sekelenao.flinkboot.test.api.assertion.FlinkbootAssertions.assertThat;

class UserActivityTypeInfoTest {

    @Test
    @DisplayName("Custom type information should comply with Flink POJO serialization rules")
    void testTypeInformationCompliance() {
        TypeInformation<UserActivity> typeInfo = TypeInformation.of(UserActivity.class);
        assertThat(typeInfo).isPojo();
    }
}
```

This is the most direct way to check that a custom factory really produces a native Flink serializer
instead of a Kryo fallback.

