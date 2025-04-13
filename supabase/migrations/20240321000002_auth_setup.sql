-- Eliminar triggers existentes
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_profile_updated on profiles;
drop trigger if exists handle_updated_at on profiles;
drop trigger if exists on_failed_login on auth.users;

-- Eliminar funciones existentes
drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_updated_at() cascade;
drop function if exists public.handle_failed_login() cascade;
drop function if exists public.get_current_profile() cascade;
drop function if exists public.check_email_exists() cascade;

-- Eliminar todas las políticas existentes
drop policy if exists "Los perfiles son visibles para usuarios autenticados" on profiles;
drop policy if exists "Los usuarios pueden actualizar su propio perfil" on profiles;
drop policy if exists "Usuarios pueden ver sus propios perfiles" on profiles;
drop policy if exists "Usuarios pueden crear sus propios perfiles" on profiles;
drop policy if exists "Usuarios pueden actualizar sus propios perfiles" on profiles;
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;
drop policy if exists "Enable read access for all users" on profiles;
drop policy if exists "Enable insert for authenticated users" on profiles;
drop policy if exists "Enable update for users based on email" on profiles;
drop policy if exists "Permitir verificación de email durante registro" on profiles;

-- Eliminar políticas de login_logs
drop policy if exists "Permitir inserciones desde funciones" on login_logs;
drop policy if exists "Solo administradores pueden leer logs" on login_logs;

-- Eliminar tipos existentes
drop type if exists user_role cascade;

-- Crear tipo enum para roles
create type user_role as enum ('limited', 'pro', 'admin');

-- Eliminar y recrear la tabla
drop table if exists public.profiles cascade;

-- Crear la tabla de perfiles
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique,
    full_name text,
    avatar_url text,
    phone_number text,
    country text,
    language text default 'es',
    timezone text default 'America/Santiago',
    role user_role default 'limited',
    role_updated_at timestamptz,
    role_updated_by uuid references auth.users(id),
    subscription_expires_at timestamptz,
    subscription_started_at timestamptz,
    subscription_status text,
    stripe_customer_id text,
    is_email_verified boolean default false,
    is_phone_verified boolean default false,
    last_sign_in timestamptz,
    failed_login_attempts int default 0,
    last_failed_login timestamptz,
    registration_ip text,
    registration_user_agent text,
    registration_timestamp timestamptz,
    account_locked boolean default false,
    lock_reason text,
    lock_timestamp timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint valid_email check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    constraint valid_subscription_dates check (
        (role = 'limited' and subscription_expires_at is null and subscription_started_at is null) or
        (role in ('pro', 'admin') and subscription_expires_at is not null and subscription_started_at is not null)
    )
);

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Crear políticas de seguridad básicas
create policy "Los perfiles son visibles para usuarios autenticados"
    on profiles for select
    using (auth.role() = 'authenticated');

create policy "Permitir verificación de email durante registro"
    on profiles for select
    to anon
    using (true);

create policy "Los usuarios pueden actualizar su propio perfil"
    on profiles for update
    using (
        auth.uid() = id and (
            -- Permitir actualización si no se está cambiando el rol
            (role = (select role from profiles where id = auth.uid())) or
            -- O si el usuario es admin
            exists (
                select 1 from profiles
                where id = auth.uid() and role = 'admin'
            )
        )
    );

create policy "Los usuarios pueden insertar su propio perfil"
    on profiles for insert
    with check (auth.uid() = id);

-- Otorgar permisos básicos a la tabla profiles
grant usage on schema public to anon, authenticated;
grant select on table profiles to anon, authenticated;
grant insert, update on table profiles to authenticated;

-- Crear función para manejar actualizaciones de timestamp
create function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Crear trigger para timestamp de actualización
create trigger on_profile_updated
    before update on public.profiles
    for each row execute function public.handle_updated_at();

-- Crear función para manejar nuevos usuarios
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
    existing_email_count integer;
