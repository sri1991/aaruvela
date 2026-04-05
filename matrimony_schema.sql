-- matrimony_schema.sql

-- Enums (if not exists, need to be created carefully or just use text with constraints. We will use text constraints for simplicity to avoid enum creation issues on some Supabase instances)

CREATE TABLE IF NOT EXISTS public.matrimony_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) UNIQUE,
    parishat_id TEXT,
    full_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('MALE', 'FEMALE')) NOT NULL,
    father_guardian_name TEXT,
    age INTEGER,
    dob DATE NOT NULL,
    tob TIME NOT NULL,
    gotram TEXT,
    star_with_pada TEXT,
    occupation TEXT,
    annual_income TEXT,
    particulars TEXT,
    requirement TEXT,
    contact_no TEXT,
    email TEXT,
    photo_url TEXT,
    payment_reference TEXT,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.matrimony_profiles ENABLE ROW LEVEL SECURITY;

-- 1. Users can view all active and verified profiles.
CREATE POLICY "Users can view verified active profiles" 
    ON public.matrimony_profiles FOR SELECT
    USING (status = 'ACTIVE' AND payment_status = 'VERIFIED');

-- 2. Users can view their own profile regardless of status.
CREATE POLICY "Users can view their own profile"
    ON public.matrimony_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Users can insert their own profile.
CREATE POLICY "Users can insert their own profile" 
    ON public.matrimony_profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 4. Users can update their own profile.
CREATE POLICY "Users can update their own profile" 
    ON public.matrimony_profiles FOR UPDATE 
    USING (auth.uid() = user_id);
