import fs from 'fs';
import path from 'path';

interface DocEntry {
  title: string;
  description: string;
  permalink: string;
  rawPath: string;
  sourceFile: string;
}

const quickstartMarkdown = `# Quickstart: Alien Eggs Detector

A minimal, zero-boilerplate Apache Flink application powered by Flinkboot.

## Context
Pipeline flow:
1. Space Cargo Source (Generates random cargo boxes)
2. Contraband Filter (Flags dangerous Alien Eggs)
3. Customs Alert Map (Formats quarantine alerts)
4. Printing Sink (Prints alerts to terminal)
5. Live Radar / Web UI (Live graph on localhost:8080)

## Prerequisites
- Java 11+
- Maven
- IntelliJ IDEA

## 1. Clone the project
\`\`\`bash
git clone https://github.com/Sekelenao/Flinkboot-Quickstart.git
cd Flinkboot-Quickstart
\`\`\`

## 2. IntelliJ IDEA setup
Flink runtime dependencies are scoped as provided so fat JARs stay lightweight for remote clusters.
To run locally in IntelliJ IDEA without a ClassNotFoundException, enable provided dependencies on the classpath:
1. Open Run Configuration: Right-click Main.java > More Run/Debug > Modify Run Configuration...
2. Access options: In the top-right of the modal, click Modify options (or press Alt + M).
3. Include provided dependencies: Under Java, check Add dependencies with "provided" scope to classpath.
4. Launch: Click Apply, then hit the green Run 'Main' button!

## 3. Watch the scanner run live!
Your pipeline is actively streaming data and inspecting cargo boxes in real time. The output prints directly in your IntelliJ console, and by default, a local Flink Web UI is available at http://localhost:8080.
`;

