-- OTP records table for incident creation verification
CREATE TABLE IF NOT EXISTS otp_records (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_hash   text        NOT NULL,
  otp_token  uuid        NOT NULL UNIQUE,
  attempts   int         NOT NULL DEFAULT 0,
  used       boolean     NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS otp_records_user_id_idx ON otp_records(user_id);
CREATE INDEX IF NOT EXISTS otp_records_token_idx   ON otp_records(otp_token);

-- Rate-limit check + insert new OTP record atomically
CREATE OR REPLACE FUNCTION generate_otp_record(
  p_user_id   uuid,
  p_otp_hash  text,
  p_otp_token uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_count int;
BEGIN
  -- Rate limit: max 3 requests per user per 2 minutes
  SELECT COUNT(*) INTO v_recent_count
  FROM otp_records
  WHERE user_id = p_user_id
    AND created_at > now() - interval '2 minutes';

  IF v_recent_count >= 3 THEN
    RETURN jsonb_build_object('rate_limited', true);
  END IF;

  -- Invalidate any existing unused OTPs for this user
  UPDATE otp_records
  SET used = true
  WHERE user_id = p_user_id AND used = false;

  -- Insert new OTP record
  INSERT INTO otp_records (user_id, otp_hash, otp_token)
  VALUES (p_user_id, p_otp_hash, p_otp_token);

  RETURN jsonb_build_object('rate_limited', false);
END;
$$;

-- Verify OTP and mark used atomically with row-level lock
CREATE OR REPLACE FUNCTION verify_and_invalidate_otp(
  p_user_id    uuid,
  p_otp_token  uuid,
  p_input_hash text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record otp_records;
BEGIN
  -- Lock the row to prevent concurrent verification attempts
  SELECT * INTO v_record
  FROM otp_records
  WHERE otp_token = p_otp_token AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  IF v_record.used THEN
    RETURN jsonb_build_object('status', 'used_or_locked');
  END IF;

  IF v_record.expires_at < now() THEN
    RETURN jsonb_build_object('status', 'expired');
  END IF;

  IF v_record.attempts >= 5 THEN
    RETURN jsonb_build_object('status', 'locked');
  END IF;

  IF v_record.otp_hash != p_input_hash THEN
    UPDATE otp_records SET attempts = attempts + 1 WHERE id = v_record.id;
    IF v_record.attempts + 1 >= 5 THEN
      UPDATE otp_records SET used = true WHERE id = v_record.id;
      RETURN jsonb_build_object('status', 'locked');
    END IF;
    RETURN jsonb_build_object('status', 'wrong_code');
  END IF;

  -- Valid — mark as used
  UPDATE otp_records SET used = true WHERE id = v_record.id;
  RETURN jsonb_build_object('status', 'valid');
END;
$$;
