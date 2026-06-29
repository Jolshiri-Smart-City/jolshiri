
-- Fix: Developer contact info publicly exposed
DROP POLICY IF EXISTS "Public read developers" ON public.developers;
CREATE POLICY "Agents and admins read developers"
  ON public.developers FOR SELECT
  TO authenticated
  USING (public.is_agent_or_admin());

-- Fix: Privilege escalation via profiles self-update
-- Remove the catch-all policy that lets a user update their own row (incl. role)
DROP POLICY IF EXISTS "profiles admin all" ON public.profiles;

CREATE POLICY "Admins manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Tighten the self-update policy so users cannot change their own role
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );
