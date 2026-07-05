# Password Manager Project Blueprint

See architecture, tech stack, folder structure, user flow, API, security
checklist, roadmap.

## Architecture

``` text
React -> Express -> MongoDB
^ Encrypt/Decrypt on client using Web Crypto API
```

## Tech Stack

-   React + Vite + Tailwind
-   Express
-   MongoDB
-   Web Crypto API
-   AES-GCM
-   PBKDF2/Argon2

## Folder Structure

``` text
password-manager/
├── frontend/
├── backend/
├── shared/
└── README.md
```

### Frontend

``` text
src/
├── api/
├── components/
├── crypto/
├── hooks/
├── pages/
├── store/
├── types/
└── utils/
```

### Backend

``` text
src/
├── config/
├── controllers/
├── routes/
├── services/
├── models/
├── middlewares/
└── utils/
```

## Security

-   Never store master password
-   Encrypt on client
-   AES-GCM
-   New IV per record
-   HTTPS
-   No plaintext logging

## API

POST /auth/register POST /auth/login GET /vault POST /vault PUT
/vault/:id DELETE /vault/:id
