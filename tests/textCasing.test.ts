import { describe, expect, it } from 'vitest';
import { capitalizeHumanText, shouldAutoCapitalizeTextInput } from '../src/lib/textCasing';

describe('textCasing utilities', () => {
  it('capitaliza texto humano de forma legible', () => {
    expect(capitalizeHumanText('jUAN péRez de la o')).toBe('Juan Pérez De La O');
    expect(capitalizeHumanText('ajuste general - guitarra eléctrica')).toBe('Ajuste General - Guitarra Eléctrica');
  });

  it('permite capitalización por tipo y respeta opt-out explícito para campos sensibles', () => {
    const emailInput = document.createElement('input');
    emailInput.type = 'email';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';

    const loginEmailInput = document.createElement('input');
    loginEmailInput.type = 'email';
    loginEmailInput.dataset.textNormalization = 'off';

    const loginPasswordInput = document.createElement('input');
    loginPasswordInput.type = 'password';
    loginPasswordInput.dataset.textNormalization = 'off';

    expect(shouldAutoCapitalizeTextInput(emailInput)).toBe(true);
    expect(shouldAutoCapitalizeTextInput(passwordInput)).toBe(true);
    expect(shouldAutoCapitalizeTextInput(loginEmailInput)).toBe(false);
    expect(shouldAutoCapitalizeTextInput(loginPasswordInput)).toBe(false);
  });

  it('mantiene capitalización en inputs de texto normales', () => {
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.name = 'name';

    expect(shouldAutoCapitalizeTextInput(nameInput)).toBe(true);
  });

  it('permite override explícito para apagar/encender normalización', () => {
    const urlInput = document.createElement('input');
    urlInput.type = 'url';

    const manualOff = document.createElement('input');
    manualOff.type = 'text';
    manualOff.dataset.textNormalization = 'off';

    const manualOverride = document.createElement('input');
    manualOverride.type = 'text';
    manualOverride.dataset.textNormalization = 'on';

    expect(shouldAutoCapitalizeTextInput(urlInput)).toBe(true);
    expect(shouldAutoCapitalizeTextInput(manualOff)).toBe(false);
    expect(shouldAutoCapitalizeTextInput(manualOverride)).toBe(true);
  });
});
