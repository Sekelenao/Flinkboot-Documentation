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
        {type: 'doc', id: 'configuration/resolving-cli-and-environment-parameters', label: 'Resolving CLI & environment parameters'},
      ],
    },
    {
      type: 'category',
      label: 'Connectors',
      collapsed: true,
      items: [
        {type: 'doc', id: 'connectors/kafka', label: 'Apache Kafka'},
        {type: 'doc', id: 'connectors/fluss', label: 'Apache Fluss'},
      ],
    },
    {
      type: 'category',
      label: 'Utilities',
      collapsed: true,
      items: [
        {type: 'doc', id: 'utilities/loading-resources', label: 'Loading resources'},
        {type: 'doc', id: 'utilities/serializing-jdk-types', label: 'Serializing JDK types'},
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
