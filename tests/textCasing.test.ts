import { describe, expect, it } from 'vitest';
import { capitalizeHumanText, shouldAutoCapitalizeTextInput } from '../src/lib/textCasing';

describe('textCasing utilities', () => {
  it('capitaliza texto humano de forma legible', () => {
    expect(capitalizeHumanText('jUAN péRez de la o')).toBe('Juan Pérez De La O');
    expect(capitalizeHumanText('ajuste general - guitarra eléctrica')).toBe('Ajuste General - Guitarra Eléctrica');
  });

  it('respeta excepciones técnicas por tipo o metadata', () => {
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.name = 'email';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.name = 'password';

    const slugInput = document.createElement('input');
    slugInput.type = 'text';
    slugInput.name = 'slug';

    expect(shouldAutoCapitalizeTextInput(emailInput)).toBe(false);
    expect(shouldAutoCapitalizeTextInput(passwordInput)).toBe(false);
    expect(shouldAutoCapitalizeTextInput(slugInput)).toBe(false);
  });

  it('no modifica campos técnicos como urls/códigos y permite override explícito', () => {
    const urlInput = document.createElement('input');
    urlInput.type = 'url';

    const skuInput = document.createElement('input');
    skuInput.type = 'text';
    skuInput.name = 'sku';

    const manualOverride = document.createElement('input');
    manualOverride.type = 'text';
    manualOverride.dataset.textNormalization = 'on';
    manualOverride.name = 'sku';

    expect(shouldAutoCapitalizeTextInput(urlInput)).toBe(false);
    expect(shouldAutoCapitalizeTextInput(skuInput)).toBe(false);
    expect(shouldAutoCapitalizeTextInput(manualOverride)).toBe(true);
  });
});
