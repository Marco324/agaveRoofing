process.env.FECHA_HOY ||= '2026-11-12';
const {startServer}=await import('../api/src/server.ts');
await startServer();
