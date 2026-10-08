---
title: Serializing JDK types
sidebar_label: Serializing JDK types
description: Native Flink serialization for LocalDateTime, LocalDate, Duration, and collections using Flinkboot TypeInfoFactory.
---

# Serializing JDK types

In Apache Flink, standard JDK date-time types and collections default to Kryo serialization, which is slower, less space-efficient, and risky for state schema evolution.

Flinkboot provides built-in, optimized `TypeInfoFactory` classes to enable native Flink serialization for these types.

---

## 1. Available factories

| Field Type                | Flinkboot Factory Class        | Serializer / Underlying Type        |
|:--------------------------|:-------------------------------|:------------------------------------|
| `java.time.LocalDateTime` | `LocalDateTimeTypeInfoFactory` | `Types.LOCAL_DATE_TIME`             |
| `java.time.LocalDate`     | `LocalDateTypeInfoFactory`     | `Types.LOCAL_DATE`                  |
| `java.time.LocalTime`     | `LocalTimeTypeInfoFactory`     | `Types.LOCAL_TIME`                  |
| `java.time.Duration`      | `DurationTypeInfoFactory`      | Custom 12-byte `DurationSerializer` |
| `java.util.List<E>`       | `ListTypeInfoFactory`          | `Types.LIST(elementType)`           |
| `java.util.Map<K, V>`     | `MapTypeInfoFactory`           | `Types.MAP(keyType, valueType)`     |

---

## 2. Usage in POJO classes

Annotate your POJO fields with Flink's `@TypeInfo` annotation:

```java
import io.github.sekelenao.flinkboot.core.api.typing.collection.ListTypeInfoFactory;
import io.github.sekelenao.flinkboot.core.api.typing.collection.MapTypeInfoFactory;
import io.github.sekelenao.flinkboot.core.api.typing.time.DurationTypeInfoFactory;
import io.github.sekelenao.flinkboot.core.api.typing.time.LocalDateTypeInfoFactory;
import io.github.sekelenao.flinkboot.core.api.typing.time.LocalDateTimeTypeInfoFactory;
import io.github.sekelenao.flinkboot.core.api.typing.time.LocalTimeTypeInfoFactory;
import org.apache.flink.api.common.typeinfo.TypeInfo;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

public class Example {

    @TypeInfo(LocalDateTimeTypeInfoFactory.class)
    public LocalDateTime eventTime;

    @TypeInfo(LocalDateTypeInfoFactory.class)
    public LocalDate eventDate;

    @TypeInfo(LocalTimeTypeInfoFactory.class)
    public LocalTime eventClock;

    @TypeInfo(DurationTypeInfoFactory.class)
    public Duration duration;

    @TypeInfo(ListTypeInfoFactory.class)
    public List<String> tags;

    @TypeInfo(MapTypeInfoFactory.class)
    public Map<String, Integer> metrics;
}
```

---

## 3. Edge cases and nuances

### A. Concrete implementations for `List` and `Map`
Flink's built-in `ListSerializer` and `MapSerializer` instantiate `java.util.ArrayList` and `java.util.HashMap` upon deserialization.
* If your POJO uses `java.util.List` or `java.util.Map`, it will be deserialized as an `ArrayList` or `HashMap`.
* If your application relies on specific implementations (such as `java.util.TreeMap` for sorted keys or immutable collections), you must use a custom serializer.

### B. Nested JDK types inside collections
In Java and Flink, the `@TypeInfo` annotation cannot be placed directly on generic type arguments (e.g. `List<@TypeInfo(...) Duration>`).
To serialize `List<Duration>` natively without Kryo, create a dedicated container factory:
```java
public class DurationListTypeInfoFactory extends TypeInfoFactory<List<Duration>> {
    @Override
    public TypeInformation<List<Duration>> createTypeInfo(Type t, Map<String, TypeInformation<?>> genericParameters) {
        return Types.LIST(DurationTypeInfo.INSTANCE);
    }
}
```
And annotate the field:
```java
@TypeInfo(DurationListTypeInfoFactory.class)
public List<Duration> durations;
```

### C. Custom domain classes in collections
If you have a collection of custom DTOs (e.g. `List<MyItem>`), annotate `MyItem` at the class level:
```java
@TypeInfo(MyItemTypeInfoFactory.class)
public class MyItem { ... }
```
Flink's `TypeExtractor` will automatically find the class-level annotation when resolving `List<MyItem>`.

### D. Nullability
Flink's native serializers for collections and time types properly support `null` values within POJO fields.

### E. Generic bounds vs wildcards in collections
* **Bounded Class Generics (`Container<T extends ParentDto>`)**: When a concrete class argument is provided (e.g. `Container<ChildDto>`), Flink's `TypeExtractor` resolves `ChildDto` natively as a POJO.
* **Wildcards in Collections (`List<? extends ParentDto>`)**: Wildcard type arguments cannot be resolved into concrete type parameters by Flink's `TypeInfoFactory` and therefore fall back to Kryo serialization (`GenericTypeInfo`). Always declare collections with concrete type arguments (e.g. `List<ParentDto>` instead of `List<? extends ParentDto>`).



