import {themes as prismThemes} from 'prism-react-renderer';
import type {Config, Plugin} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {generateLlmsFiles} from './scripts/generate-llms';

function llmsTxtPlugin(): Plugin {
  return {
    name: 'llms-txt-plugin',
    async loadContent() {
      generateLlmsFiles(process.cwd());
    },
  };
}

const config: Config = {
  title: 'Flinkboot',
  tagline: 'Faster, safer. The Flink framework.',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  // Production URL for Cloudflare Pages & custom domain
  url: 'https://flinkboot.com',
  baseUrl: '/',

  organizationName: 'Sekelenao',
  projectName: 'Flinkboot-Documentation',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl: 'https://github.com/Sekelenao/Flinkboot-Documentation/tree/main/',
          lastVersion: 'current',
          onlyIncludeVersions: ['current'],
          versions: {
            current: {
              label: '0.5.0-1.20',
              path: '',
              banner: 'none',
            },
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [llmsTxtPlugin],

  themeConfig: {
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    image: 'img/flinkboot-social-card.png',
    metadata: [
      {
        name: 'description',
        content:
          'Fail fast on configuration, serialize natively without Kryo, and bootstrap Apache Flink stream pipelines with zero boilerplate.',
      },
      {
        property: 'og:image:alt',
        content: 'Flinkboot Logo — Faster, safer. The Flink framework.',
      },
      {
        name: 'twitter:image:alt',
        content: 'Flinkboot Logo — Faster, safer. The Flink framework.',
      },
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Flinkboot',
      logo: {
        alt: 'Flinkboot Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://central.sonatype.com/artifact/io.github.sekelenao/flinkboot-core',
          label: 'Maven Central',
          position: 'right',
        },
        {
          href: 'https://github.com/Sekelenao/Flinkboot',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      links: [],
      copyright: 'Copyright © 2026 Flinkboot. Released under the Apache 2.0 License.',
    },
    prism: {
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['java', 'properties', 'yaml', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
