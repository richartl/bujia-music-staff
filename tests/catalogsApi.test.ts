import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '../src/lib/http';
import {
  createAffiliate,
  createGlobalBrand,
  createGlobalColor,
  createStringGauge,
  createTuning,
  createWorkshopBrand,
  createWorkshopColor,
  createWorkshopPart,
  createWorkshopService,
  createWorkshopUser,
  createWorkshopServiceStatus,
  createWorkshopVisitStatus,
  deleteAffiliate,
  deleteGlobalBrand,
  deleteGlobalColor,
  deleteStringGauge,
  deleteTuning,
  deleteWorkshopBrand,
  deleteWorkshopColor,
  deleteWorkshopService,
  deleteWorkshopServiceStatus,
  deleteWorkshopVisitStatus,
  getAffiliateById,
  getAffiliates,
  getGlobalBrandById,
  getGlobalBrands,
  getGlobalColorById,
  getGlobalColors,
  getStringGaugeById,
  getStringGauges,
  getTuningById,
  getTunings,
  getWorkshopBrandById,
  getWorkshopBrands,
  getWorkshopColorById,
  getWorkshopColors,
  getWorkshopPartById,
  getWorkshopParts,
  getWorkshopServiceById,
  getWorkshopServices,
  getWorkshopServiceStatusById,
  getWorkshopServiceStatuses,
  getWorkshopUserById,
  getWorkshopUsers,
  getWorkshopVisitStatusById,
  getWorkshopVisitStatuses,
  updateAffiliate,
  updateGlobalBrand,
  updateGlobalColor,
  updateStringGauge,
  updateTuning,
  updateUserProfileImage,
  updateWorkshopBrand,
  updateWorkshopColor,
  updateWorkshopPart,
  updateWorkshopService,
  updateWorkshopServiceStatus,
  updateWorkshopUser,
  updateWorkshopVisitStatus,
} from '../src/features/catalogs/api/catalogsApi';

