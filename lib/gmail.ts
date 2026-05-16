import { google } from "googleapis";

export async function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export async function trashEmails(accessToken: string, query: string): Promise<number> {
  const gmail = await getGmailClient(accessToken);
  let nextPageToken: string | undefined = undefined;
  let totalDeleted = 0;

  do {
    const res: any = await gmail.users.messages.list({
      userId: "me",
      q: query,
      pageToken: nextPageToken,
      maxResults: 50,        // reduzimos pra ficar mais estável
    });

    const messages = res.data?.messages || [];
    if (messages.length === 0) break;

    // Apaga devagar (importante!)
    for (const msg of messages) {
      await gmail.users.messages.trash({ userId: "me", id: msg.id! });
      totalDeleted++;
      await new Promise((r) => setTimeout(r, 400)); // delay maior
    }

    nextPageToken = res.data?.nextPageToken || undefined;

  } while (nextPageToken);

  return totalDeleted;
}