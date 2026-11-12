# Dina's Secret — état d'avancement
## Installation
1. `npm install`  2. Copier `.env.example` → `.env.local` et remplir les clés Supabase.
3. Exécuter `supabase/migrations/001_init.sql` (SQL Editor Supabase).
4. Créer un utilisateur admin (Auth), puis : `update profiles set role='admin' where id='<uuid>';`
5. `npm run dev`
## Fait
Schéma complet + RLS + buckets privés, hash scrypt des codes, verrouillage 5 essais/15 min, cookie de session signé httpOnly, page d'entrée du code.
## Reste à faire
Layout/polices, menu + 5 pages publiques, admin (auth, CRUD, upload, QR via `qrcode`, stats), URLs signées Storage.
