import { google } from "googleapis";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function trashEmails(
  accessToken: string,
  query: string,
  options?: { maxRunTimeMs?: number; batchSize?: number; batchDelayMs?: number; fallbackDelayMs?: number }
): Promise<{ totalDeleted: number; totalFailed: number; message: string }> {
  
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });

  let deleted = 0;
  let failed = 0;
  let pageToken: string | undefined = undefined;
  const BATCH_SIZE = options?.batchSize ?? 50;
  const BATCH_DELAY_MS = options?.batchDelayMs ?? 600;
  const FALLBACK_DELAY_MS = options?.fallbackDelayMs ?? 200;
  const MAX_RUN_TIME = options?.maxRunTimeMs ?? 25 * 60 * 1000; // 25 minutos máximo

  const startTime = Date.now();
  const errors: string[] = [];
  let retries = 0;
  const MAX_RETRIES = 5;

  console.log(`Iniciando limpeza com query: ${query}`);

  try {
    do {
      if (Date.now() - startTime > MAX_RUN_TIME) {
        console.warn("Tempo máximo atingido. Parando com total parcial.");
        break;
      }

      const res: any = await gmail.users.messages.list({
        userId: "me",
        q: query + " -in:trash -in:spam",
        pageToken,
        maxResults: 100,
      });

      const messages = res.data.messages || [];
      if (messages.length === 0) break;

      // Processa em lotes
      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batch = messages.slice(i, i + BATCH_SIZE);
        const ids = batch.map((m: any) => m.id!);

        try {
          await gmail.users.messages.batchModify({
            userId: "me",
            requestBody: { ids: ids, addLabelIds: ["TRASH"] }
          });
          deleted += ids.length;
          await sleep(BATCH_DELAY_MS);
        } catch (e: any) {
          errors.push(`Batch falhou, tentando individualmente...`);
          // Fallback individual
          for (const id of ids) {
            let success = false;
            for (let attempt = 0; attempt < 3; attempt++) { // 3 tentativas por email
              try {
                await gmail.users.messages.trash({ userId: "me", id });
                deleted++;
                success = true;
                break;
              } catch {
                await sleep(FALLBACK_DELAY_MS);
              }
            }
            if (!success) failed++;
          }
          await sleep(300);
        }
      }

      pageToken = res.data.nextPageToken;
      await sleep(400);

    } while (pageToken);

  } catch (err: any) {
    console.error("Erro fatal na limpeza:", err);
    errors.push(`Erro fatal: ${err.message}`);
    
    // Tenta reiniciar uma vez se falhar
    if (retries < MAX_RETRIES) {
      retries++;
      console.log(`Tentativa ${retries} de reinício...`);
      await sleep(2000);
      return trashEmails(accessToken, query, options); // recursão para reiniciar
    }
  }

  const message = `✅ Concluído! ${deleted} e-mails movidos para a lixeira.` +
                 (failed > 0 ? ` (${failed} falharam)` : "");

  return { 
    totalDeleted: deleted, 
    totalFailed: failed, 
    message 
  };
}