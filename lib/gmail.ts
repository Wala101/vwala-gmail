import { google } from "googleapis";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function trashEmails(accessToken: string, query: string): Promise<{ totalDeleted: number; message: string }> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });

  let deleted = 0;
  let pageToken: string | undefined = undefined;
  let attempts = 0;
  const MAX_ATTEMPTS = 8;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    try {
      do {
        const res: any = await gmail.users.messages.list({
          userId: "me",
          q: query + " -in:trash -in:spam",
          pageToken,
          maxResults: 100,
        });

        const messages = res.data.messages || [];
        if (messages.length === 0) break;

        for (let i = 0; i < messages.length; i += 50) {
          const batch = messages.slice(i, i + 50);
          const ids = batch.map((m: any) => m.id!);

          try {
            await gmail.users.messages.batchModify({
              userId: "me",
              requestBody: { ids, addLabelIds: ["TRASH"] }
            });
            deleted += ids.length;
          } catch {
            // fallback individual
            for (const id of ids) {
              try {
                await gmail.users.messages.trash({ userId: "me", id });
                deleted++;
              } catch {}
            }
          }
          await sleep(150);
        }

        pageToken = res.data.nextPageToken;
        await sleep(300);

      } while (pageToken);

      // Se chegou aqui sem erro fatal, terminou com sucesso
      return { 
        totalDeleted: deleted, 
        message: `✅ Concluído! ${deleted} e-mails movidos para a lixeira.` 
      };

    } catch (err) {
      console.log(`Tentativa ${attempts} falhou, tentando novamente...`);
      await sleep(2000); // espera 2s antes de tentar de novo
    }
  }

  // Se chegou aqui, deu erro várias vezes
  return { 
    totalDeleted: deleted, 
    message: `⚠️ Processo finalizado com ${deleted} e-mails apagados (pode ter parado por limite de tempo).` 
  };
}