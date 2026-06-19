-- Restrict documents bucket to allowed MIME types and enforce file size limit.
-- Prevents server-side acceptance of disallowed file types regardless of client-side validation.
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  file_size_limit = 10485760  -- 10 MB in bytes
WHERE id = 'documents';
