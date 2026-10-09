import {themes as prismThemes, type PrismTheme} from 'prism-react-renderer';
import type {Config, Plugin} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {generateLlmsFiles} from './scripts/generate-llms';

const javaDarkTheme: PrismTheme = {
  plain: {
    color: '#bcbec4',
    backgroundColor: '#1e1f22',
  },
  styles: [
    {
      types: ['keyword'],
      style: {
        color: '#cf8e6d',
        fontWeight: 'bold',
      },
    },
    {
      types: ['tag', 'tag-name'],
      style: {
        color: '#e8bf6a',
      },
    },
    {
      types: ['attr-name'],
      style: {
        color: '#bcbec4',
      },
    },
    {
      types: ['attr-value'],
      style: {
        color: '#6aab73',
      },
    },
    {
      types: ['annotation'],
      style: {
        color: '#f3ce6d',
      },
    },
    {
      types: ['string'],
      style: {
        color: '#6aab73',
      },
    },
    {
      types: ['number'],
      style: {
        color: '#2aacb8',
      },
    },
    {
      types: ['function'],
      style: {
        color: '#56a8f5',
      },
    },
    {
      types: ['class-name'],
      style: {
        color: '#bcbec4',
      },
    },
    {
      types: ['comment'],
      style: {
        color: '#7a7e85',
        fontStyle: 'italic',
      },
    },
    {
      types: ['variable', 'constant'],
      style: {
        color: '#c77dbb',
      },
    },
    {
      types: ['property', 'key', 'atrule'],
      style: {
        color: '#cf8e6d',
      },
    },
    {
      types: ['punctuation'],
      style: {
        color: '#bcbec4',
      },
    },
    {
      types: ['operator'],
      style: {
        color: '#bcbec4',
      },
    },
  ],
};

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

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'alternate',
        type: 'text/plain',
        href: '/llms.txt',
        title: 'LLM Documentation',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'alternate',
        type: 'text/plain',
        href: '/llms-full.txt',
        title: 'LLM Full Documentation',
      },
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl: 'https://github.com/Sekelenao/Flinkboot-Documentation/tree/main/',
          lastVersion: '0.5.0',
          includeCurrentVersion: false,
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
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
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
        content: 'Flinkboot Logo: Faster, safer. The Flink framework.',
      },
      {
        name: 'twitter:image:alt',
        content: 'Flinkboot Logo: Faster, safer. The Flink framework.',
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
          href: 'https://github.com/Sekelenao/Flinkboot/blob/main/CHANGELOG.md',
          label: 'Changelog',
          position: 'right',
        },
        {
          href: 'https://central.sonatype.com/artifact/io.github.sekelenao/flinkboot-core',
          label: 'Maven Central',
          position: 'right',
        },
        {
          href: 'https://github.com/Sekelenao/Flinkboot',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      links: [],
      copyright: 'Copyright © 2026 Flinkboot. Released under the Apache 2.0 License.',
    },
    prism: {
      theme: javaDarkTheme,
      darkTheme: javaDarkTheme,
      additionalLanguages: ['java', 'properties', 'yaml', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
