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
      maxResults: 100,
    });

    const messages = res.data?.messages || [];
    if (messages.length === 0) break;

    // Apaga mais rápido (mas ainda seguro)
    await Promise.all(
      messages.map((msg: any) =>
        gmail.users.messages.trash({ userId: "me", id: msg.id! })
      )
    );

    totalDeleted += messages.length;
    nextPageToken = res.data?.nextPageToken || undefined;

    await new Promise((r) => setTimeout(r, 150)); // delay reduzido
  } while (nextPageToken);

  return totalDeleted;
}