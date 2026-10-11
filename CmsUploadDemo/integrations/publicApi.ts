export const publicApiUrl = 'https://api.github.com/repos/microsoft/PowerApps-Samples/contents/component-framework';
export interface PublicApiItem {name: string; type: string; url: string;}
export async function getPublicSamples(signal: AbortSignal): Promise<{status: number; items: PublicApiItem[]}> {
  const response = await fetch(publicApiUrl, {signal, credentials:'omit', headers:{Accept:'application/vnd.github+json'}});
  if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}. ${response.status === 403 || response.status === 429 ? 'The public API rate limit may have been reached.' : 'Try again later.'}`);
  const value: unknown = await response.json();
  if (!Array.isArray(value)) throw new Error('The API did not return a list.');
  const items = value.slice(0, 10).map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid API item.');
    const entry = item as Record<string, unknown>;
    if (typeof entry.name !== 'string' || typeof entry.type !== 'string' || typeof entry.html_url !== 'string') throw new Error('Invalid API fields.');
    if (!entry.html_url.startsWith('https://github.com/')) throw new Error('Unexpected sample link.');
    return {name:entry.name, type:entry.type, url:entry.html_url};
  });
  return {status:response.status, items};
}
