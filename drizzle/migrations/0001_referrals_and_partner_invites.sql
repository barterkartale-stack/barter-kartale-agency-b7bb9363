ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid,
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'creator',
  ADD COLUMN IF NOT EXISTS invitation_code_used text;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_access_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_access_status_check
  CHECK (access_status = ANY (ARRAY['active','pending','revoked','banned']));

CREATE TABLE IF NOT EXISTS public.agency_invite_codes (
  code text PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.agency_invite_codes TO service_role;
ALTER TABLE public.agency_invite_codes ENABLE ROW LEVEL SECURITY;
INSERT INTO public.agency_invite_codes (code) VALUES ('BARTERKARTALE2026') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE c text;
BEGIN
  LOOP
    c := 'BK-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = c);
  END LOOP;
  RETURN c;
END $$;

UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

CREATE OR REPLACE FUNCTION public.complete_account_setup(
  p_display_name text, p_mobile_number text, p_sign_up_ip inet DEFAULT NULL,
  p_device_fingerprint text DEFAULT NULL, p_referral_code text DEFAULT NULL,
  p_invite_code text DEFAULT NULL, p_partner boolean DEFAULT false)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result public.profiles; existing public.profiles; v_email text; v_role text := 'Reviewer';
  v_referrer uuid; v_status text := 'active';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF length(trim(coalesce(p_mobile_number,''))) < 10 OR length(trim(p_mobile_number)) > 15 THEN RAISE EXCEPTION 'Invalid mobile number'; END IF;
  SELECT * INTO existing FROM public.profiles WHERE id = auth.uid();
  IF p_partner THEN
    IF NOT EXISTS (SELECT 1 FROM public.agency_invite_codes WHERE upper(code) = upper(trim(coalesce(p_invite_code,''))) AND is_active) THEN
      RAISE EXCEPTION 'Invalid invitation code';
    END IF;
    v_status := 'pending';
  END IF;
  IF nullif(trim(coalesce(p_referral_code,'')),'') IS NOT NULL THEN
    SELECT id INTO v_referrer FROM public.profiles WHERE upper(referral_code) = upper(trim(p_referral_code)) AND id <> auth.uid();
  END IF;
  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = auth.uid();
  IF lower(v_email) IN ('barterkartale@gmail.com', 'isiddharthsonkar@gmail.com') THEN v_role := 'Super_Admin'; v_status := 'active'; END IF;
  INSERT INTO public.profiles (id, email, display_name, mobile_number, onboarding_complete, sign_up_ip, device_fingerprint, role, referral_code, referred_by, account_type, invitation_code_used, access_status)
  VALUES (auth.uid(), v_email, nullif(trim(p_display_name),''), trim(p_mobile_number), true, p_sign_up_ip, nullif(trim(p_device_fingerprint),''), v_role,
    public.generate_referral_code(), v_referrer, CASE WHEN p_partner THEN 'partner' ELSE 'creator' END,
    CASE WHEN p_partner THEN upper(trim(p_invite_code)) END, v_status)
  ON CONFLICT (id) DO UPDATE SET
    display_name = coalesce(EXCLUDED.display_name, profiles.display_name),
    mobile_number = EXCLUDED.mobile_number,
    onboarding_complete = true,
    sign_up_ip = coalesce(profiles.sign_up_ip, EXCLUDED.sign_up_ip),
    device_fingerprint = coalesce(profiles.device_fingerprint, EXCLUDED.device_fingerprint),
    role = CASE WHEN profiles.role <> 'Reviewer' THEN profiles.role ELSE EXCLUDED.role END,
    referral_code = coalesce(profiles.referral_code, EXCLUDED.referral_code),
    referred_by = coalesce(profiles.referred_by, EXCLUDED.referred_by),
    account_type = CASE WHEN p_partner THEN 'partner' ELSE profiles.account_type END,
    invitation_code_used = coalesce(EXCLUDED.invitation_code_used, profiles.invitation_code_used),
    access_status = CASE WHEN profiles.access_status IN ('banned','revoked') THEN profiles.access_status
                         WHEN p_partner AND profiles.account_type <> 'partner' AND EXCLUDED.access_status = 'pending' THEN 'pending'
                         ELSE profiles.access_status END,
    updated_at = now()
  RETURNING * INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.complete_account_setup(text,text,inet,text,text,text,boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.complete_account_setup(text,text,inet,text,text,text,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.my_referral_count()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.profiles WHERE referred_by = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.my_referral_count() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_user_access_status(p_user_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_status NOT IN ('active','pending','revoked','banned') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.profiles SET access_status = p_status, updated_at = now() WHERE id = p_user_id;
END $$;