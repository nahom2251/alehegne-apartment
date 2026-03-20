-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');

-- Create user approval status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create apartments table
CREATE TABLE public.apartments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  floor INTEGER NOT NULL,
  position TEXT NOT NULL,
  label TEXT NOT NULL,
  tenant_name TEXT,
  tenant_phone TEXT,
  move_in_date DATE,
  monthly_rent NUMERIC(10,2) DEFAULT 0,
  rent_paid_months INTEGER DEFAULT 0,
  is_occupied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create electricity_bills table
CREATE TABLE public.electricity_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID REFERENCES public.apartments(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  kwh NUMERIC(10,2) NOT NULL DEFAULT 0,
  rate NUMERIC(10,4) NOT NULL DEFAULT 0,
  base_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  service_fee NUMERIC(10,2) DEFAULT 16,
  tax_percent NUMERIC(5,2) DEFAULT 15,
  tv_tax NUMERIC(10,2) DEFAULT 10,
  control_tax_percent NUMERIC(5,4) DEFAULT 0.5,
  total NUMERIC(10,2),
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create water_bills table
CREATE TABLE public.water_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID REFERENCES public.apartments(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rent_payments table
CREATE TABLE public.rent_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID REFERENCES public.apartments(id) ON DELETE CASCADE NOT NULL,
  months_paid INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC(10,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electricity_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND status = 'approved'
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Approved admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Super admin can update any profile" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admin can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Apartment policies
CREATE POLICY "Approved users can view apartments" ON public.apartments
  FOR SELECT USING (
    public.is_approved(auth.uid()) OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Super admin and admin can manage apartments" ON public.apartments
  FOR ALL USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    (public.has_role(auth.uid(), 'admin') AND public.is_approved(auth.uid()))
  );

-- Bills policies
CREATE POLICY "Approved users can view electricity bills" ON public.electricity_bills
  FOR SELECT USING (public.is_approved(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage electricity bills" ON public.electricity_bills
  FOR ALL USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    (public.has_role(auth.uid(), 'admin') AND public.is_approved(auth.uid()))
  );

CREATE POLICY "Approved users can view water bills" ON public.water_bills
  FOR SELECT USING (public.is_approved(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage water bills" ON public.water_bills
  FOR ALL USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    (public.has_role(auth.uid(), 'admin') AND public.is_approved(auth.uid()))
  );

CREATE POLICY "Approved users can view rent payments" ON public.rent_payments
  FOR SELECT USING (public.is_approved(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage rent payments" ON public.rent_payments
  FOR ALL USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    (public.has_role(auth.uid(), 'admin') AND public.is_approved(auth.uid()))
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_apartments_updated_at
  BEFORE UPDATE ON public.apartments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  INSERT INTO public.profiles (user_id, full_name, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    CASE WHEN user_count = 0 THEN 'approved'::approval_status ELSE 'pending'::approval_status END
  );

  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed the 7 apartments
INSERT INTO public.apartments (floor, position, label) VALUES
  (2, 'front', '2nd Floor - Front'),
  (2, 'back', '2nd Floor - Back'),
  (3, 'front', '3rd Floor - Front'),
  (3, 'back', '3rd Floor - Back'),
  (4, 'front', '4th Floor - Front'),
  (4, 'back', '4th Floor - Back'),
  (5, 'single', '5th Floor');