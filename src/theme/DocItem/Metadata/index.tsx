import React, {type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import {PageMetadata} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';

export default function DocItemMetadata(): ReactNode {
  const {metadata, frontMatter, assets} = useDoc();

  const siteUrl = 'https://flinkboot.com';
  const pageUrl = `${siteUrl}${metadata.permalink}`;

  const techArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: metadata.title,
    description: metadata.description,
    url: pageUrl,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://flinkboot.com/#website',
      name: 'Flinkboot',
      url: siteUrl,
    },
    about: {
      '@type': 'SoftwareApplication',
      '@id': 'https://flinkboot.com/#software',
      name: 'Flinkboot',
    },
  };

  return (
    <>
      <PageMetadata
        title={metadata.title}
        description={metadata.description}
        keywords={frontMatter.keywords}
        image={assets.image ?? frontMatter.image}
      />
      <Head>
        <script type="application/ld+json">
          {JSON.stringify(techArticleSchema)}
        </script>
      </Head>
    </>
  );
}
