export async function copyTextToClipboard(text: string): Promise<void> {
  if (!text.trim()) {
    throw new Error('No text to copy');
  }

  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
    throw new Error('Clipboard API unavailable');
  }

  await navigator.clipboard.writeText(text);
}
