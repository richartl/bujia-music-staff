import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkshops } from '../api/get-workshops';
import { authStore } from '@/stores/auth-store';

export function WorkshopSwitcher() {
  const user = authStore((state) => state.user);
  const workshopId = authStore((state) => state.workshopId);
  const setWorkshopId = authStore((state) => state.setWorkshopId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['workshops', user?.id],
    queryFn: () => getWorkshops(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!data || data.length === 0) return;

    const currentExists = !!workshopId && data.some((workshop) => workshop.id === workshopId);

    if (currentExists) return;

    if (data.length === 1) {
      setWorkshopId(data[0].id);
      return;
    }

    setWorkshopId(data[0].id);
  }, [data, workshopId, setWorkshopId]);

  return (
    <div className="w-full md:w-72">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Taller activo
      </label>

      <select
        className="input"
        value={workshopId || ''}
        onChange={(e) => setWorkshopId(e.target.value)}
        disabled={isLoading || !user?.id || !data?.length}
      >
        <option value="">
          {isLoading ? 'Cargando talleres...' : 'Selecciona taller'}
        </option>

        {(data || []).map((workshop) => (
          <option key={workshop.id} value={workshop.id}>
            {workshop.name}
          </option>
        ))}
      </select>

      {isError ? (
        <p className="mt-2 text-xs text-red-600">
          No pude cargar los talleres para este usuario.
        </p>
      ) : null}
    </div>
  );
}
