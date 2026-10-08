---
title: Loading resources
sidebar_label: Loading resources
description: How to load classpath and filesystem files safely in Apache Flink using Flinkboot's Unified Resource API.
---

# Loading resources

Streaming applications frequently need to load side-inputs, reference datasets, encryption keys, and schema definitions across classpath and filesystem locations. Flinkboot provides the `Resource` API to unify and standardize these access patterns.

---

## 1. Unified resource API (`Resource`)

The `Resource` contract allows reading content via an `InputStream` without managing manual URL or file descriptors:

```java
import io.github.sekelenao.flinkboot.core.api.resource.Resource;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

Resource rules = Resource.of("classpath:rules/fraud-rules.json");

try (InputStream in = rules.inputStream()) {
    String json = new String(in.readAllBytes(), StandardCharsets.UTF_8);
}
```

---

## 2. Supported scheme prefixes

Flinkboot resolves paths based on scheme prefixes:

| Scheme Prefix | Target Location | Example |
|:---|:---|:---|
| `classpath:<path>` | JAR classpath resources | `Resource.of("classpath:schemas/event.avsc")` |
| `resource:<path>` | Alias for classpath resources | `Resource.of("resource:lookup.csv")` |
| `file:<path>` | Local or mounted filesystem | `Resource.of("file:/etc/secrets/tls.keystore")` |

Prefix matching is case-insensitive (`file:`, `FILE:`, `classpath:`).

---

## 3. Distributed streaming lifecycle

`Resource` instances are **not `Serializable`**. 

When accessing resources inside distributed Flink streaming operators (such as a `RichMapFunction` or `ProcessFunction`), do not serialize the `Resource` instance across TaskManagers. Instead, pass the path string to the operator constructor, declare the resource or resulting state as `transient`, and read the input stream inside the operator's `open(OpenContext)` lifecycle method.

