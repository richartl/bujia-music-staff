import { http } from '@/lib/http';
import type { LoginResponse } from '@/types/auth';

export async function loginRequest(email: string, password: string) {
  const { data } = await http.post<LoginResponse>('/auth/login', { email, password });
  return data;
}
