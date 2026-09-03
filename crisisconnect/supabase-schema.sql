-- =========================================================
-- CrisisConnect - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- =========================================================

-- Enable PostGIS extension for high-performance geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Citizens Table (Registration & Auth)
CREATE TABLE IF NOT EXISTS public.citizens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  age INTEGER DEFAULT 25,
  blood_group TEXT DEFAULT 'O+',
  email TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  ice_name TEXT,
  ice_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Device Tokens Table (For Cross-Device Push Notifications)
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_phone TEXT,
  user_name TEXT,
  blood_group TEXT,
  role TEXT DEFAULT 'CITIZEN',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Emergency Requests Table
CREATE TABLE IF NOT EXISTS public.emergency_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- BLOOD, OXYGEN, MEDICINES, FOOD, SHELTER, TRANSPORTATION, RESCUE
  urgency TEXT NOT NULL DEFAULT 'HIGH', -- CRITICAL, HIGH, MEDIUM, LOW
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, ASSIGNED, IN_PROGRESS, RESOLVED, OUTDATED
  verification_status TEXT DEFAULT 'UNVERIFIED', -- UNVERIFIED, VERIFIED, REJECTED
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  contact_name TEXT,
  contact_phone TEXT,
  people_count INTEGER DEFAULT 1,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_name TEXT,
  vulnerabilities TEXT[],
  assigned_ngo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Relief Resources Table (Oxygen, Blood, Food, Medicine Inventory)
CREATE TABLE IF NOT EXISTS public.relief_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'units',
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  managed_by TEXT,
  contact_phone TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Supabase Realtime replication on Emergency Requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_tokens;

-- Create Spatial Index if using PostGIS
CREATE INDEX IF NOT EXISTS idx_requests_lat_lng ON public.emergency_requests(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON public.device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_citizens_phone ON public.citizens(phone);