begin
    -- Verificar si el email ya existe
    select count(*)
    into existing_email_count
    from public.profiles
    where email = new.email
    and id != new.id;

    if existing_email_count > 0 then
        raise exception 'El correo electrónico % ya está registrado', new.email;
    end if;

    insert into public.profiles (
        id,
        email,
        full_name,
        role,
        is_email_verified,
        last_sign_in,
        registration_ip,
        registration_user_agent,
        registration_timestamp,
        created_at,
        updated_at,
        subscription_status
    )
    values (
        new.id,
        new.email,
        coalesce(
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1)
        ),
        'limited',
        new.email_confirmed_at is not null,
        new.last_sign_in_at,
        new.raw_user_meta_data->>'registration_ip',
        new.raw_user_meta_data->>'registration_user_agent',
        (new.raw_user_meta_data->>'registration_timestamp')::timestamptz,
        new.created_at,
        new.updated_at,
        'free'
    )
    on conflict (id) do update
    set
        email = excluded.email,
        full_name = excluded.full_name,
        is_email_verified = excluded.is_email_verified,
        last_sign_in = excluded.last_sign_in,
        updated_at = now();

    return new;
end;
$$;

-- Crear trigger para nuevos usuarios
create trigger on_auth_user_created
    after insert or update on auth.users
    for each row execute function public.handle_new_user();

-- Función para formatear intervalo de tiempo en español
create or replace function public.format_interval_to_spanish(
    from_time timestamptz
)
returns text
language plpgsql
as $$
declare
    diff interval;
    diff_minutes int;
    diff_hours int;
    diff_days int;
    diff_months int;
begin
    diff := now() - from_time;
    diff_minutes := extract(epoch from diff)/60;
    diff_hours := diff_minutes/60;
    diff_days := diff_hours/24;
    diff_months := diff_days/30;

    if diff_minutes < 1 then
        return 'hace un momento';
    elsif diff_minutes < 60 then
        return 'hace ' || diff_minutes || ' minutos';
    elsif diff_hours < 24 then
        if diff_hours = 1 then
            return 'hace 1 hora';
        else
            return 'hace ' || diff_hours || ' horas';
        end if;
    elsif diff_days < 30 then
        if diff_days = 1 then
            return 'hace 1 día';
        else
            return 'hace ' || diff_days || ' días';
        end if;
    elsif diff_months < 12 then
        if diff_months = 1 then
            return 'hace 1 mes';
        else
            return 'hace ' || diff_months || ' meses';
        end if;
    else
        return to_char(from_time, 'DD/MM/YYYY');
    end if;
end;
$$;

-- Crear función para obtener el perfil actual
create or replace function public.get_current_profile()
returns jsonb
language plpgsql
security definer
as $$
declare
    _user_id uuid;
    _profile jsonb;
    _last_login timestamp;
    _remaining_days int;
begin
    -- Get current user ID
    _user_id := auth.uid();
    
    -- Get user profile with all fields
    SELECT jsonb_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'role', p.role,
        'is_email_verified', p.is_email_verified,
        'subscription_expires_at', p.subscription_expires_at,
        'subscription_started_at', p.subscription_started_at,
        'subscription_status', p.subscription_status,
        'subscription_info', (
            case
                when p.role = 'limited' then 'Cuenta gratuita'
                when p.role in ('pro', 'admin') then (
                    case
                        when p.subscription_expires_at is null then 'Sin vencimiento'
                        else (
                            select 
                                case
                                    when p.subscription_expires_at < now() then 'Expirada'
                                    else extract(day from p.subscription_expires_at - now())::text || ' días restantes'
                                end
                        )
                    end
                )
            end
        )
    )
    INTO _profile
    FROM public.profiles p
    WHERE p.id = _user_id;

    -- Get penultimate successful login
    SELECT created_at 
    INTO _last_login
    FROM public.login_logs
    WHERE email = (_profile->>'email')
    AND success = true
    ORDER BY created_at DESC
    OFFSET 1
    LIMIT 1;

    -- If no penultimate login exists, try to get the last login
    IF _last_login IS NULL THEN
        SELECT created_at 
        INTO _last_login
        FROM public.login_logs
        WHERE email = (_profile->>'email')
        AND success = true
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    -- Add last login info to profile
    IF _last_login IS NOT NULL THEN
        _profile := _profile || jsonb_build_object(
            'last_sign_in', _last_login,
            'last_sign_in_formatted', public.format_interval_to_spanish(_last_login)
        );
    ELSE
        _profile := _profile || jsonb_build_object(
            'last_sign_in', null,
            'last_sign_in_formatted', 'Nunca'
        );
    END IF;

    RETURN _profile;
