-- ============================================================
-- SafeDrive 2.0 — Supabase Storage Bucket for Snapshot Frames
-- Run this in Supabase SQL Editor AFTER the previous migration
-- ============================================================

-- 1. Create a public storage bucket for snapshot frames
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'snapshot-frames',
  'snapshot-frames',
  true,                       -- Public so frontend can read without auth
  2097152,                    -- 2 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow anonymous reads (frontend)
CREATE POLICY "public_read_snapshot_frames"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'snapshot-frames');

-- 3. Allow service_role (Pi backend) to upload
CREATE POLICY "service_upload_snapshot_frames"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'snapshot-frames');

-- 4. Allow service_role to delete old frames
CREATE POLICY "service_delete_snapshot_frames"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'snapshot-frames');
