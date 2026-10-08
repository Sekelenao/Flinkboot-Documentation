# Installation

Learn how to configure your Maven `pom.xml` with the Flinkboot Bill of Materials (BOM), declare required modules, and package a production-ready Fat JAR.

---

## 1. Import the BOM

Add the Flinkboot Bill of Materials (BOM) to your project's `<dependencyManagement>`. The BOM centrally aligns versions and configures Apache Flink runtime libraries with `provided` scope automatically.

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>io.github.sekelenao</groupId>
            <artifactId>flinkboot</artifactId>
            <version>0.5.0-1.20</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

---

## 2. Declare dependencies

Add the Flinkboot modules you need to your `<dependencies>` section without specifying `<version>`:

```xml
<dependencies>
    <!-- Core API & declarative bootstrapping -->
    <dependency>
        <groupId>io.github.sekelenao</groupId>
        <artifactId>flinkboot-core</artifactId>
    </dependency>

    <!-- Optional connectors -->
    <dependency>
        <groupId>io.github.sekelenao</groupId>
        <artifactId>flinkboot-kafka</artifactId>
    </dependency>

    <!-- Testing utilities (automatically scoped as test) -->
    <dependency>
        <groupId>io.github.sekelenao</groupId>
        <artifactId>flinkboot-test</artifactId>
    </dependency>

    <!-- Flink runtime components (automatically scoped as provided by the BOM) -->
    <dependency>
        <groupId>org.apache.flink</groupId>
        <artifactId>flink-streaming-java</artifactId>
    </dependency>
    <dependency>
        <groupId>org.apache.flink</groupId>
        <artifactId>flink-clients</artifactId>
    </dependency>

    <!-- Logging API (provided by the cluster runtime) -->
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
    </dependency>
</dependencies>
```

---

## 3. Package the fat JAR

When deploying to an Apache Flink cluster, package your application with `maven-shade-plugin`. 

Because Flink ships its own internal version of Jackson, relocate Jackson classes (`com.fasterxml`) to avoid classpath collisions at runtime:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-shade-plugin</artifactId>
            <version>3.6.0</version>
            <executions>
                <execution>
                    <phase>package</phase>
                    <goals>
                        <goal>shade</goal>
                    </goals>
                    <configuration>
                        <createDependencyReducedPom>false</createDependencyReducedPom>
                        <shadedArtifactAttached>false</shadedArtifactAttached>
                        
                        <!-- Relocate Jackson to prevent clashes with Flink's runtime -->
                        <relocations>
                            <relocation>
                                <pattern>com.fasterxml</pattern>
                                <shadedPattern>io.github.sekelenao.flinkboot.shaded.fasterxml</shadedPattern>
                            </relocation>
                        </relocations>
                        
                        <!-- Exclude signatures and module descriptors -->
                        <filters>
                            <filter>
                                <artifact>*:*</artifact>
                                <excludes>
                                    <exclude>META-INF/*.SF</exclude>
                                    <exclude>META-INF/*.DSA</exclude>
                                    <exclude>META-INF/*.RSA</exclude>
                                    <exclude>module-info.class</exclude>
                                    <exclude>META-INF/versions/**</exclude>
                                </excludes>
                            </filter>
                        </filters>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```
