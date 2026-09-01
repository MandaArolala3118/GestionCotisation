import { google } from 'googleapis';

let gmailClient = null;

/**
 * Configure et retourne le client Gmail API.
 * L'initialisation est différée pour ne pas faire échouer le build.
 */
export function getGmailClient() {
  if (gmailClient) return gmailClient;

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const email = process.env.GMAIL_EMAIL;

  if (!clientId || !clientSecret || !refreshToken || !email) {
    throw new Error(
      "Variables d'environnement Gmail manquantes : GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_EMAIL sont requises."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  gmailClient = google.gmail({
    version: 'v1',
    auth: oauth2Client,
  });

  return gmailClient;
}

/**
 * Encode un email en format base64 pour l'API Gmail.
 */
function encodeEmail(to, from, subject, html) {
  const email = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    html,
  ].join('\r\n');

  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Envoie un email à un destinataire via l'API Gmail.
 */
export async function sendEmail(to, subject, html) {
  const gmail = getGmailClient();
  const email = process.env.GMAIL_EMAIL;

  try {
    const encodedEmail = encodeEmail(to, email, subject, html);
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie un email à plusieurs destinataires via l'API Gmail.
 */
export async function sendBulkEmail(recipients, subject, html) {
  const results = [];
  for (const recipient of recipients) {
    const result = await sendEmail(recipient, subject, html);
    results.push({ email: recipient, ...result });
  }

  return results;
}
