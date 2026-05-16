import { google } from "googleapis";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function trashEmails(
  accessToken: string,
  query: string,
  options?: { maxRunTimeMs?: number; batchSize?: number; batchDelayMs?: number; fallbackDelayMs?: number }
): Promise<{ totalDeleted: number; totalFailed: number; errors: string[] }> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });

  let deleted = 0;
  let failed = 0;
  let pageToken: string | undefined = undefined;
  const BATCH_SIZE = options?.batchSize ?? 50; // ajustar se necessário
  const BATCH_DELAY_MS = options?.batchDelayMs ?? 600; // delay entre lotes para evitar bloqueio
  const FALLBACK_DELAY_MS = options?.fallbackDelayMs ?? 200; // delay entre exclusões individuais no fallback
  const errors: string[] = [];

  const start = Date.now();
  const maxRun = options?.maxRunTimeMs ?? 0; // 0 = sem limite

  try {
    do {
      // interrompe se tempo excedido (quando >0)
      if (maxRun > 0 && Date.now() - start > maxRun) {
        console.warn(`Limite de tempo de ${maxRun}ms atingido, retornando parcial (${deleted})`);
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
        deleted += ids.length;
        // pequeno delay entre lotes
        await sleep(BATCH_DELAY_MS);
      } catch (e: any) {
        console.error("Erro no batch, tentando individualmente...", e?.message || e);
        errors.push(`batchModify failed for ids[0]=${ids[0]}: ${e?.message || String(e)}`);
        // Fallback: apaga um por um
        for (const id of ids) {
          try {
            await gmail.users.messages.trash({ userId: "me", id });
            deleted++;
            await sleep(FALLBACK_DELAY_MS);
          } catch (ee: any) {
            // se falhar individualmente, registre e continue
            failed++;
            errors.push(`failed to trash id=${id}: ${ee?.message || String(ee)}`);
          }
        }
      }
    }

      pageToken = res.data.nextPageToken;
      await sleep(800); // delay seguro entre páginas

    } while (pageToken);
  } catch (err: any) {
    console.error('Erro durante limpeza (retornando total parcial):', err?.message || err);
    errors.push(`fatal: ${err?.message || String(err)}`);
  }

  return { totalDeleted: deleted, totalFailed: failed, errors };
}