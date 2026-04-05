import { describe, expect, it } from 'vitest';
import { catalogsQueryKeys } from '../src/features/catalogs/queryKeys';

describe('catalogsQueryKeys', () => {
  it('define keys por recurso con workshopId y detail separados', () => {
    expect(catalogsQueryKeys.colors.workshopList('w1')).toEqual(['catalogs', 'colors', 'workshop', 'w1', 'list']);
    expect(catalogsQueryKeys.colors.workshopDetail('w1', 'c1')).toEqual(['catalogs', 'colors', 'workshop', 'w1', 'detail', 'c1']);
    expect(catalogsQueryKeys.brands.globalList()).toEqual(['catalogs', 'brands', 'global', 'list']);
    expect(catalogsQueryKeys.serviceStatuses.detail('w1', 'ss1')).toEqual(['catalogs', 'service-statuses', 'w1', 'detail', 'ss1']);
  });

  it('workshop parts separa listas por filtro y soporta all/active/inactive', () => {
    expect(catalogsQueryKeys.workshopParts.list('w1')).toEqual(['catalogs', 'workshop-parts', 'w1', 'list', 'all']);
    expect(catalogsQueryKeys.workshopParts.list('w1', true)).toEqual(['catalogs', 'workshop-parts', 'w1', 'list', 'active']);
    expect(catalogsQueryKeys.workshopParts.list('w1', false)).toEqual(['catalogs', 'workshop-parts', 'w1', 'list', 'inactive']);
  });

  it('instrument types define base/list/detail por workshop', () => {
    expect(catalogsQueryKeys.instrumentTypes.base('w1')).toEqual(['catalogs', 'instrument-types', 'w1']);
    expect(catalogsQueryKeys.instrumentTypes.list('w1')).toEqual(['catalogs', 'instrument-types', 'w1', 'list']);
    expect(catalogsQueryKeys.instrumentTypes.detail('w1', 'it1')).toEqual(['catalogs', 'instrument-types', 'w1', 'detail', 'it1']);
  });

  it('users incluye base, list con paginación/filtros y detail', () => {
    expect(catalogsQueryKeys.users.workshopBase('w1')).toEqual(['catalogs', 'users', 'workshop', 'w1']);
    expect(catalogsQueryKeys.users.workshopList('w1', { page: 2, limit: 10, search: 'maria', role: 'ADMIN' })).toEqual([
      'catalogs',
      'users',
      'workshop',
      'w1',
      'list',
      2,
      10,
      'maria',
      'ADMIN',
    ]);
    expect(catalogsQueryKeys.users.workshopDetail('w1', 'u1')).toEqual(['catalogs', 'users', 'workshop', 'w1', 'detail', 'u1']);
  });
});
