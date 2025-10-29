-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'rider');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create order settings table for configurable order fees
CREATE TABLE public.order_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_60 INTEGER NOT NULL DEFAULT 60,
  fee_100 INTEGER NOT NULL DEFAULT 100,
  fee_150 INTEGER NOT NULL DEFAULT 150,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_settings ENABLE ROW LEVEL SECURITY;

-- Create rider entries table for shift reports
CREATE TABLE public.rider_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('day', 'night')),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  open_balance INTEGER NOT NULL DEFAULT 0,
  orders_60 INTEGER NOT NULL DEFAULT 0,
  orders_100 INTEGER NOT NULL DEFAULT 0,
  orders_150 INTEGER NOT NULL DEFAULT 0,
  commission INTEGER NOT NULL DEFAULT 0,
  other_fee INTEGER NOT NULL DEFAULT 0,
  petrol_expense INTEGER NOT NULL DEFAULT 0,
  cash_orders INTEGER NOT NULL DEFAULT 0,
  cash_collected BOOLEAN NOT NULL DEFAULT false,
  online_payment INTEGER NOT NULL DEFAULT 0,
  closing_balance INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rider_entries ENABLE ROW LEVEL SECURITY;

-- Create dues table for tracking pending customer payments
CREATE TABLE public.dues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dues ENABLE ROW LEVEL SECURITY;

-- Insert default order settings
INSERT INTO public.order_settings (fee_60, fee_100, fee_150) VALUES (60, 100, 150);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_settings_updated_at
BEFORE UPDATE ON public.order_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rider_entries_updated_at
BEFORE UPDATE ON public.rider_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dues_updated_at
BEFORE UPDATE ON public.dues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for order_settings
CREATE POLICY "Anyone can view order settings"
ON public.order_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can update order settings"
ON public.order_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rider_entries
CREATE POLICY "Riders can view their own entries"
ON public.rider_entries FOR SELECT
TO authenticated
USING (rider_id = auth.uid());

CREATE POLICY "Riders can insert their own entries"
ON public.rider_entries FOR INSERT
TO authenticated
WITH CHECK (rider_id = auth.uid());

CREATE POLICY "Admins can view all entries"
ON public.rider_entries FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all entries"
ON public.rider_entries FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for dues
CREATE POLICY "Riders can view their own dues"
ON public.dues FOR SELECT
TO authenticated
USING (rider_id = auth.uid());

CREATE POLICY "Riders can insert their own dues"
ON public.dues FOR INSERT
TO authenticated
WITH CHECK (rider_id = auth.uid());

CREATE POLICY "Admins can view all dues"
ON public.dues FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all dues"
ON public.dues FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));