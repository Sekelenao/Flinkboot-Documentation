import React, {useState} from 'react';
import styles from './styles.module.css';

interface CopyMarkdownButtonProps {
  markdownUrl?: string;
}

export default function CopyMarkdownButton({markdownUrl}: CopyMarkdownButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    if (!markdownUrl || loading) return;
    setLoading(true);
    try {
      const res = await fetch(markdownUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch markdown: ${res.statusText}`);
      }
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!markdownUrl) {
    return null;
  }

  return (
    <div className={styles.buttonWrapper}>
      <button
        type="button"
        onClick={handleCopy}
        className={styles.copyButton}
        title="Copy complete markdown source of this page for LLM prompts"
        aria-label="Copy page as Markdown"
      >
        <svg
          className={styles.icon}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {copied ? (
            <polyline points="20 6 9 17 4 12" />
          ) : (
            <>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </>
          )}
        </svg>
        <span>{copied ? 'Copied Markdown !' : loading ? 'Copying...' : 'Copy Markdown'}</span>
      </button>
    </div>
  );
}
