import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Configure et retourne un transporteur de mail SMTP.
 * L'initialisation est différée pour ne pas faire échouer le build.
 */
export function getEmailTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !smtpFrom) {
    throw new Error(
      "Variables d'environnement SMTP manquantes : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM sont requises."
    );
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  return transporter;
}

/**
 * Envoie un email à un destinataire.
 */
export async function sendEmail(to, subject, html) {
  const transporter = getEmailTransporter();
  const smtpFrom = process.env.SMTP_FROM;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie un email à plusieurs destinataires.
 */
export async function sendBulkEmail(recipients, subject, html) {
  const transporter = getEmailTransporter();
  const smtpFrom = process.env.SMTP_FROM;

  const results = [];
  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: recipient,
        subject,
        html,
      });
      results.push({ email: recipient, success: true });
    } catch (error) {
      console.error(`Erreur lors de l'envoi à ${recipient}:`, error);
      results.push({ email: recipient, success: false, error: error.message });
    }
  }

  return results;
}
