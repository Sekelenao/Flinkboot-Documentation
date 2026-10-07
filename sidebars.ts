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
      label: 'Setup & BOM',
      collapsed: true,
      items: [
        {type: 'doc', id: 'setup/compatibility', label: 'Compatibility Matrix'},
        {type: 'doc', id: 'setup/bom-managed-dependencies', label: 'BOM & Dependencies'},
        {type: 'doc', id: 'setup/avoid-dependency-conflicts', label: 'Classpath Conflicts'},
      ],
    },
    {
      type: 'category',
      label: 'Configuration',
      collapsed: true,
      items: [
        {type: 'doc', id: 'configuration/load-configurations', label: 'Load Configurations'},
        {type: 'doc', id: 'configuration/configure-execution-environment', label: 'Execution Environment'},
        {type: 'doc', id: 'configuration/load-a-parameter', label: 'Load Parameters'},
        {type: 'doc', id: 'configuration/load-a-flag', label: 'Load Flags'},
        {type: 'doc', id: 'configuration/load-resources', label: 'Load Resources'},
        {type: 'doc', id: 'configuration/reserved-keys', label: 'Reserved Keys'},
        {type: 'doc', id: 'configuration/validate-custom-configurations', label: 'Custom Validation'},
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
