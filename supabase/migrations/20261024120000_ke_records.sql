-- ことのえだ: a learner's record (the State of src/lib/record.ts), one row per account. The accounts are ことのあめ's
-- (the same Supabase project, as for ことのおと and ことのは); everything of this app's is prefixed ke_ (for 敬語, what it
-- teaches, so a new name for the app changes nothing here), and nothing of ことのあめ (pl_), ことのおと (kn_), ことのは
-- (en_) or the old app is touched. Read and written from the browser as the learner (RLS: only their own row).
create table if not exists public.ke_records (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  -- The record keeps its newest 60 scene conversations; this keeps the table from being used as storage.
  constraint ke_records_size check (pg_column_size(state) < 1048576)
);

alter table public.ke_records enable row level security;

drop policy if exists "ke_records own" on public.ke_records;
create policy "ke_records own" on public.ke_records
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
