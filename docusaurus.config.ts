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
  tagline: 'Faster, safer configuration for Apache Flink jobs',
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
          lastVersion: '0.5.0',
          onlyIncludeVersions: ['0.5.0'],
          versions: {
            '0.5.0': {
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
    image: 'img/logo.svg',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
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
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['java', 'properties', 'yaml', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
