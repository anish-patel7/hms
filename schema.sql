-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    dob TEXT NOT NULL, -- Stored as DD-MM
    area TEXT NOT NULL,
    marriage_date TEXT, -- Optional, stored as DD-MM
    profile_photo TEXT, -- Optional, URL or Base64
    password TEXT NOT NULL, -- Hashed password
    pin TEXT, -- 4-digit PIN for overlapping passwords
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared app data table (syncs trips, polls, posts, albums, etc. across all browsers)
CREATE TABLE IF NOT EXISTS public.shared_data (
    id TEXT PRIMARY KEY DEFAULT 'app_state',
    data JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_data ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for signup (so unauthenticated users can insert their signup details)
CREATE POLICY "Allow anonymous signup" 
ON public.users 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow reading all users (to check logins and show member highlights)
CREATE POLICY "Allow public read access" 
ON public.users 
FOR SELECT 
TO anon 
USING (true);

-- Allow public updates (for photo update by Admin and status approvals)
CREATE POLICY "Allow public updates"
ON public.users
FOR UPDATE
TO anon
USING (true);

-- Allow public deletes (for Admin removing users)
CREATE POLICY "Allow public deletes"
ON public.users
FOR DELETE
TO anon
USING (true);

-- Shared data policies
CREATE POLICY "Allow public read shared_data"
ON public.shared_data
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow public insert shared_data"
ON public.shared_data
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public update shared_data"
ON public.shared_data
FOR UPDATE
TO anon
USING (true);
