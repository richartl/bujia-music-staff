import { getUserWorkshops } from '@/features/settings/api/user-workshops';

export async function getWorkshops(userId: string) {
  return getUserWorkshops(userId);
}
