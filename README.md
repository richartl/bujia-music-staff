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
