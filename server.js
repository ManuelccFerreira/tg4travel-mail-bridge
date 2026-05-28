import express from 'express';
import nodemailer from 'nodemailer';

const app = express();
app.use(express.json({ limit: '25mb' }));

const {
  SMTP_HOST = 'mail.tg4travel.com',
  SMTP_PORT = '587',
  SMTP_SECURE = 'false',
  SMTP_USER = 'info@tg4travel.com',
  SMTP_PASS = 'rN(T;1~z2c&9',
  SMTP_FROM = 'TG4Travel <info@tg4travel.com>',
  BRIDGE_TOKEN = 'dad8d36b-543d-4b3b-93b0-a2faf03a8732dad8d36b-543d-4b3b-93b0-a2faf03a8732',
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
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

app.get('/', (_req, res) => res.json({ ok: true, service: 'tg4travel-mail-bridge' }));

// Fast health check (does NOT touch SMTP)
app.get('/health', (_req, res) => res.json({ ok: true }));

// SMTP diagnostic with hard 8s timeout
app.get('/health/smtp', async (_req, res) => {
  let done = false;
  const t = setTimeout(() => {
    if (done) return;
    done = true;
    res.status(504).json({ ok: false, error: 'verify timeout 8s' });
  }, 8000);
  try {
    await transporter.verify();
    if (done) return;
    done = true;
    clearTimeout(t);
    res.json({ ok: true });
  } catch (e) {
    if (done) return;
    done = true;
    clearTimeout(t);
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

    const mailAttachments = [];
    if (Array.isArray(attachments)) {
      for (const a of attachments) {
        if (!a) continue;
        if (a.url) {
          const ac = new AbortController();
          const at = setTimeout(() => ac.abort(), 15000);
          try {
            const r = await fetch(a.url, { signal: ac.signal });
            if (!r.ok) throw new Error(`attachment fetch ${a.url}: ${r.status}`);
            const buf = Buffer.from(await r.arrayBuffer());
            mailAttachments.push({ filename: a.filename || 'attachment.pdf', content: buf });
          } finally {
            clearTimeout(at);
          }
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
  console.log(`SMTP config: host=${SMTP_HOST} port=${SMTP_PORT} secure=${SMTP_SECURE} user=${SMTP_USER}`);
  });
