import { google } from "googleapis";

export async function trashEmails(accessToken: string, query: string): Promise<number> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });

  let total = 0;
  let pageToken: string | undefined = undefined;

  do {
    const res: any = await gmail.users.messages.list({
      userId: "me",
      q: query + " -in:trash -in:spam",
      pageToken,
      maxResults: 100,
    });

    const messages = res.data.messages || [];
    if (messages.length === 0) break;

    // Apaga um por um (mais estável)
    for (const msg of messages) {
      try {
        await gmail.users.messages.trash({
          userId: "me",
          id: msg.id!
        });
        total++;
      } catch (e) {
        console.error("Erro ao apagar mensagem:", msg.id);
      }
    }

    pageToken = res.data.nextPageToken;
    await new Promise(r => setTimeout(r, 80)); // delay leve

  } while (pageToken);

  return total;
}