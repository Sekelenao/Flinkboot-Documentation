---
title: Resolving runtime arguments
sidebar_label: Resolving runtime arguments
description: How Flinkboot parses, resolves, and validates runtime CLI arguments, boolean flags, unified resources, and reserved framework settings.
---

# Resolving runtime arguments

In addition to static YAML files, streaming applications frequently need to inspect runtime command-line arguments, toggle operational flags, read external resources, and leverage framework-level flags.

Flinkboot unifies CLI arguments and environment variables into a single, fail-fast evaluation engine with automatic case normalization and strict collision safeguards.

---

## 1. Custom Parameters (`boot.parameter`)

A **parameter** is a key-value pair where the value is a string. Parameters are retrieved as a Java `Optional<String>`:

```java
Flinkboot boot = Flinkboot.initialize(args);

// Retrieves optional parameter "db-url"
Optional<String> dbUrl = boot.parameter("db-url");

String connectionString = dbUrl.orElse("jdbc:postgresql://localhost:5432/defaultdb");
```

### Passing Parameters
* **Via Command Line (CLI):** Prefix the parameter key with a single dash `-`:
  ```bash
  flink run MyJob.jar -db-url "jdbc:postgresql://prod-db:5432/orders"
  ```
* **Via Environment Variable:** Flinkboot normalizes keys to uppercase and replaces dashes with underscores:
  ```bash
  export DB_URL="jdbc:postgresql://prod-db:5432/orders"
  flink run MyJob.jar
  ```

### Resolution Precedence
1. **CLI Argument (`-db-url`)**: Highest priority.
2. **Environment Variable (`DB_URL`)**: Evaluated if CLI argument is absent.
3. **Empty Optional**: Returns `Optional.empty()` if defined in neither.

---

## 2. Boolean Flags (`boot.flag`)

A **flag** is a boolean switch used to enable or disable runtime behaviors (debug modes, dry runs, backfills). By default, flags evaluate to `false` when omitted:

```java
Flinkboot boot = Flinkboot.initialize(args);

// Evaluates boolean flag "dry-run"
boolean isDryRun = boot.flag("dry-run");

if (isDryRun) {
    System.out.println("Executing in dry-run mode without committing state.");
}
```

### Passing Flags
* **Via Command Line (CLI):** Prefix the flag key with double dashes `--`:
  ```bash
  flink run MyJob.jar --dry-run
  ```
  *(The presence of `--dry-run` automatically sets the flag to `true`)*.
* **Via Environment Variable:**
  ```bash
  export DRY_RUN=true
  flink run MyJob.jar
  ```

### Strict Boolean Parsing
When passing flags via environment variables, values must strictly be `"true"` or `"false"` (case-insensitive). Any arbitrary string (such as `"yes"`, `"1"`, or `"on"`) fails fast at startup with a `BooleanParsingException`.

---

## 3. Unified Resource Loading (`Resource`)

Applications frequently need to load side-inputs, reference datasets, and cryptographic assets across classpath and filesystem locations. Flinkboot's `Resource` API unifies these access patterns:

```java
import io.github.sekelenao.flinkboot.core.api.resource.Resource;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

Resource rules = Resource.of("classpath:rules/fraud-rules.json");

try (InputStream in = rules.inputStream()) {
    String json = new String(in.readAllBytes(), StandardCharsets.UTF_8);
}
```

### Supported Scheme Prefixes

| Scheme Prefix | Target Location | Example |
|:---|:---|:---|
| `classpath:<path>` | JAR classpath resources | `Resource.of("classpath:schemas/event.avsc")` |
| `resource:<path>` | Alias for classpath resources | `Resource.of("resource:lookup.csv")` |
| `file:<path>` | Local or mounted filesystem | `Resource.of("file:/etc/secrets/tls.keystore")` |

Prefix matching is case-insensitive (`file:`, `FILE:`, `classpath:`).

`Resource` instances are **not `Serializable`**. When used inside Flink streaming operators (`RichMapFunction`), always declare the field as `transient` and load it inside `open(OpenContext)`.

---

## 4. Built-in Values Checked by Flinkboot

Flinkboot provides built-in options that control configuration resolution, merging, and validation. These keys are reserved by the framework:

| Command Line Key | Environment Variable | Default | Purpose & Fail-Fast Check |
|:---|:---|:---|:---|
| `-flinkboot-configurations <paths>` | `FLINKBOOT_CONFIGURATIONS` | `classpath:job-configuration.yaml` | Comma-separated list of configuration URIs to load and merge sequentially. |
| `--flinkboot-configuration-override` | `FLINKBOOT_CONFIGURATION_OVERRIDE` | `false` | When `false`, redefining an existing scalar key across merged files throws a `YamlParsingException`. When `true`, overrides are allowed. |
| `--flinkboot-configuration-list-merging` | `FLINKBOOT_CONFIGURATION_LIST_MERGING` | `false` | When `false`, redefining a list throws an exception. When `true`, list items across files are concatenated. |
| `--flinkboot-configuration-disable-validation` | `FLINKBOOT_CONFIGURATION_DISABLE_VALIDATION` | `false` | Bypasses Jakarta Bean Validation checks on configuration models (useful for mock tests). Malformed YAML still fails fast. |
| `-flinkboot-configuration-violations-log-size <n>` | `FLINKBOOT_CONFIGURATION_VIOLATIONS_LOG_SIZE` | `10` | Maximum number of Bean Validation violations displayed before summary truncation. Must be a **strictly positive integer**; zero or negative values fail fast at startup. |

### Automatic Framework Safeguards

1. **Reserved Key Collision Protection:**  
   You cannot name a custom parameter `-flinkboot-configurations` or custom flag `--flinkboot-configuration-override`. Flinkboot prevents accidental interception of internal framework flags.
2. **Environment Variable Placeholder Invariants (`${VAR}`):**  
   Every `${...}` placeholder in your YAML files is checked at startup. If any referenced variable is missing from the host environment, startup immediately halts with an `UnresolvedPropertyPlaceholderException`.
3. **Escaping Literals:**  
   To prevent Flinkboot from attempting to resolve a literal placeholder (e.g. S3 partition formats `\${year}/\${month}`), escape it with a backslash: `\${...}`.