end;
$$;

-- Crear función para actualizar rol y suscripción (solo para admin)
create or replace function public.update_user_role_and_subscription(
    target_user_id uuid,
    new_role user_role,
    subscription_duration interval default null
)
returns void
language plpgsql
security definer
as $$
declare
    current_user_role user_role;
begin
    -- Verificar si el usuario actual es admin
    select role into current_user_role
    from public.profiles
    where id = auth.uid();

    if current_user_role != 'admin' then
        raise exception 'Solo los administradores pueden cambiar roles de usuario';
    end if;

    -- Verificar que no se esté intentando asignar el rol 'pro' manualmente
    if new_role = 'pro' then
        raise exception 'El rol PRO solo puede ser asignado a través del proceso de pago';
    end if;

    -- Actualizar el rol y la suscripción (solo para admin)
    update public.profiles
    set
        role = new_role,
        role_updated_at = now(),
        role_updated_by = auth.uid(),
        subscription_started_at = case
            when new_role = 'admin' then now()
            else null
        end,
        subscription_expires_at = case
            when new_role = 'admin' and subscription_duration is not null
                then now() + subscription_duration
            when new_role = 'limited' then null
            else subscription_expires_at
        end,
        subscription_status = case
            when new_role = 'limited' then 'free'
            when new_role = 'admin' then 'active'
        end
    where id = target_user_id;
end;
$$;

-- Crear función para procesar actualización de suscripción desde Stripe
create or replace function public.process_stripe_subscription(
    user_id uuid,
    subscription_id text,
    subscription_status text,
    subscription_period interval
)
returns void
language plpgsql
security definer
as $$
begin
    -- Actualizar el perfil con la información de la suscripción
    update public.profiles
    set
        role = 'pro',
        role_updated_at = now(),
        role_updated_by = user_id,
        subscription_started_at = now(),
        subscription_expires_at = now() + subscription_period,
        subscription_status = subscription_status,
        stripe_customer_id = subscription_id
    where id = user_id;
end;
$$;

-- Otorgar permisos solo para la función de admin
grant execute on function public.update_user_role_and_subscription to authenticated;

-- La función de Stripe será llamada por un webhook, así que no necesita permisos de usuario
revoke execute on function public.process_stripe_subscription from anon, authenticated;

-- Crear función para manejar intentos fallidos de inicio de sesión
create function public.handle_failed_login()
returns trigger
language plpgsql
security definer
as $$
begin
    update public.profiles
    set 
        failed_login_attempts = failed_login_attempts + 1,
        last_failed_login = now(),
        account_locked = case 
            when failed_login_attempts >= 5 then true 
            else account_locked 
        end,
        lock_reason = case 
            when failed_login_attempts >= 5 then 'Demasiados intentos fallidos de inicio de sesión'
            else lock_reason
        end,
        lock_timestamp = case 
            when failed_login_attempts >= 5 then now()
            else lock_timestamp
        end
    where id = new.id;
    return new;
end;
$$;

-- Crear trigger para intentos fallidos de inicio de sesión
create trigger on_failed_login
    after update of last_sign_in_at on auth.users
    for each row
    when (new.last_sign_in_at is null)
    execute function public.handle_failed_login();

