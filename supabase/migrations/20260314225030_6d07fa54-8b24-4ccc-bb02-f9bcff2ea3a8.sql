
CREATE TABLE public.saved_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bundle_id TEXT NOT NULL,
  bundle_title TEXT NOT NULL,
  bundle_category TEXT NOT NULL DEFAULT '',
  bundle_icon TEXT NOT NULL DEFAULT '📊',
  contracts JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, bundle_id)
);

ALTER TABLE public.saved_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved bundles"
  ON public.saved_bundles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved bundles"
  ON public.saved_bundles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved bundles"
  ON public.saved_bundles FOR DELETE
  USING (auth.uid() = user_id);
