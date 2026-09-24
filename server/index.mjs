import { createApp } from './app.mjs';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';
const app = createApp();
const server = app.listen(port, host, () => {
  console.log(`PeopleOS listening on http://${host}:${port}`);
  console.log(
    `Synthetic demo mode. Optional Groq ${process.env.GROQ_API_KEY ? 'configured; mode becomes live only after a successful call' : 'not configured'}.`,
  );
});
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    server.close(() => {
      app.locals.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  });
