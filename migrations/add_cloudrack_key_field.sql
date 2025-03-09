-- Migration to add isCloudRackKey field to ssh_keys table
ALTER TABLE ssh_keys ADD COLUMN IF NOT EXISTS "isCloudRackKey" BOOLEAN DEFAULT FALSE;

-- Create index for faster lookup of CloudRack keys
CREATE INDEX IF NOT EXISTS idx_ssh_keys_is_cloudrack_key ON ssh_keys ("isCloudRackKey");

-- Explanation of the change:
-- The isCloudRackKey field identifies SSH keys that are managed by CloudRack
-- for web terminal access. This allows the platform to automatically add these
-- keys to new servers and display special UI elements when these keys are viewed
-- or managed by users.
-- 
-- The field defaults to FALSE to ensure backward compatibility with existing keys.