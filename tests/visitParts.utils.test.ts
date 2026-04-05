import { describe, expect, it } from 'vitest';
import {
  normalizeVisitPartPayload,
  normalizeWorkshopPartPayload,
  validateVisitPartForm,
  validateWorkshopPartForm,
} from '../src/features/visits/utils/visitParts';

describe('visitParts utils', () => {
  it('valida manual o catálogo', () => {
    const error = validateVisitPartForm({
      workshopPartId: '',
      name: '',
      quantity: '1',
      unitPrice: '100',
      unitCost: '',
      notes: '',
      visitServiceId: '',
    });
    expect(error).toContain('catálogo');
  });

  it('normaliza payload de visita', () => {
    const payload = normalizeVisitPartPayload({
      workshopPartId: 'part-1',
      name: 'Ignorado',
      quantity: '2',
      unitPrice: '350',
      unitCost: '120',
      notes: ' ok ',
      visitServiceId: 'service-1',
    });

    expect(payload).toEqual({
      workshopPartId: 'part-1',
      name: undefined,
      quantity: 2,
      unitPrice: 350,
      unitCost: 120,
      notes: 'ok',
      visitServiceId: 'service-1',
    });
  });

  it('valida catálogo de taller', () => {
    const error = validateWorkshopPartForm({
      name: '',
      listPrice: '-1',
      publicPrice: '100',
      description: '',
      sku: '',
      brand: '',
      isActive: true,
    });
    expect(error).toBe('El nombre es obligatorio');

    const payload = normalizeWorkshopPartPayload({
      name: ' Cejuela ',
      listPrice: '80',
      publicPrice: '120',
      description: ' d ',
      sku: ' SKU-1 ',
      brand: ' Bone ',
      isActive: false,
    });
    expect(payload).toEqual({
      name: 'Cejuela',
      listPrice: 80,
      publicPrice: 120,
      description: 'd',
      sku: 'SKU-1',
      brand: 'Bone',
      isActive: false,
    });
  });
});
