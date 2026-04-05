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
});
