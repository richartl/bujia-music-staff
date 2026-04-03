import { describe, expect, it } from 'vitest';
import {
  normalizePaymentPayload,
  toDatetimeLocalValue,
  validateVisitPaymentForm,
} from '../src/features/visits/utils/visitPayments';

describe('visitPayments utils', () => {
  it('normaliza payload usando método de catálogo', () => {
    const payload = normalizePaymentPayload({
      amount: '450',
      paymentMethodId: 'cash-id',
      method: 'Transferencia',
      paidAt: '2026-04-03T10:15',
      notes: '  anticipo  ',
    });

    expect(payload.amount).toBe(450);
    expect(payload.paymentMethodId).toBe('cash-id');
    expect(payload.method).toBeUndefined();
    expect(payload.notes).toBe('anticipo');
    expect(payload.paidAt).toBe('2026-04-03T10:15:00.000Z');
  });

  it('requiere método de pago en create', () => {
    const error = validateVisitPaymentForm(
      {
        amount: '250',
        paymentMethodId: '',
        method: '',
        paidAt: '',
        notes: '',
      },
      { mode: 'create' },
    );

    expect(error).toBe('Selecciona un método de pago o captura uno manual.');
  });

  it('monto debe ser mayor a cero', () => {
    const error = validateVisitPaymentForm(
      {
        amount: '0',
        paymentMethodId: 'cash-id',
        method: '',
        paidAt: '',
        notes: '',
      },
      { mode: 'create' },
    );

    expect(error).toBe('Captura un monto mayor a 0.');
  });

  it('convierte ISO a datetime-local', () => {
    expect(toDatetimeLocalValue('2026-04-03T18:30:00.000Z')).toBe('2026-04-03T18:30');
  });
});
