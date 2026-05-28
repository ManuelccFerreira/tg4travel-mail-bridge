import express from 'express';
import nodemailer from 'nodemailer';

const app = express();
app.use(express.json({ limit: '25mb' }));

const {
  SMTP_HOST = 'mail.tg4travel.com',
  SMTP_PORT = '587',
  SMTP_SECURE = 'false',
  SMTP_USER = info@tg4travel.com
  SMTP_PASS = rN(T;1~z2c&9
  SMTP_FROM, = TG4Travel <info@tg4travel.com>
  BRIDGE_TOKEN = dad8d36b-543d-4b3b-93b0-a2faf03a8732dad8d36b-543d-4b3b-93b0-a2faf03a8732
  PORT = '10000',
} = process.env;

if (!SMTP_USER || !SMTP_PASS || !BRIDGE_TOKEN) {
  console.error('Missing required env: SMTP_USER, SMTP_PASS, BRIDGE_TOKEN');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE === 'true',
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

app.get('/', (_req, res) => res.json({ ok: true, service: 'tg4travel-mail-bridge' }));

app.get('/health', async (_req, res) => {
  try {
    await transporter.verify();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post('/send', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token !== BRIDGE_TOKEN) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const { to, cc, bcc, subject, html, text, replyTo, attachments } = req.body || {};
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ ok: false, error: 'missing to/subject/body' });
    }

    // attachments: [{ filename, url }] or [{ filename, content (base64) }]
    const mailAttachments = [];
    if (Array.isArray(attachments)) {
      for (const a of attachments) {
        if (!a) continue;
        if (a.url) {
          const r = await fetch(a.url);
          if (!r.ok) throw new Error(`attachment fetch ${a.url}: ${r.status}`);
          const buf = Buffer.from(await r.arrayBuffer());
          mailAttachments.push({ filename: a.filename || 'attachment.pdf', content: buf });
        } else if (a.content) {
          mailAttachments.push({
            filename: a.filename || 'attachment.bin',
            content: Buffer.from(a.content, 'base64'),
          });
        }
      }
    }

    const info = await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to, cc, bcc, subject, html, text, replyTo,
      attachments: mailAttachments,
    });

    res.json({ ok: true, messageId: info.messageId });
  } catch (e) {
    console.error('[send] error', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.listen(Number(PORT), () => {
  console.log(`bridge listening on ${PORT}`);
});
