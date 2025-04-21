-- Schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS pgsodium;
CREATE SCHEMA IF NOT EXISTS vault;
CREATE SCHEMA IF NOT EXISTS supabase_migrations;

-- Custom Types
CREATE TYPE auth.aal_level AS ENUM ('aal1', 'aal2', 'aal3');
CREATE TYPE auth.factor_type AS ENUM ('totp', 'webauthn', 'phone');
CREATE TYPE auth.factor_status AS ENUM ('unverified', 'verified');
CREATE TYPE auth.code_challenge_method AS ENUM ('s256', 'plain');
CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);
CREATE TYPE pgsodium.key_status AS ENUM ('default', 'valid', 'invalid', 'expired');
CREATE TYPE pgsodium.key_type AS ENUM (
    'aead-ietf',
    'aead-det',
    'hmacsha512',
    'hmacsha256',
    'auth',
    'shorthash',
    'generichash',
    'kdf',
    'secretbox',
    'secretstream',
    'stream_xchacha20'
);
CREATE TYPE public.user_role AS ENUM ('limited', 'pro', 'admin');

-- Tables

-- Auth Schema Tables
CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL PRIMARY KEY,
    aud varchar,
    role varchar,
    email varchar,
    encrypted_password varchar,
    email_confirmed_at timestamptz,
    invited_at timestamptz,
    confirmation_token varchar,
    confirmation_sent_at timestamptz,
    recovery_token varchar,
    recovery_sent_at timestamptz,
    email_change_token_new varchar,
    email_change varchar,
    email_change_sent_at timestamptz,
    last_sign_in_at timestamptz,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamptz,
    updated_at timestamptz,
    phone text UNIQUE,
    phone_confirmed_at timestamptz,
    phone_change text DEFAULT ''::text,
    phone_change_token varchar DEFAULT ''::varchar,
    phone_change_sent_at timestamptz,
    confirmed_at timestamptz GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current varchar DEFAULT ''::varchar,
    email_change_confirm_status smallint DEFAULT 0 CHECK (email_change_confirm_status >= 0 AND email_change_confirm_status <= 2),
    banned_until timestamptz,
    reauthentication_token varchar DEFAULT ''::varchar,
    reauthentication_sent_at timestamptz,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamptz,
    is_anonymous boolean DEFAULT false NOT NULL
);

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY
);

CREATE TABLE auth.sessions (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz,
    updated_at timestamptz,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamptz,
    refreshed_at timestamp,
    user_agent text,
    ip inet,
    tag text
);

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamptz UNIQUE,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);

CREATE TABLE auth.user_2fa (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
    secret text NOT NULL,
    verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Public Schema Tables
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id),
    totp_secret text,
    is_2fa_enabled boolean DEFAULT false,
    email text UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    full_name text,
    avatar_url text,
    phone_number text,
    country text,
    language text DEFAULT 'es'::text,
    timezone text DEFAULT 'America/Santiago'::text,
    role public.user_role DEFAULT 'limited'::public.user_role,
    role_updated_at timestamptz,
    role_updated_by uuid REFERENCES auth.users(id),
    subscription_expires_at timestamptz,
    subscription_started_at timestamptz,
    subscription_status text,
    stripe_customer_id text,
    is_email_verified boolean DEFAULT false,
    is_phone_verified boolean DEFAULT false,
    last_sign_in timestamptz,
    failed_login_attempts integer DEFAULT 0,
    last_failed_login timestamptz,
    registration_ip text,
    registration_user_agent text,
    registration_timestamp timestamptz,
    account_locked boolean DEFAULT false,
    lock_reason text,
    lock_timestamp timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.login_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    success boolean NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE public.totp_verification_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    verification_type text NOT NULL CHECK (verification_type = ANY (ARRAY['setup'::text, 'verify'::text, 'disable'::text])),
    success boolean NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.verification_email_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    email text NOT NULL,
    ip_address text CHECK (length(ip_address) < 45),
    user_agent text CHECK (length(user_agent) < 512),
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id)
);

-- Storage Schema Tables
CREATE TABLE storage.buckets (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    bucket_id text REFERENCES storage.buckets(id),
    name text,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);

-- Realtime Schema Tables
CREATE TABLE realtime.subscription (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[],
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED,
    created_at timestamp DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp DEFAULT now() NOT NULL,
    inserted_at timestamp DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    PRIMARY KEY (inserted_at, id)
);

-- Vault Schema Tables
CREATE TABLE vault.secrets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text,
    description text DEFAULT ''::text NOT NULL,
    secret text NOT NULL,
    key_id uuid DEFAULT (pgsodium.create_key()).id,
    nonce bytea DEFAULT pgsodium.crypto_aead_det_noncegen(),
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Migration Tables
CREATE TABLE storage.migrations (
    id integer NOT NULL PRIMARY KEY,
    name varchar NOT NULL UNIQUE,
    hash varchar NOT NULL,
    executed_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth.schema_migrations (
    version varchar NOT NULL PRIMARY KEY
);

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL PRIMARY KEY,
    inserted_at timestamp
);

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL PRIMARY KEY,
    statements text[],
    name text,
    created_by text
);

-- Indexes
CREATE INDEX users_instance_id_email_idx ON auth.users (instance_id, email);
CREATE INDEX users_instance_id_idx ON auth.users (instance_id);
CREATE INDEX identities_user_id_idx ON auth.identities (user_id);
CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens (instance_id);
CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens (instance_id, user_id);
CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens (parent);
CREATE INDEX refresh_tokens_token_idx ON auth.refresh_tokens (token);
CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries (instance_id);
CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors (user_id);
CREATE INDEX objects_bucketid_name_idx ON storage.objects (bucket_id, name);
CREATE INDEX subscription_entity_filters_idx ON realtime.subscription (entity, filters);

-- Comments
COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';
COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';
COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';
COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';
COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';
COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';
COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';
COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';
COMMENT ON TABLE vault.secrets IS 'Table with encrypted `secret` column for storing sensitive information on disk.';
COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';
COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';
COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';
COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';
COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';
COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';
COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';
COMMENT ON COLUMN auth.users.owner IS 'Field is deprecated, use owner_id instead'; 