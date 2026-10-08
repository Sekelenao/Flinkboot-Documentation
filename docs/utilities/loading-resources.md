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

## 3. Streaming operator lifecycle

`Resource` instances are **not `Serializable`**. 

When using a resource inside a distributed Flink function (such as a `RichMapFunction` or `ProcessFunction`), declare the field as `transient` and load it inside the `open` lifecycle method:

```java
import io.github.sekelenao.flinkboot.core.api.resource.Resource;
import org.apache.flink.api.common.functions.OpenContext;
import org.apache.flink.api.common.functions.RichMapFunction;
import java.io.InputStream;

public class RuleEvaluator extends RichMapFunction<Transaction, Alert> {

    private final String resourcePath;
    private transient Resource rulesResource;

    public RuleEvaluator(String resourcePath) {
        this.resourcePath = resourcePath;
    }

    @Override
    public void open(OpenContext context) {
        // Loaded locally on the TaskManager during operator initialization
        this.rulesResource = Resource.of(resourcePath);
    }

    @Override
    public Alert map(Transaction transaction) throws Exception {
        try (InputStream in = rulesResource.inputStream()) {
            // Evaluate rules against stream transaction...
        }
        return null;
    }
}
```
