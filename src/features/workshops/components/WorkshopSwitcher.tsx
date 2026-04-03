import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkshops } from '../api/get-workshops';
import { authStore } from '@/stores/auth-store';
import { WorkshopAvatar } from '@/components/avatars/WorkshopAvatar';

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
      <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
        {isLoading ? <p className="px-2 py-1 text-xs text-slate-500">Cargando talleres...</p> : null}
        {(data || []).map((workshop) => {
          return (
            <button
              key={workshop.id}
              type="button"
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${
                workshopId === workshop.id ? 'bg-amber-50 text-amber-800' : 'hover:bg-slate-50'
              }`}
              onClick={() => setWorkshopId(workshop.id)}
              disabled={!user?.id}
            >
              <WorkshopAvatar
                name={workshop.name}
                profileImageUrl={workshop.profileImageUrl}
                logoUrl={workshop.logoUrl}
                size="sm"
              />
              <span className="truncate">{workshop.name}</span>
            </button>
          );
        })}
      </div>

      {isError ? (
        <p className="mt-2 text-xs text-red-600">
          No pude cargar los talleres para este usuario.
        </p>
      ) : null}
    </div>
  );
}
