import { visit } from 'unist-util-visit';

/**
 * Remark plugin to rewrite internal markdown links with base path
 * Used for GitHub Pages deployment where base path is /SwapKit
 */
export function remarkRewriteLinks() {
  return (tree) => {
    const base = process.env.REFERENCES ? '/SwapKit' : '';

    if (!base) return; // Skip if no base path

    visit(tree, 'link', (node) => {
      const url = node.url;

      // Only rewrite internal links starting with /
      if (url && url.startsWith('/') && !url.startsWith('//')) {
        // Skip if already has base path
        if (!url.startsWith(base)) {
          node.url = `${base}${url}`;
        }
      }
    });
  };
}
