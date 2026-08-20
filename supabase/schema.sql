-- Supabase Schema for Sona-Movies Advanced Features
-- Run this in the Supabase SQL Editor

-- 1. Enable pgvector extension for AI Semantic Search
create extension if not exists vector;

-- 2. Movies Embeddings Table (AI Search)
create table if not exists public.movies_embeddings (
    id bigint primary key, -- TMDB ID
    title text not null,
    overview text,
    media_type text not null check (media_type in ('movie', 'tv')),
    embedding vector(1536), -- OpenAI embedding size
    metadata jsonb
);

-- Index for fast semantic search (cosine similarity)
create index if not exists movies_embeddings_vector_idx 
    on public.movies_embeddings 
    using ivfflat (embedding vector_cosine_ops) 
    with (lists = 100);

-- 3. Watch History Table (Cross-Device "Continue Watching")
create table if not exists public.watch_history (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    tmdb_id bigint not null,
    media_type text not null,
    title text not null,
    timestamp_seconds integer not null default 0,
    last_watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, tmdb_id, media_type)
);

-- 4. Collections Table (Curated Lists)
create table if not exists public.collections (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text,
    is_public boolean default false,
    items jsonb not null default '[]'::jsonb, -- Array of TMDB objects
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Watch Party Rooms
create table if not exists public.watch_party_rooms (
    id uuid default gen_random_uuid() primary key,
    host_id uuid references auth.users(id) on delete cascade not null,
    tmdb_id bigint not null,
    media_type text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ----------------------------------------------------
-- Row Level Security (RLS) Policies
-- ----------------------------------------------------

-- Enable RLS on all tables
alter table public.watch_history enable row level security;
alter table public.collections enable row level security;
alter table public.watch_party_rooms enable row level security;
alter table public.movies_embeddings enable row level security;

-- Movies Embeddings: Everyone can read
create policy "Public can view embeddings"
    on public.movies_embeddings for select
    using (true);

-- Watch History: Users can only see/edit their own history
create policy "Users can view own history"
    on public.watch_history for select
    using (auth.uid() = user_id);

create policy "Users can insert own history"
    on public.watch_history for insert
    with check (auth.uid() = user_id);

create policy "Users can update own history"
    on public.watch_history for update
    using (auth.uid() = user_id);

-- Collections: Users can view their own, OR any collection marked public
create policy "Users can view public or own collections"
    on public.collections for select
    using (auth.uid() = user_id or is_public = true);

create policy "Users can insert own collections"
    on public.collections for insert
    with check (auth.uid() = user_id);

create policy "Users can update own collections"
    on public.collections for update
    using (auth.uid() = user_id);

create policy "Users can delete own collections"
    on public.collections for delete
    using (auth.uid() = user_id);

-- Watch Party Rooms: Anyone can view, only host can manage
create policy "Public can view active rooms"
    on public.watch_party_rooms for select
    using (true);

create policy "Host can insert room"
    on public.watch_party_rooms for insert
    with check (auth.uid() = host_id);

create policy "Host can delete room"
    on public.watch_party_rooms for delete
    using (auth.uid() = host_id);
