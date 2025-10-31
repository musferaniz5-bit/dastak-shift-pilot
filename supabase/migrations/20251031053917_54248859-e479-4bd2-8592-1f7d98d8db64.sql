-- Fix public pricing exposure - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view order settings" ON order_settings;

CREATE POLICY "Authenticated users can view settings"
ON order_settings
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Allow riders to update their own open entries
CREATE POLICY "Riders can update their own open entries"
ON rider_entries
FOR UPDATE
TO authenticated
USING (
  rider_id = auth.uid() 
  AND status = 'open'
)
WITH CHECK (
  rider_id = auth.uid()
  AND status = 'open'
);

-- Allow admins to delete entries
CREATE POLICY "Admins can delete entries"
ON rider_entries
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add constraint to limit online_payments array size
ALTER TABLE rider_entries 
ADD CONSTRAINT online_payments_size_limit 
CHECK (jsonb_array_length(online_payments) <= 50);

-- Add constraint to limit other_expense_name length
ALTER TABLE rider_entries
ADD CONSTRAINT other_expense_name_length
CHECK (char_length(other_expense_name) <= 200);