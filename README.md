# Flinkboot Documentation (flinkboot.com)

> Source code and content for the official documentation website of [Flinkboot](https://github.com/Sekelenao/Flinkboot), hosted at [flinkboot.com](https://flinkboot.com).

This repository is dedicated exclusively to the documentation of published releases of Flinkboot. It is deliberately decoupled from the core Java framework repository to prevent web tooling dependencies from polluting the Maven build.

Updates to this repository are strictly driven by the `CHANGELOG.md` of the main Flinkboot project upon each official release.

---

## Repository Structure

```text
flinkboot-docs/
├── docs/                     # Working documentation directory
├── versioned_docs/           # Immutable snapshots of published releases
├── versioned_sidebars/       # Sidebar configurations for published releases
├── versions.json             # Registry of published documentation versions
├── src/                      # Landing page, custom React components, and styling
├── static/                   # Static assets (logo, favicon)
├── docusaurus.config.ts      # Site configuration, navigation, and routing
└── sidebars.ts               # Base sidebar structure
```

---

## Development & Build

### Prerequisites

- Node.js `>= 20.0`
- npm `>= 10.0`

### Commands

| Command             | Description                                                |
|:--------------------|:-----------------------------------------------------------|
| `npm install`       | Install project dependencies.                              |
| `npm start`         | Start local development server on `http://localhost:3000`. |
| `npm run typecheck` | Run TypeScript validation across configs and components.   |
| `npm run build`     | Generate production static assets into `build/`.           |
| `npm run serve`     | Preview production build locally.                          |
| `npm run clear`     | Clear Docusaurus and bundler caches.                       |

---

## Release Workflow

When a new version is released in Flinkboot:

1. **Update documentation**: Reflect the new features, breaking changes, or connector additions announced in the main project's `CHANGELOG.md`.
2. **Snapshot the version**:
   ```bash
   npm run docusaurus docs:version <RELEASE_VERSION>
   ```
3. **Register the version in `docusaurus.config.ts`**:
   Add the new version to `onlyIncludeVersions` and `versions`:
   ```ts
   onlyIncludeVersions: ['<NEW_VERSION>', '<PREVIOUS_VERSION>'],
   versions: {
     '<NEW_VERSION>': {
       label: '<NEW_VERSION>',
       path: '',
       banner: 'none',
     },
   }
   ```
4. **Verify the build**:
   ```bash
   npm run clear && npm run build
   ```

---

## Cloudflare Pages Deployment

Automated CI/CD via Cloudflare Pages:

- **Build command**: `npm run build`
- **Build output directory**: `build`
- **Environment variables**: `NODE_VERSION=20`
- **Custom domain**: `flinkboot.com`

---

## License

Documentation content and source code are released under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).