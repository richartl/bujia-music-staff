# Staff Platform

Scaffold inicial para el frontend de operación del taller.

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Zustand
- Axios
- Docker / Docker Compose

## Objetivo
Este frontend está pensado para el personal del taller que:
- recibe instrumentos
- busca clientes
- crea ingresos/visitas
- cambia estatus rápido
- agrega notas
- consulta órdenes activas

## Scripts
```bash
npm install
npm run dev
npm run build
npm run preview
```

## Docker dev
```bash
docker compose up --build
```

App: http://localhost:5173

## Variables de entorno
Copia `.env.example` a `.env`.

## Rutas iniciales
- `/login`
- `/app`
- `/app/intakes`
- `/app/visits`
- `/app/visits/:visitId`
- `/app/catalogs`
- `/app/settings`

## Decisiones de arquitectura
- SPA rápida para operación interna
- Store global mínima con Zustand
- Datos remotos con React Query
- Layout responsive mobile-first
- Componentes pensados para uso rápido en recepción


## Docker producción (Cloud Run)
Este proyecto ahora se construye como estático y se sirve con **nginx** en el puerto **8080** (requerido por Cloud Run).

```bash
docker build -t staff-platform .
docker run --rm -p 8080:8080 staff-platform
```

App: http://localhost:8080


### Variables en runtime (Cloud Run)
En producción, `VITE_API_BASE_URL` y `VITE_APP_NAME` se leen en **runtime** desde `env-config.js` (servido desde `/tmp`), generado al arrancar el contenedor.  
Así, no quedan fijas en build time.

Ejemplo local:
```bash
docker run --rm -p 8080:8080 \
  -e VITE_API_BASE_URL="https://api.tu-dominio.com" \
  -e VITE_APP_NAME="Staff Platform" \
  staff-platform
```

> Nota: el error `Blocked request... add host to server.allowedHosts in vite.config` aparece cuando se ejecuta el servidor de desarrollo de Vite en producción. En Cloud Run debe usarse la imagen de producción (build + nginx), no `npm run dev`.


## Puertos dev vs producción
- **Desarrollo local (Vite):** `5173` (`npm run dev`).
- **Contenedor de producción:** `8080` (nginx dentro del contenedor).
- **Cloud Run:** recibe tráfico HTTPS por su URL pública y lo enruta al puerto interno del contenedor (normalmente `8080`).

En otras palabras: no hay conflicto; son contextos distintos. En local puedes seguir usando `5173`, y en Cloud Run el contenedor debe escuchar en `8080`.
