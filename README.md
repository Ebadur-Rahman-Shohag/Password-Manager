# Password Manager

A zero-knowledge password manager built with React, Express, and MongoDB. Vault data is encrypted on the client using Web Crypto API (AES-GCM) before being sent to the server.

## Project structure

```text
password-manager/
├── frontend/   # React + Vite + Tailwind (client-side encryption)
├── backend/    # Express API (stores encrypted blobs only)
├── shared/     # Shared TypeScript types and API constants
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB (for later phases)

## Setup

```bash
npm install
```

## Development

```bash
# Frontend (default: http://localhost:5173)
npm run dev:frontend

# Backend (default: http://localhost:3000)
npm run dev:backend
```

## Build

```bash
npm run build
```

## Security notes

- Master password is never stored on the server
- Encryption/decryption happens on the client
- AES-GCM with a new IV per vault record
