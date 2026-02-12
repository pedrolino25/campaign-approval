-- Create function to check if organization has at least one active owner
CREATE OR REPLACE FUNCTION check_organization_has_owner()
RETURNS TRIGGER AS $$
DECLARE
  owner_count INTEGER;
  org_id TEXT;
BEGIN
  -- Determine organization_id based on operation type
  IF TG_OP = 'DELETE' THEN
    org_id := OLD.organization_id;
    
    -- Count active owners excluding the one being deleted
    SELECT COUNT(*) INTO owner_count
    FROM users
    WHERE organization_id = org_id
      AND role = 'OWNER'
      AND archived_at IS NULL
      AND id != OLD.id;
    
    -- If removing this owner would leave zero owners, prevent it
    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last OWNER from the organization';
    END IF;
    
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    org_id := NEW.organization_id;
    
    -- Count active owners excluding the one being updated
    SELECT COUNT(*) INTO owner_count
    FROM users
    WHERE organization_id = org_id
      AND role = 'OWNER'
      AND archived_at IS NULL
      AND id != NEW.id;
    
    -- If this update would remove the last owner, prevent it
    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot demote or archive the last OWNER from the organization';
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger BEFORE UPDATE on users table
CREATE TRIGGER ensure_organization_has_owner_update
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.role = 'OWNER' AND (NEW.role != 'OWNER' OR NEW.archived_at IS NOT NULL))
  EXECUTE FUNCTION check_organization_has_owner();

-- Create trigger BEFORE DELETE on users table
CREATE TRIGGER ensure_organization_has_owner_delete
  BEFORE DELETE ON users
  FOR EACH ROW
  WHEN (OLD.role = 'OWNER' AND OLD.archived_at IS NULL)
  EXECUTE FUNCTION check_organization_has_owner();
