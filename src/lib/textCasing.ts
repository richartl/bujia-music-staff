const TECHNICAL_FIELD_KEYWORDS = [
  'email',
  'password',
  'slug',
  'url',
  'uri',
  'sku',
  'serial',
  'token',
  'code',
  'username',
  'userid',
  'handle',
  'instagram',
];

const EXCLUDED_INPUT_TYPES = new Set(['email', 'password', 'url']);
const TEXTUAL_INPUT_TYPES = new Set(['', 'text', 'search']);

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
}

export function capitalizeHumanText(value: string): string {
  return value.replace(/[^\s]+/g, (chunk) =>
    chunk.replace(/\p{L}[\p{L}\p{M}'’-]*/gu, (word) => capitalizeWord(word)),
  );
}

export function shouldAutoCapitalizeTextInput(element: HTMLInputElement | HTMLTextAreaElement): boolean {
  if (element.disabled || element.readOnly) return false;

  const override = element.dataset.textNormalization;
  if (override === 'off') return false;
  if (override === 'on') return true;

  if (element instanceof HTMLInputElement) {
    const normalizedType = (element.type || '').toLowerCase();
    if (!TEXTUAL_INPUT_TYPES.has(normalizedType)) return false;
    if (EXCLUDED_INPUT_TYPES.has(normalizedType)) return false;
  }

  const technicalHint = `${element.name} ${element.id} ${element.autocomplete}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  if (!technicalHint) return true;

  return !TECHNICAL_FIELD_KEYWORDS.some((keyword) => technicalHint.includes(keyword));
}