-- Función para resetear los intentos fallidos de inicio de sesión
create or replace function public.reset_failed_login_attempts(user_email text)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set failed_login_attempts = 0,
      last_failed_login = null
  where email = user_email;
end;
$$;

-- Función para incrementar los intentos fallidos de inicio de sesión
create or replace function public.increment_failed_login_attempts(user_email text)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set failed_login_attempts = coalesce(failed_login_attempts, 0) + 1,
      last_failed_login = now()
  where email = user_email;
end;
$$;

-- Permisos para las funciones de intentos fallidos
grant execute on function public.reset_failed_login_attempts(text) to authenticated, anon;
grant execute on function public.increment_failed_login_attempts(text) to authenticated, anon;

-- Crear función para verificar si un email ya existe
create or replace function public.check_email_exists(email text)
returns boolean
language plpgsql
security definer
as $$
begin
    return exists (
        select 1 
        from auth.users 
        where auth.users.email = check_email_exists.email
    );
end;
$$;

-- Otorgar permisos para la función de verificación de email
grant execute on function public.check_email_exists(text) to anon, authenticated;

-- Crear trigger para evitar emails duplicados en auth.users
create or replace function public.prevent_duplicate_emails()
returns trigger
language plpgsql
security definer
as $$
begin
    if exists (
        select 1 
        from auth.users 
        where email = new.email 
        and id != new.id
    ) then
        raise exception 'El correo electrónico % ya está registrado', new.email;
    end if;
    return new;
end;
$$;

-- Crear el trigger en auth.users
drop trigger if exists prevent_duplicate_emails_trigger on auth.users;
create trigger prevent_duplicate_emails_trigger
    before insert or update on auth.users
    for each row
    execute function public.prevent_duplicate_emails();

-- Crear tabla para registrar intentos de inicio de sesión
create table if not exists public.login_logs (
    id uuid default gen_random_uuid() primary key,
    email text not null,
    success boolean not null,
    ip_address text,
    user_agent text,
    created_at timestamptz default now(),
    constraint valid_email check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Habilitar RLS para login_logs
alter table public.login_logs enable row level security;

-- Crear política para permitir inserciones desde funciones
create policy "Permitir inserciones desde funciones"
    on login_logs for insert
    with check (true);

-- Crear política para permitir lectura a administradores
create policy "Solo administradores pueden leer logs"
    on login_logs for select
    using (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role = 'admin'
        )
    );

-- Otorgar permisos básicos a la tabla login_logs
grant usage on schema public to anon, authenticated;
grant insert on table login_logs to anon, authenticated;
grant select on table login_logs to authenticated;

-- Función para registrar intentos de inicio de sesión
create or replace function public.log_login_attempt(
    p_email text,
    p_success boolean,
    p_ip_address text default null,
    p_user_agent text default null
)
returns void
language plpgsql
security definer
as $$
begin
    insert into public.login_logs (
        email,
        success,
        ip_address,
        user_agent
    ) values (
        p_email,
        p_success,
        p_ip_address,
        p_user_agent
    );
end;
$$;

-- Otorgar permisos para ejecutar la función
grant execute on function public.log_login_attempt to anon, authenticated;

-- Función para actualizar el avatar del usuario
create or replace function public.update_user_avatar(
    avatar_url text
)
returns jsonb
language plpgsql
security definer
as $$
declare
    _profile jsonb;
begin
    -- Actualizar el avatar del usuario actual
    update public.profiles
    set avatar_url = update_user_avatar.avatar_url
    where id = auth.uid()
    returning jsonb_build_object(
        'id', profiles.id,
        'avatar_url', profiles.avatar_url,
        'updated_at', profiles.updated_at
    ) into _profile;

    return _profile;
end;
$$;

-- Otorgar permisos para ejecutar la función
grant execute on function public.update_user_avatar to authenticated; 