
CREATE TABLE public.polymarket_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  api_key text NOT NULL,
  api_secret text NOT NULL,
  api_passphrase text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.polymarket_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credentials"
  ON public.polymarket_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON public.polymarket_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON public.polymarket_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON public.polymarket_credentials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
