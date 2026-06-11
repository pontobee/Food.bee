import { Client } from "pg";

// Abre uma conexão PG dedicada (fora do pool) para LISTEN/NOTIFY.
// Pool connections são retornadas ao pool entre queries — LISTEN exige
// conexão persistente. Por isso usamos pg.Client diretamente.
export async function createNotifyClient(channel: string, onNotify: (payload: string) => void) {
  const client = new Client({ connectionString: process.env.DIRECT_DATABASE_URL });
  await client.connect();
  await client.query(`LISTEN "${channel}"`);
  client.on("notification", (msg) => {
    if (msg.channel === channel && msg.payload) onNotify(msg.payload);
  });
  return client;
}
