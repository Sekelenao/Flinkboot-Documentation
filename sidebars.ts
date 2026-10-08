import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'Setup',
      collapsed: true,
      items: [
        {type: 'doc', id: 'setup/compatibility', label: 'Compatibility'},
        {type: 'doc', id: 'setup/setup-a-project', label: 'Installation'},
      ],
    },
    {
      type: 'category',
      label: 'Configuration',
      collapsed: true,
      items: [
        {type: 'doc', id: 'configuration/loading-configuration', label: 'Loading configuration'},
        {type: 'doc', id: 'configuration/validating-configuration', label: 'Validating configuration'},
        {type: 'doc', id: 'configuration/auto-configure-execution-environment', label: 'Bootstrapping execution environment'},
        {type: 'doc', id: 'configuration/cli-parameters-and-reserved-keys', label: 'CLI & Built-in Checks'},
      ],
    },
    {
      type: 'category',
      label: 'Connectors',
      collapsed: true,
      items: [
        {type: 'doc', id: 'kafka/configure-kafka-source', label: 'Kafka Source'},
        {type: 'doc', id: 'kafka/configure-kafka-sink', label: 'Kafka Sink'},
        {type: 'doc', id: 'fluss/configure-fluss-source', label: 'Fluss Source'},
        {type: 'doc', id: 'fluss/configure-fluss-sink', label: 'Fluss Sink'},
      ],
    },
    {
      type: 'category',
      label: 'Serialization',
      collapsed: true,
      items: [
        {type: 'doc', id: 'serialization/serialize-jdk-types', label: 'JDK Types & POJOs'},
      ],
    },
    {
      type: 'category',
      label: 'Testing',
      collapsed: true,
      items: [
        {type: 'doc', id: 'testing/assert-pojo-compliance', label: 'POJO Compliance'},
        {type: 'doc', id: 'testing/assert-serialization-compliance', label: 'Serialization Compliance'},
        {type: 'doc', id: 'testing/collect-stream-elements-in-tests', label: 'Collecting Sink'},
        {type: 'doc', id: 'testing/load-configurations-in-tests', label: 'Test Configurations'},
      ],
    },
  ],
};

export default sidebars;