export function generateLlmsFiles(siteDir: string) {
  const versionsFile = path.join(siteDir, 'versions.json');
  const targetRawDir = path.join(siteDir, 'static', 'raw');
  const staticDir = path.join(siteDir, 'static');

  // Purge stale raw directory to avoid lingering removed files
  if (fs.existsSync(targetRawDir)) {
    fs.rmSync(targetRawDir, {recursive: true, force: true});
  }
  fs.mkdirSync(targetRawDir, {recursive: true});

  // Always write quickstart.md raw file
  fs.writeFileSync(path.join(targetRawDir, 'quickstart.md'), quickstartMarkdown, 'utf8');

  // Discover all versions
  let versions: string[] = [];
  if (fs.existsSync(versionsFile)) {
    try {
      versions = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
    } catch (e) {
      console.warn('[llms-generator] Failed to parse versions.json', e);
    }
  }

  // Helper to collect all markdown files recursively
  function getMarkdownFiles(dir: string, baseDir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, {withFileTypes: true});
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getMarkdownFiles(fullPath, baseDir));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.relative(baseDir, fullPath));
      }
    }
    return files;
  }

  function extractDocEntries(docsDir: string, versionPrefix: string): DocEntry[] {
    const files = getMarkdownFiles(docsDir, docsDir);
    const entries: DocEntry[] = [];

    for (const relFile of files) {
      const fullPath = path.join(docsDir, relFile);
      const content = fs.readFileSync(fullPath, 'utf8');

      let title = '';
      let description = '';
      let slug = '';

      const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (frontmatterMatch) {
        const fm = frontmatterMatch[1];
        const titleMatch = fm.match(/^title:\s*(.*)$/m);
        if (titleMatch) title = titleMatch[1].replace(/^["']|["']$/g, '').trim();

        const descMatch = fm.match(/^description:\s*(.*)$/m);
        if (descMatch) description = descMatch[1].replace(/^["']|["']$/g, '').trim();

        const slugMatch = fm.match(/^slug:\s*(.*)$/m);
        if (slugMatch) slug = slugMatch[1].replace(/^["']|["']$/g, '').trim();
      }

      if (!title) {
        const h1Match = content.match(/^#\s+(.+)$/m);
        if (h1Match) title = h1Match[1].trim();
        else title = path.basename(relFile, '.md');
      }

      let permalink = '/docs/' + relFile.replace(/\.md$/, '');
      if (slug === '/') permalink = '/docs/';
      else if (slug) permalink = `/docs/${slug.replace(/^\//, '')}`;
      else if (relFile === 'intro.md') permalink = '/docs/';

      entries.push({
        title,
        description,
        permalink,
        rawPath: `/raw/${versionPrefix}/${relFile}`,
        sourceFile: relFile,
      });
    }

    // Add standalone Quickstart page to entries
    entries.push({
      title: 'Quickstart',
      description: 'Alien eggs detector: clone, launch, and inspect a live Apache Flink pipeline powered by Flinkboot in 2 minutes.',
      permalink: '/quickstart/',
      rawPath: '/raw/quickstart.md',
      sourceFile: 'quickstart.md',
    });

    // Sort: intro first, quickstart second, compatibility third, then alphabetically
    entries.sort((a, b) => {
      if (a.sourceFile === 'intro.md') return -1;
      if (b.sourceFile === 'intro.md') return 1;
      if (a.sourceFile === 'quickstart.md') return -1;
      if (b.sourceFile === 'quickstart.md') return 1;
      if (a.sourceFile === 'compatibility.md') return -1;
      if (b.sourceFile === 'compatibility.md') return 1;
      return a.permalink.localeCompare(b.permalink);
    });

    return entries;
  }

  // 1. Mirror and generate per-version llms files
  for (const v of versions) {
    const vDir = path.join(siteDir, 'versioned_docs', `version-${v}`);
    const vFiles = getMarkdownFiles(vDir, vDir);
    for (const relFile of vFiles) {
      const srcPath = path.join(vDir, relFile);
      const destPath = path.join(targetRawDir, v, relFile);
      fs.mkdirSync(path.dirname(destPath), {recursive: true});
      fs.copyFileSync(srcPath, destPath);
    }

    const versionDocEntries = extractDocEntries(vDir, v);

    // Generate llms-<version>.txt
    let vLlmsTxt = `# Flinkboot Documentation (Version ${v})

> Bootstrapping & Reliability Framework for Apache Flink.
> Fail fast on configuration, serialize natively without Kryo, and bootstrap Apache Flink pipelines with zero boilerplate.

- Version: ${v}
- Website: https://flinkboot.com
- GitHub: https://github.com/Sekelenao/Flinkboot
- Quickstart: https://flinkboot.com/quickstart/
- Complete Documentation for ${v} in one file: https://flinkboot.com/llms-${v}-full.txt

## Guides & Documentation (Version ${v})

`;
    for (const doc of versionDocEntries) {
      const desc = doc.description ? `: ${doc.description}` : '';
      vLlmsTxt += `- [${doc.title}](https://flinkboot.com${doc.permalink})${desc} (Raw: https://flinkboot.com${doc.rawPath})\n`;
    }
    fs.writeFileSync(path.join(staticDir, `llms-${v}.txt`), vLlmsTxt, 'utf8');

    // Generate llms-<version>-full.txt
    let vLlmsFullTxt = `# Flinkboot Complete Documentation (Version ${v})

> Bootstrapping & Reliability Framework for Apache Flink.
> Version: ${v}
> https://flinkboot.com | GitHub: https://github.com/Sekelenao/Flinkboot

`;
    for (const doc of versionDocEntries) {
      let content = '';
      if (doc.sourceFile === 'quickstart.md') {
        content = quickstartMarkdown;
      } else {
        const filePath = path.join(vDir, doc.sourceFile);
        content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
      }

      vLlmsFullTxt += `\n\n================================================================================\n`;
      vLlmsFullTxt += `DOCUMENT: ${doc.title} (${doc.permalink})\n`;
      vLlmsFullTxt += `================================================================================\n\n`;
      vLlmsFullTxt += content.trim() + '\n';
    }
    fs.writeFileSync(path.join(staticDir, `llms-${v}-full.txt`), vLlmsFullTxt, 'utf8');
  }

  // 2. Also mirror unversioned docs/ into static/raw/current/
  const unversionedDocsDir = path.join(siteDir, 'docs');
  const currentFiles = getMarkdownFiles(unversionedDocsDir, unversionedDocsDir);
  for (const relFile of currentFiles) {
    const srcPath = path.join(unversionedDocsDir, relFile);
    const destPath = path.join(targetRawDir, 'current', relFile);
    fs.mkdirSync(path.dirname(destPath), {recursive: true});
    fs.copyFileSync(srcPath, destPath);
  }

  // 3. Primary active version for root llms.txt & llms-full.txt
  const activeVersion = versions.length > 0 ? versions[0] : null;
  const activeDocsDir = activeVersion
    ? path.join(siteDir, 'versioned_docs', `version-${activeVersion}`)
    : unversionedDocsDir;

  const activeDocEntries = extractDocEntries(activeDocsDir, activeVersion || 'current');

  // 4. Generate root llms.txt with version selector for LLMs
  let rootLlmsTxt = `# Flinkboot Documentation (Active Version: ${activeVersion || 'current'})

> Bootstrapping & Reliability Framework for Apache Flink.
> Fail fast on configuration, serialize natively without Kryo, and bootstrap Apache Flink pipelines with zero boilerplate.

- Website: https://flinkboot.com
- GitHub: https://github.com/Sekelenao/Flinkboot
- Quickstart: https://flinkboot.com/quickstart/
- Maven Central: https://central.sonatype.com/artifact/io.github.sekelenao/flinkboot-core
- Complete Documentation (Latest) in one file: https://flinkboot.com/llms-full.txt

## Available Versions
`;

  if (versions.length > 0) {
    for (const v of versions) {
      const isLatest = v === activeVersion ? ' (Latest)' : '';
      rootLlmsTxt += `- Version ${v}${isLatest}: Summary https://flinkboot.com/llms-${v}.txt | Full context: https://flinkboot.com/llms-${v}-full.txt\n`;
    }
  } else {
    rootLlmsTxt += `- Current: https://flinkboot.com/llms-full.txt\n`;
  }

  rootLlmsTxt += `\n## Guides & Documentation (Latest Version: ${activeVersion || 'current'})\n\n`;

  for (const doc of activeDocEntries) {
    const desc = doc.description ? `: ${doc.description}` : '';
    rootLlmsTxt += `- [${doc.title}](https://flinkboot.com${doc.permalink})${desc} (Raw: https://flinkboot.com${doc.rawPath})\n`;
  }

  fs.writeFileSync(path.join(staticDir, 'llms.txt'), rootLlmsTxt, 'utf8');

  // 5. Generate root llms-full.txt (alias of active version full doc)
  if (activeVersion && fs.existsSync(path.join(staticDir, `llms-${activeVersion}-full.txt`))) {
    fs.copyFileSync(
      path.join(staticDir, `llms-${activeVersion}-full.txt`),
      path.join(staticDir, 'llms-full.txt')
    );
  }

  console.log(`[llms-generator] Successfully generated root and version-specific LLM files (${versions.join(', ')}).`);
}
