import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { apiClient } from '../src/lib/apiClient';
import { networkActivityStore } from '../src/stores/network-activity-store';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('network activity global loading', () => {
  beforeEach(() => {
    networkActivityStore.getState().reset();
  });

  afterEach(() => {
    networkActivityStore.getState().reset();
  });

  it('incrementa loading al iniciar request y decrementa al resolver', async () => {
    const request = apiClient.get('/health', {
      adapter: async (config) => ({ data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config }),
    });

    expect(networkActivityStore.getState().activeRequestCount).toBe(1);
    await request;
    expect(networkActivityStore.getState().activeRequestCount).toBe(0);
  });

  it('decrementa al fallar request', async () => {
    const request = apiClient.get('/broken', {
      adapter: async (config) => {
        throw new axios.AxiosError('boom', 'ERR_BAD_RESPONSE', config, {}, { data: null, status: 500, statusText: 'ERR', headers: {}, config });
      },
    });

    expect(networkActivityStore.getState().activeRequestCount).toBe(1);
    await expect(request).rejects.toBeTruthy();
    expect(networkActivityStore.getState().activeRequestCount).toBe(0);
  });

  it('con múltiples requests no se apaga antes de tiempo', async () => {
    const reqA = deferred<{ data: { ok: boolean }; status: number; statusText: string; headers: Record<string, string>; config: unknown }>();
    const reqB = deferred<{ data: { ok: boolean }; status: number; statusText: string; headers: Record<string, string>; config: unknown }>();

    const requestA = apiClient.get('/a', { adapter: () => reqA.promise as never });
    const requestB = apiClient.get('/b', { adapter: () => reqB.promise as never });

    expect(networkActivityStore.getState().activeRequestCount).toBe(2);

    reqA.resolve({ data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config: {} });
    await requestA;
    expect(networkActivityStore.getState().activeRequestCount).toBe(1);

    reqB.resolve({ data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config: {} });
    await requestB;
    expect(networkActivityStore.getState().activeRequestCount).toBe(0);
  });

  it('no se queda pegado tras cancelación', async () => {
    const controller = new AbortController();

    const request = apiClient.get('/cancelled', {
      signal: controller.signal,
      adapter: async (config) => {
        if (config.signal?.aborted) {
          throw new axios.CanceledError('cancelled', config, null);
        }
        await new Promise((resolve) => setTimeout(resolve, 1));
        if (config.signal?.aborted) {
          throw new axios.CanceledError('cancelled', config, null);
        }
        return { data: null, status: 200, statusText: 'OK', headers: {}, config };
      },
    });

    expect(networkActivityStore.getState().activeRequestCount).toBe(1);
    controller.abort();
    await expect(request).rejects.toBeTruthy();
    expect(networkActivityStore.getState().activeRequestCount).toBe(0);
  });
});
