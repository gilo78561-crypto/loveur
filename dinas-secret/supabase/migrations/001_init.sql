create extension if not exists pgcrypto;
create type exp_status as enum ('draft','active','suspended','expired');

create table profiles(id uuid primary key references auth.users on delete cascade,
  full_name text, role text not null default 'client' check (role in ('admin','client')));

create table experiences(id uuid primary key default gen_random_uuid(),
  slug text unique not null default encode(gen_random_bytes(9),'hex'),
  owner_id uuid references profiles(id) on delete set null,
  client_name text not null, recipient_first_name text not null, couple_name text,
  status exp_status not null default 'draft', expires_at timestamptz,
  created_at timestamptz not null default now());
create index on experiences(status);

create table secret_codes(experience_id uuid primary key references experiences on delete cascade,
  code_hash text not null, failed_attempts int not null default 0,
  locked_until timestamptz, updated_at timestamptz default now());

create table love_messages(experience_id uuid primary key references experiences on delete cascade,
  title text, body text not null, signature text, final_text text);
create table music_tracks(experience_id uuid primary key references experiences on delete cascade,
  title text, artist text, audio_path text, cover_path text);
create table couple_questions(id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references experiences on delete cascade,
  position int not null check (position between 1 and 5), question text not null,
  unique(experience_id, position));
create table memories(id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references experiences on delete cascade,
  position int not null, image_path text not null, caption text);
create index on memories(experience_id, position);
create table qr_codes(id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references experiences on delete cascade,
  url text not null, created_at timestamptz default now(), active boolean default true);
create table experience_visits(id bigserial primary key,
  experience_id uuid not null references experiences on delete cascade,
  kind text not null check (kind in ('scan','unlock','page')), created_at timestamptz default now());
create table game_responses(id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references experiences on delete cascade,
  question_id uuid references couple_questions on delete cascade,
  answer text not null, created_at timestamptz default now());

create or replace function is_admin() returns boolean language sql stable security definer as
$$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;

-- RLS : tout est fermé au public. Le contenu privé n'est lu que par le serveur (service role) après vérification du code.
do $$ declare t text; begin
 foreach t in array array['profiles','experiences','secret_codes','love_messages','music_tracks',
  'couple_questions','memories','qr_codes','experience_visits','game_responses'] loop
  execute format('alter table %I enable row level security',t);
  if t<>'profiles' then execute format('create policy "admin_all" on %I for all using (is_admin()) with check (is_admin())',t); end if;
 end loop; end $$;
create policy "own_profile" on profiles for select using (id=auth.uid() or is_admin());
create policy "admin_profiles" on profiles for all using (is_admin()) with check (is_admin());

-- Buckets privés (accès via URLs signées générées côté serveur)
insert into storage.buckets(id,name,public,file_size_limit) values
 ('memories','memories',false,5242880),('audio','audio',false,15728640) on conflict do nothing;
