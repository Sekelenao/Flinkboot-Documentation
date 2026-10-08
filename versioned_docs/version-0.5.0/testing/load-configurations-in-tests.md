---
title: Loading configuration in tests
sidebar_label: Loading configuration in tests
description: Load, merge, and validate YAML configurations directly in JUnit 5 tests using Flinkboot.initialize.
---

# Loading configuration in tests

Flinkboot allows you to load, merge, and validate YAML configurations directly within your JUnit 5 tests using `Flinkboot.initialize(...)`.

---

## 1. Overview

When writing unit or integration tests for your Flink applications, you often need to load and validate your application configuration objects (DTOs) without starting a full command-line application:
* **Production parity**: Tests execute through the exact same parsing and validation engine used in production.
* **Varargs simplicity**: Call `Flinkboot.initialize()` with zero arguments for default classpath configuration, or pass command-line options inline.
* **Full option support**: Test custom flags (`--dry-run`), CLI parameters (`-threshold 100`), or Flinkboot runtime options alongside your configuration files.
* **Explicit scheme prefixes**: Unified support for `classpath:`, `resource:`, and `file:` schemes via Flinkboot's `Resource` API.

---

## 2. Usage examples

### Loading default classpath configuration

Calling `Flinkboot.initialize()` without arguments automatically loads `src/test/resources/job-configuration.yaml`:

```java
import io.github.sekelenao.flinkboot.core.api.Flinkboot;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class ApplicationConfigTest {

    @Test
    void shouldLoadDefaultConfiguration() throws Exception {
        MyApplicationConfig config = Flinkboot.initialize()
            .configuration(MyApplicationConfig.class);

        assertNotNull(config);
    }
}
```

---

### Loading a specific configuration file

Pass `-flinkboot-configurations` with an explicit resource scheme prefix:

```java
@Test
void shouldLoadSpecificConfiguration() throws Exception {
    MyApplicationConfig config = Flinkboot.initialize(
        "-flinkboot-configurations", "classpath:job-test.yaml"
    ).configuration(MyApplicationConfig.class);

    assertNotNull(config);
}
```

---

### Loading multiple merged configurations

You can pass multiple comma-separated configuration paths to test profile overrides:

```java
@Test
void shouldLoadMultipleConfigurations() throws Exception {
    MyApplicationConfig config = Flinkboot.initialize(
        "-flinkboot-configurations",
        "classpath:config-base.yaml,classpath:config-test-env.yaml"
    ).configuration(MyApplicationConfig.class);

    assertNotNull(config);
}
```

---

### Loading files from the file system

Target external configuration files outside the classpath using the `file:` prefix:

```java
@Test
void shouldLoadFromFileSystem() throws Exception {
    MyApplicationConfig config = Flinkboot.initialize(
        "-flinkboot-configurations", "file:/etc/flinkboot/my-config.yaml"
    ).configuration(MyApplicationConfig.class);

    assertNotNull(config);
}
```

---

### Testing with flags and CLI parameters

You can pass custom flags and parameters inline:

```java
@Test
void shouldLoadConfigurationWithOptions() throws Exception {
    Flinkboot boot = Flinkboot.initialize(
        "-flinkboot-configurations", "classpath:job-test.yaml",
        "--dry-run",
        "-custom-param", "custom-value"
    );

    MyApplicationConfig config = boot.configuration(MyApplicationConfig.class);

    assertAll(
        () -> assertNotNull(config),
        () -> assertTrue(boot.flag("dry-run")),
        () -> assertEquals("custom-value", boot.parameter("custom-param").orElseThrow())
    );
}
```

---

## 3. Scheme prefixes

Each path passed to `-flinkboot-configurations` must specify a valid resource scheme:

| Scheme prefix | Target location                                 | Example                        |
|:--------------|:------------------------------------------------|:-------------------------------|
| `classpath:`  | Classpath resources (e.g. `src/test/resources`) | `"classpath:job-test.yaml"`    |
| `resource:`   | Alias for classpath resources                   | `"resource:job-test.yaml"`     |
| `file:`       | Absolute or relative file system paths          | `"file:/tmp/test-config.yaml"` |

Omitting the prefix will throw an `UnrecognizedResourceException`.
