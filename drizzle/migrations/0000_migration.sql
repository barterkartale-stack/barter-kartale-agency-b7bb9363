CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  mobile_number text,
  onboarding_complete boolean NOT NULL DEFAULT false,
  role text NOT NULL DEFAULT 'Reviewer' CHECK (role IN ('Reviewer','Assistant_Coordinator','Ground_Manager','Super_Admin')),
  sign_up_ip inet,
  device_fingerprint text,
  access_status text NOT NULL DEFAULT 'active' CHECK (access_status IN ('active','revoked','banned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  delivery_address text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('Amazon','Flipkart','Myntra','Meesho')),
  campaign_type text NOT NULL CHECK (campaign_type IN ('Full Sponsorship','Micro-Fee Campaign')),
  tracking_order_id text NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','in_review','approved','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.task_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  enrollment_id uuid REFERENCES public.campaign_enrollments(id) ON DELETE SET NULL,
  upi_id text NOT NULL,
  media_path text NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','in_review','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('Amazon','Flipkart','Myntra','Meesho')),
  incentive_amount integer NOT NULL CHECK (incentive_amount >= 0),
  campaign_link text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  enrollment_id uuid REFERENCES public.campaign_enrollments(id) ON DELETE SET NULL,
  name text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('Amazon','Flipkart','Myntra','Meesho')),
  campaign_type text NOT NULL CHECK (campaign_type IN ('Full Sponsorship','Micro-Fee Campaign')),
  upi_id text NOT NULL,
  proof_filename text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','in_review','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.campaign_enrollments TO authenticated;
GRANT SELECT, INSERT ON public.task_verifications TO authenticated;
GRANT SELECT ON public.campaigns TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.refunds TO authenticated;
GRANT ALL ON public.profiles, public.campaign_enrollments, public.task_verifications, public.campaigns, public.refunds TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "enrollments_select_own" ON public.campaign_enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "enrollments_insert_own" ON public.campaign_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "enrollments_update_own" ON public.campaign_enrollments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "verifications_select_own" ON public.task_verifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "verifications_insert_own" ON public.task_verifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "campaigns_select_public" ON public.campaigns FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "refunds_select_own" ON public.refunds FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "refunds_insert_own" ON public.refunds FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "refunds_update_own" ON public.refunds FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX campaign_enrollments_user_id_idx ON public.campaign_enrollments(user_id);
CREATE INDEX task_verifications_user_id_idx ON public.task_verifications(user_id);
CREATE INDEX campaigns_is_active_idx ON public.campaigns(is_active);
CREATE INDEX refunds_user_id_idx ON public.refunds(user_id);
CREATE INDEX profiles_access_status_idx ON public.profiles(access_status);

CREATE OR REPLACE FUNCTION public.is_super_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'Super_Admin' AND access_status = 'active')
$$;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_partner_onboarding(
  p_display_name text, p_mobile_number text, p_sign_up_ip inet DEFAULT NULL, p_device_fingerprint text DEFAULT NULL
) RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result public.profiles;
  v_email text;
  v_role text := 'Reviewer';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF length(trim(p_mobile_number)) < 10 OR length(trim(p_mobile_number)) > 15 THEN RAISE EXCEPTION 'Invalid mobile number'; END IF;
  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = auth.uid();
  IF lower(v_email) IN ('barterkartale@gmail.com', 'isiddharthsonkar@gmail.com') THEN v_role := 'Super_Admin'; END IF;
  INSERT INTO public.profiles (id, email, display_name, mobile_number, onboarding_complete, sign_up_ip, device_fingerprint, role)
  VALUES (auth.uid(), v_email, NULLIF(trim(p_display_name), ''), trim(p_mobile_number), true, p_sign_up_ip, NULLIF(trim(p_device_fingerprint), ''), v_role)
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    mobile_number = EXCLUDED.mobile_number,
    onboarding_complete = true,
    sign_up_ip = COALESCE(EXCLUDED.sign_up_ip, profiles.sign_up_ip),
    device_fingerprint = COALESCE(EXCLUDED.device_fingerprint, profiles.device_fingerprint),
    role = CASE WHEN profiles.role = 'Super_Admin' THEN profiles.role WHEN v_role = 'Super_Admin' THEN 'Super_Admin' ELSE profiles.role END,
    updated_at = now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.complete_partner_onboarding(text, text, inet, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_partner_onboarding(text, text, inet, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_user_access_status(p_user_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_status NOT IN ('active','revoked','banned') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.profiles SET access_status = p_status, updated_at = now() WHERE id = p_user_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_user_access_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_access_status(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_campaign(p_name text, p_platform text, p_incentive integer, p_link text, p_campaign_id uuid DEFAULT NULL)
RETURNS public.campaigns LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.campaigns;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_platform NOT IN ('Amazon','Flipkart','Myntra','Meesho') THEN RAISE EXCEPTION 'Invalid platform'; END IF;
  IF p_incentive IS NULL OR p_incentive < 0 THEN RAISE EXCEPTION 'Invalid incentive amount'; END IF;
  IF p_campaign_id IS NOT NULL THEN
    UPDATE public.campaigns SET name = p_name, platform = p_platform, incentive_amount = p_incentive, campaign_link = p_link, updated_at = now()
    WHERE id = p_campaign_id RETURNING * INTO result;
  ELSE
    INSERT INTO public.campaigns (name, platform, incentive_amount, campaign_link, created_by)
    VALUES (p_name, p_platform, p_incentive, p_link, auth.uid()) RETURNING * INTO result;
  END IF;
  IF result IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.save_campaign(text, text, integer, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_campaign(text, text, integer, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_campaign_active(p_campaign_id uuid, p_is_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.campaigns SET is_active = p_is_active, updated_at = now() WHERE id = p_campaign_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.toggle_campaign_active(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_campaign_active(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_admin_profiles()
RETURNS SETOF public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.list_admin_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_admin_profiles() TO authenticated;