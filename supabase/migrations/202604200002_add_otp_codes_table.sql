-- OTP codes table for custom Resend-based auth
create table if not exists public.otp_codes (
  id bigserial primary key,
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for fast lookup by email
create index if not exists idx_otp_codes_email on public.otp_codes(email);

-- Auto-cleanup: delete used or expired codes older than 1 hour
create or replace function public.fn_cleanup_otp_codes()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.otp_codes
  where used = true or expires_at < now() - interval '1 hour';
end;
$$;
