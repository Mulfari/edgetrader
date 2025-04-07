-- Eliminar trigger y función existentes si existen
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Eliminar políticas existentes
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

-- Create a table for public profiles
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade not null primary key,
    display_name text,
    date_of_birth date,
    language text default 'es',
    is_email_verified boolean default false,
    registration_completed boolean default false,
    account_type text default 'email',
    last_login timestamp with time zone,
    device_info jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
    on profiles for select
    using ( true );

create policy "Users can insert their own profile."
    on profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update own profile."
    on profiles for update
    using ( auth.uid() = id );

-- Create a function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
    raw_date text;
    parsed_date date;
begin
    -- Obtener la fecha de los metadatos
    raw_date := new.raw_user_meta_data->>'date_of_birth';
    
    -- Intentar convertir la fecha
    begin
        parsed_date := raw_date::date;
    exception when others then
        parsed_date := null;
    end;

    -- Insertar el nuevo perfil
    insert into public.profiles (
        id,
        display_name,
        date_of_birth,
        account_type,
        is_email_verified,
        registration_completed
    )
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        parsed_date,
        coalesce(new.raw_user_meta_data->>'account_type', 'email'),
        coalesce(new.email_confirmed, false),
        coalesce((new.raw_user_meta_data->>'registration_completed')::boolean, true)
    );
    return new;
end;
$$;

-- Create trigger for new user signup
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Create indexes for better performance
create index if not exists profiles_display_name_idx on profiles (display_name);
create index if not exists profiles_created_at_idx on profiles (created_at);
create index if not exists profiles_account_type_idx on profiles (account_type); 