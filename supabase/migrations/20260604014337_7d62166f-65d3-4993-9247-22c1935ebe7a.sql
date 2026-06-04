DROP POLICY IF EXISTS "System can insert subscriptions" ON public.subscriptions;

CREATE POLICY "Users can insert default subscription"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND plan = 'free'
  AND status = 'active'
  AND stripe_customer_id IS NULL
  AND stripe_subscription_id IS NULL
);

CREATE POLICY "Admins can insert subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));