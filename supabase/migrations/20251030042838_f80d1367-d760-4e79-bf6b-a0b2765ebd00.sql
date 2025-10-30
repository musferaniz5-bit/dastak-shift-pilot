-- Replace cash_orders with other_expense fields and update online_payment structure
ALTER TABLE public.rider_entries
DROP COLUMN cash_orders,
DROP COLUMN online_payment,
DROP COLUMN online_payment_name,
ADD COLUMN other_expense_name text,
ADD COLUMN other_expense_amount integer NOT NULL DEFAULT 0,
ADD COLUMN online_payments jsonb DEFAULT '[]'::jsonb;