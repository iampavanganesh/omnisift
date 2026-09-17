-- Omnisift RLS: backend is the ONLY client (service_role). Flutter never
-- connects directly, so we default-deny and rely on service_role bypass.
-- Apply AFTER `prisma migrate dev/deploy` has created the tables.

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', t);
    -- no permissive policies for anon/authenticated => default deny.
    -- service_role bypasses RLS, so the backend retains full access.
  END LOOP;
END $$;
