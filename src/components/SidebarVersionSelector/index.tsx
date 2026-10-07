import React from 'react';
import {useHistory} from '@docusaurus/router';
import {
  useVersions,
  useActiveDocContext,
} from '@docusaurus/plugin-content-docs/client';
import styles from './styles.module.css';

export default function SidebarVersionSelector(): React.ReactNode {
  const history = useHistory();
  const versions = useVersions(undefined);
  const {activeVersion, alternateDocVersions} = useActiveDocContext(undefined);

  if (!versions || versions.length === 0) {
    return null;
  }

  const currentVersionName = activeVersion?.name ?? versions[0].name;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetVersionName = e.target.value;
    const targetVersion = versions.find((v) => v.name === targetVersionName);
    if (!targetVersion) {
      return;
    }

    const alternateDoc = alternateDocVersions?.[targetVersionName];
    if (alternateDoc) {
      history.push(alternateDoc.path);
    } else {
      history.push(targetVersion.path);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.labelWrapper}>
        <span className={styles.label}>Target Version</span>
      </div>
      <div className={styles.selectWrapper}>
        <select
          id="sidebar-version-picker"
          aria-label="Select documentation version"
          value={currentVersionName}
          onChange={handleChange}
          className={styles.select}
        >
          {versions.map((version) => (
            <option key={version.name} value={version.name}>
              {version.label}
            </option>
          ))}
        </select>
        <span className={styles.arrow} aria-hidden="true">
          ▼
        </span>
      </div>
    </div>
  );
}
