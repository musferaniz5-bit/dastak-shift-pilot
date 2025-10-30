-- Add chai_expense and online_payment_name columns to rider_entries table
ALTER TABLE public.rider_entries
ADD COLUMN chai_expense integer NOT NULL DEFAULT 0,
ADD COLUMN online_payment_name text;