vi.mock('../src/lib/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('catalogsApi endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(http.get).mockResolvedValue({ data: {} } as never);
    vi.mocked(http.post).mockResolvedValue({ data: {} } as never);
    vi.mocked(http.patch).mockResolvedValue({ data: {} } as never);
    vi.mocked(http.delete).mockResolvedValue({} as never);
  });

  it('colors soporta workshop y global', async () => {
    await getWorkshopColors('w1');
    await getWorkshopColorById('w1', 'c1');
    await createWorkshopColor('w1', { name: 'Negro', slug: 'negro' });
    await updateWorkshopColor('w1', 'c1', { name: 'Azul' });
    await deleteWorkshopColor('w1', 'c1');
    await getGlobalColors();
    await getGlobalColorById('gc1');
    await createGlobalColor({ name: 'Rojo', slug: 'rojo' });
    await updateGlobalColor('gc1', { hex: '#ff0000' });
    await deleteGlobalColor('gc1');

    expect(http.get).toHaveBeenCalledWith('/workshops/w1/colors');
    expect(http.get).toHaveBeenCalledWith('/workshops/w1/colors/c1');
    expect(http.post).toHaveBeenCalledWith('/workshops/w1/colors', { name: 'Negro', slug: 'negro' });
    expect(http.patch).toHaveBeenCalledWith('/workshops/w1/colors/c1', { name: 'Azul' });
    expect(http.delete).toHaveBeenCalledWith('/workshops/w1/colors/c1');
    expect(http.get).toHaveBeenCalledWith('/global-colors');
    expect(http.get).toHaveBeenCalledWith('/global-colors/gc1');
    expect(http.post).toHaveBeenCalledWith('/global-colors', { name: 'Rojo', slug: 'rojo' });
    expect(http.patch).toHaveBeenCalledWith('/global-colors/gc1', { hex: '#ff0000' });
    expect(http.delete).toHaveBeenCalledWith('/global-colors/gc1');
  });

  it('brands soporta workshop y global', async () => {
    await getWorkshopBrands('w1');
    await getWorkshopBrandById('w1', 'b1');
    await createWorkshopBrand('w1', { name: 'Fender', slug: 'fender' });
    await updateWorkshopBrand('w1', 'b1', { isActive: false });
    await deleteWorkshopBrand('w1', 'b1');
    await getGlobalBrands();
    await getGlobalBrandById('gb1');
    await createGlobalBrand({ name: 'Gibson', slug: 'gibson' });
    await updateGlobalBrand('gb1', { isActive: true });
    await deleteGlobalBrand('gb1');

    expect(http.get).toHaveBeenCalledWith('/workshops/w1/brands');
    expect(http.get).toHaveBeenCalledWith('/workshops/w1/brands/b1');
    expect(http.post).toHaveBeenCalledWith('/workshops/w1/brands', { name: 'Fender', slug: 'fender' });
    expect(http.patch).toHaveBeenCalledWith('/workshops/w1/brands/b1', { isActive: false });
    expect(http.delete).toHaveBeenCalledWith('/workshops/w1/brands/b1');
    expect(http.get).toHaveBeenCalledWith('/global-brands');
    expect(http.get).toHaveBeenCalledWith('/global-brands/gb1');
    expect(http.post).toHaveBeenCalledWith('/global-brands', { name: 'Gibson', slug: 'gibson' });
    expect(http.patch).toHaveBeenCalledWith('/global-brands/gb1', { isActive: true });
    expect(http.delete).toHaveBeenCalledWith('/global-brands/gb1');
  });

  it('usa endpoints reales para status, parts, services, tunings, gauges, affiliates y users profile-image', async () => {
    await getWorkshopVisitStatuses('w1');
    await getWorkshopVisitStatusById('w1', 'vs1');
    await createWorkshopVisitStatus('w1', { code: 'NEW', name: 'Nueva' });
    await updateWorkshopVisitStatus('w1', 'vs1', { isTerminal: true });
    await deleteWorkshopVisitStatus('w1', 'vs1');

    await getWorkshopServiceStatuses('w1');
    await getWorkshopServiceStatusById('w1', 'ss1');
    await createWorkshopServiceStatus('w1', { code: 'PROC', name: 'Proceso' });
    await updateWorkshopServiceStatus('w1', 'ss1', { isActive: true });
    await deleteWorkshopServiceStatus('w1', 'ss1');

    await getWorkshopParts('w1', { isActive: true });
    await getWorkshopPartById('w1', 'p1');
    await createWorkshopPart('w1', { name: 'Cejuela', listPrice: 10, publicPrice: 12 });
    await updateWorkshopPart('w1', 'p1', { publicPrice: 15 });

    await getWorkshopServices('w1');
    await getWorkshopServiceById('w1', 'svc1');
    await createWorkshopService('w1', { name: 'Ajuste', slug: 'ajuste' });
    await updateWorkshopService('w1', 'svc1', { isAdjust: true });
    await deleteWorkshopService('w1', 'svc1');

    await getTunings('w1');
    await getTuningById('w1', 't1');
    await createTuning('w1', { name: 'Drop D', slug: 'drop-d' });
    await updateTuning('w1', 't1', { isActive: false });
    await deleteTuning('w1', 't1');

    await getStringGauges('w1');
    await getStringGaugeById('w1', 'sg1');
    await createStringGauge('w1', { name: '10-46', slug: '10-46' });
    await updateStringGauge('w1', 'sg1', { value: '10-46' });
    await deleteStringGauge('w1', 'sg1');

    await getAffiliates('w1');
    await getAffiliateById('w1', 'a1');
    await createAffiliate('w1', { name: 'Band X', type: 'BAND', code: 'BX' });
    await updateAffiliate('w1', 'a1', { notes: 'VIP' });
    await deleteAffiliate('w1', 'a1');

    await updateUserProfileImage('u1', { mediaId: 'media-1' });
    await getWorkshopUsers('w1', { page: 1, limit: 20, search: 'maria', role: 'STAFF' });
    await getWorkshopUserById('w1', 'u1');
    await createWorkshopUser('w1', { name: 'María Pérez', email: 'maria@bujia.com', password: '12345678', role: 'STAFF' });
    await updateWorkshopUser('w1', 'u1', { name: 'María P.', email: 'maria.p@bujia.com', role: 'ADMIN' });

    expect(http.get).toHaveBeenCalledWith('/workshops/w1/workshop-visit-statuses');
    expect(http.get).toHaveBeenCalledWith('/workshops/w1/service-statuses');
    expect(http.get).toHaveBeenCalledWith('/workshops/w1/parts', { params: { isActive: true } });
    expect(http.get).toHaveBeenCalledWith('/workshops/w1/workshop-services');
    expect(http.get).toHaveBeenCalledWith('/workshops/w1/tunings');
    expect(http.get).toHaveBeenCalledWith('/workshops/w1/string-gauges');
    expect(http.get).toHaveBeenCalledWith('/workshops/w1/affiliates');
    expect(http.patch).toHaveBeenCalledWith('/users/u1/profile-image', { mediaId: 'media-1' });
    expect(http.get).toHaveBeenCalledWith('/workshops/w1/users', { params: { page: 1, limit: 20, search: 'maria', role: 'STAFF' } });
    expect(http.get).toHaveBeenCalledWith('/workshops/w1/users/u1');
    expect(http.post).toHaveBeenCalledWith('/workshops/w1/users', { name: 'María Pérez', email: 'maria@bujia.com', password: '12345678', role: 'STAFF' });
    expect(http.patch).toHaveBeenCalledWith('/workshops/w1/users/u1', { name: 'María P.', email: 'maria.p@bujia.com', role: 'ADMIN' });
  });
});
