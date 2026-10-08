---
title: Validating configuration
sidebar_label: Validating configuration
description: Enforce validation rules on custom configuration using Jakarta Bean Validation and cross-field invariants in Flinkboot.
---

# Validating configuration

Configuration errors are a frequent cause of streaming runtime failures, often surfacing only after job submission. Flinkboot integrates [Jakarta Bean Validation](https://jakarta.ee/specifications/bean-validation/) to validate models fail-fast during initialization before your streaming pipeline starts.

---

## 1. Jakarta Bean Validation

Validation occurs **after the final configuration tree has been fully resolved and merged** (including all configuration files and environment variable substitutions). Every model loaded via `boot.configuration(...)` is then automatically evaluated against standard Jakarta Bean Validation constraints.

You can apply any constraint from the `jakarta.validation.constraints` package, such as `@NotNull`, `@NotBlank`, `@Positive`, `@Min`, `@Max`, `@Pattern`, or `@Size`.

```java
package com.company.fraud.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.io.Serializable;

public record DatabaseProperties(
    @NotBlank @JsonProperty("host") String host,
    @Min(1024) @Max(65535) @JsonProperty("port") int port,
    @NotNull @Positive @JsonProperty("max-connections") Integer maxConnections
) implements Serializable {}
```

For nested models, remember to place `@Valid` on the parent field so that Jakarta cascades validation to inner objects:

```java
public record AppConfig(
    @Valid @NotNull @JsonProperty("database") DatabaseProperties database
) implements Serializable {}
```

Refer to the official [Jakarta Bean Validation documentation](https://jakarta.ee/specifications/bean-validation/) for details on all available built-in annotations.

---

## 2. Validation error reporting

When a constraint is violated, Flinkboot halts application startup with a `ConfigurationValidationException`. The violation path is mapped to kebab-case YAML property names so the developer can immediately locate the offending configuration key.

Example log output:

```text
io.github.sekelenao.flinkboot.core.api.exception.configuration.ConfigurationValidationException: 
Configuration validation failed with 2 violation(s):
 - database.port: must be greater than or equal to 1024
 - database.max-connections: must be greater than 0
```

By default, Flinkboot prints up to 10 validation violations before summarizing any remaining errors (`... and X more violation(s)`). You can change this limit using the CLI parameter:

```bash
--flinkboot-configuration-violations-log-size 25
```

---

## 3. Disabling validation

Bean validation can be disabled using the CLI flag `--flinkboot-configuration-disable-validation`.

However, disabling validation means no constraints are verified at startup. No application behavior or runtime stability is guaranteed when running with validation disabled.

---

## 4. Cross-field validation with `ValidatableProperties`

Field-level annotations cannot validate invariants that span multiple fields, such as ensuring a sliding window slide interval is strictly shorter than its window length.

Flinkboot provides the `ValidatableProperties` interface to implement custom cross-field validation rules directly on your model:

```java
package com.company.fraud.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.github.sekelenao.flinkboot.core.api.validation.ValidatableProperties;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.Duration;

public record WindowProperties(
    @NotNull @JsonProperty("window-size") Duration windowSize,
    @JsonProperty("slide-duration") Duration slideDuration
) implements ValidatableProperties, Serializable {

    @Override
    public boolean validate(ConstraintValidatorContext context) {
        if (slideDuration != null && slideDuration.compareTo(windowSize) >= 0) {
            // Suppress the default generic class-level message
            context.disableDefaultConstraintViolation();

            // Bind the violation to the specific field in error
            context.buildConstraintViolationWithTemplate(
                       "slide-duration must be strictly less than window-size")
                   .addPropertyNode("slide-duration")
                   .addConstraintViolation();
            return false;
        }
        return true;
    }
}
```

Calling `context.disableDefaultConstraintViolation()` suppresses generic top-level class messages and outputs your specific violation message targeting the relevant property node.
