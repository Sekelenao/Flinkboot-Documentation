---
title: Loading configuration
sidebar_label: Loading configuration
description: Define and load type-safe configuration models with Jackson, Java Records, and immutable classes in Flinkboot.
---

# Loading configuration

In real-world Apache Flink applications, pipelines require custom business parameters alongside execution settings: alert thresholds, window intervals, database endpoints, or external API keys.

Under the hood, configuration deserialization is powered by [Jackson](https://github.com/FasterXML/jackson). Standard Java types, collections, and Java temporal types are supported out of the box through Jackson's Java Time module.

YAML keys map to Java fields using Jackson's `@JsonProperty("key-name")` annotation. Property names are matched case-insensitively.

---

## 1. Defining configuration models

### Mandatory fields with Java Records (Java 17+)

For models where all fields are required and you are running on Java 17+, standard Java Records provide clean, compact immutability:

```java
package com.company.fraud.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.io.Serializable;
import java.time.Duration;

public record AlertingProperties(
    @NotNull @Positive @JsonProperty("threshold-amount") Double thresholdAmount,
    @NotNull @JsonProperty("evaluation-window") Duration evaluationWindow,
    @NotBlank @JsonProperty("notification-email") String notificationEmail
) implements Serializable {}
```

Corresponding YAML snippet:

```yaml
alerting:
  threshold-amount: 5000.00
  evaluation-window: "PT5M"
  notification-email: "fraud-ops@company.com"
```

### Immutable class with Optional getters for optional fields

When certain configuration properties are optional, a Java Record cannot safely hide the raw nullable accessor. Instead, define an immutable class with private final fields, `@JsonCreator`, and explicit `Optional<T>` getters:

```java
package com.company.fraud.config;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import java.io.Serializable;
import java.util.Optional;

public final class ServerProperties implements Serializable {

    private final String host;
    private final Integer port;

    @JsonCreator
    public ServerProperties(
        @NotBlank @JsonProperty("host") String host,
        @JsonProperty("port") Integer port
    ) {
        this.host = host;
        this.port = port;
    }

    public String host() {
        return host;
    }

    public Optional<Integer> port() {
        return Optional.ofNullable(port);
    }
}
```

Corresponding YAML snippet:

```yaml
server:
  host: "db.internal.net"
  # port is omitted and resolves to Optional.empty()
```

---

## 2. Customizing Jackson YAML deserialization

If your domain models require custom Jackson configuration or third-party modules, supply a builder customizer lambda when loading the configuration:

```java
AppConfig config = boot.configuration(AppConfig.class, builder -> {
    builder.configure(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_AS_NULL, true);
    builder.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, true);
});
```

You can also pass a pre-configured `YAMLMapper` directly:

```java
YAMLMapper mapper = new YAMLMapper();
// Custom mapper configuration...

AppConfig config = boot.configuration(AppConfig.class, mapper);
```

For more options, refer to the official [Jackson documentation](https://github.com/FasterXML/jackson-databind).

---

## 3. Loading configuration

To bind your YAML files to your domain model, call `boot.configuration(Class<T>)`:

```java
public static void main(String[] args) throws Exception {
    Flinkboot boot = Flinkboot.initialize(args);

    // Binds and validates YAML configuration into your model
    AppConfig config = boot.configuration(AppConfig.class);

    // Access your strongly-typed configuration
    double threshold = config.alerting().thresholdAmount();
    String host = config.server().host();
    int port = config.server().port().orElse(8080);
}
```

### Default configuration location

By default, Flinkboot looks for a file named `job-configuration.yaml` in your application classpath:

```text
classpath:job-configuration.yaml
```

If this file is missing and no other location is specified, initialization fails fast.

### Overriding configuration paths

You can override the default location at runtime or supply multiple configuration files to merge:

* **Via Command Line Argument:** Pass `-flinkboot-configurations` followed by comma-separated paths:
  ```bash
  flink run MyJob.jar -flinkboot-configurations "file:/etc/flink/job-config.yaml"
  ```
  To merge multiple configurations sequentially:
  ```bash
  flink run MyJob.jar -flinkboot-configurations "classpath:base-config.yaml,file:/etc/flink/production.yaml"
  ```

* **Via Environment Variable:**
  ```bash
  export FLINKBOOT_CONFIGURATIONS="file:/etc/flink/production.yaml"
  flink run MyJob.jar
  ```

Supported URI schemes include `classpath:<path>`, `resource:<path>`, and `file:<path>`.

### Merging multiple configuration files

When loading multiple files sequentially, Flinkboot enforces strict collision rules by default to prevent accidental configuration overwrites:

* **Scalar Overrides (`--flinkboot-configuration-override`):**  
  By default (`false`), redefining an already existing key across files halts startup immediately with a `YamlParsingException`. To intentionally allow later files to overwrite earlier scalar values (e.g. environment-specific overrides over a base template), enable:
  ```bash
  flink run MyJob.jar \
    -flinkboot-configurations "classpath:base.yaml,file:/etc/flink/prod.yaml" \
    --flinkboot-configuration-override
  ```
  *(Or set environment variable `FLINKBOOT_CONFIGURATION_OVERRIDE=true`)*.

* **List Merging (`--flinkboot-configuration-list-merging`):**  
  By default (`false`), redefining an existing list or array across merged files is considered a collision and throws an exception. To append and concatenate list items from subsequent files, enable:
  ```bash
  flink run MyJob.jar \
    -flinkboot-configurations "classpath:base.yaml,file:/etc/flink/prod.yaml" \
    --flinkboot-configuration-list-merging
  ```
  *(Or set environment variable `FLINKBOOT_CONFIGURATION_LIST_MERGING=true`)*.

---

## 4. Environment variable templating

Configuration files support dynamic variable interpolation using the `${VAR_NAME}` syntax. Values are resolved from host environment variables before Jackson binds your configuration models:

```yaml
server:
  host: "${DATABASE_HOST}"
  port: ${DATABASE_PORT}
```

### Fail-fast invariant

Flinkboot validates all placeholders strictly at startup:
- If a referenced variable is missing from the host environment, initialization fails fast with an `UnresolvedPropertyPlaceholderException`.
- This ensures your streaming job never starts with partially resolved or missing credentials.

### Escaping literal placeholders

If your configuration contains literal `${...}` strings that should not be evaluated as environment variables (for example, partitioned file patterns or regex templates), escape the prefix with a backslash:

```yaml
sink:
  path-template: "\${year}/\${month}/\${day}"
```

Flinkboot preserves the literal pattern `${year}/${month}/${day}` without attempting resolution.


