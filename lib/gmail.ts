import { google } from "googleapis";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function trashEmails(accessToken: string, query: string): Promise<number> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });

  let total = 0;
  let pageToken: string | undefined = undefined;
  const BATCH_SIZE = 50; // ajustar se necessário
  const BATCH_DELAY_MS = 600; // delay entre lotes para evitar bloqueio
  const FALLBACK_DELAY_MS = 200; // delay entre exclusões individuais no fallback

  do {
    const res: any = await gmail.users.messages.list({
      userId: "me",
      q: query + " -in:trash -in:spam",
      pageToken,
      maxResults: 100,
    });

    const messages = res.data.messages || [];
    if (messages.length === 0) break;

    // Apaga em lotes
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);
      const ids = batch.map((m: any) => m.id!);

      try {
        // Move as mensagens para a lixeira em lote usando batchModify
        await gmail.users.messages.batchModify({
          userId: "me",
          requestBody: { ids: ids, addLabelIds: ["TRASH"] }
        });
        total += ids.length;
        // pequeno delay entre lotes
        await sleep(BATCH_DELAY_MS);
      } catch (e) {
        console.error("Erro no batch, tentando individualmente...");
        // Fallback: apaga um por um
        for (const id of ids) {
          try {
            await gmail.users.messages.trash({ userId: "me", id });
            total++;
            await sleep(FALLBACK_DELAY_MS);
          } catch {}
        }
      }
    }

    pageToken = res.data.nextPageToken;
    await sleep(800); // delay seguro entre páginas

  } while (pageToken);

  return total;
}