# TG4Travel Mail Bridge

HTTP -> SMTP bridge para enviar emails via `mail.tg4travel.com:465`.

## Deploy no Render

1. **New +** -> **Web Service** -> ligar este repositório
2. **Environment**: Node
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `SMTP_HOST` = `mail.tg4travel.com`
   - `SMTP_PORT` = `465`
   - `SMTP_SECURE` = `true`
   - `SMTP_USER` = `info@tg4travel.com`
   - `SMTP_PASS` = (a password da conta)
   - `SMTP_FROM` = `TG4Travel <info@tg4travel.com>`
   - `BRIDGE_TOKEN` = (gerar token longo aleatório, ex: `openssl rand -hex 32`)

## Endpoints

- `GET /health` -> testa ligação SMTP
- `POST /send` -> envia email
  - Header: `Authorization: Bearer <BRIDGE_TOKEN>`
  - Body JSON:
    ```json
    {
      "to": "cliente@x.com",
      "subject": "Assunto",
      "html": "<p>Olá</p>",
      "attachments": [{ "filename": "fatura.pdf", "url": "https://..." }]
    }
    ```
