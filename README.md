# TG4Travel Mail Bridge

HTTP -> SMTP bridge para enviar emails via `mail.tg4travel.com:465`.

## Deploy no Render

1. **New +** -> **Web Service** -> ligar este repositório
2. **Environment**: Node
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `SMTP_HOST` = `mail.tg4travel.com`
   - `SMTP_PORT` = `587`
   - `SMTP_SECURE` = `false`
   - `SMTP_USER` = `info@tg4travel.com`
   - `SMTP_PASS` = `rN(T;1~z2c&9`
   - `SMTP_FROM` = `TG4Travel <info@tg4travel.com>`
   - `BRIDGE_TOKEN` = `dad8d36b-543d-4b3b-93b0-a2faf03a8732dad8d36b-543d-4b3b-93b0-a2faf03a8732`

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
