-- Migration: Create functions for atomic component position updates

-- Function to move a component to a new position atomically
CREATE OR REPLACE FUNCTION move_component_position(
  p_component_id VARCHAR(100),
  p_old_page VARCHAR(100),
  p_old_section VARCHAR(100),
  p_old_order INTEGER,
  p_new_page VARCHAR(100),
  p_new_section VARCHAR(100),
  p_new_order INTEGER,
  p_new_parent VARCHAR(100) DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_new_version VARCHAR(50);
  v_current_version VARCHAR(50);
BEGIN
  -- Get current version for optimistic locking
  SELECT version INTO v_current_version
  FROM page_components
  WHERE component_id = p_component_id AND is_active = true;
  
  -- Calculate new version
  v_new_version := (COALESCE(v_current_version::INTEGER, 0) + 1)::VARCHAR;
  
  -- If moving within the same section
  IF p_old_page = p_new_page AND p_old_section = p_new_section THEN
    IF p_old_order < p_new_order THEN
      -- Moving down: shift components between old and new position up
      UPDATE page_components
      SET position_order = position_order - 1,
          last_modified_at = NOW(),
          last_modified_by = COALESCE(p_user_id, last_modified_by)
      WHERE page_name = p_new_page
        AND position_section = p_new_section
        AND position_order > p_old_order
        AND position_order <= p_new_order
        AND is_active = true
        AND component_id != p_component_id;
        
    ELSIF p_old_order > p_new_order THEN
      -- Moving up: shift components between new and old position down
      UPDATE page_components
      SET position_order = position_order + 1,
          last_modified_at = NOW(),
          last_modified_by = COALESCE(p_user_id, last_modified_by)
      WHERE page_name = p_new_page
        AND position_section = p_new_section
        AND position_order >= p_new_order
        AND position_order < p_old_order
        AND is_active = true
        AND component_id != p_component_id;
    END IF;
  ELSE
    -- Moving to different section: shift components in both sections
    
    -- Shift components in old section up
    UPDATE page_components
    SET position_order = position_order - 1,
        last_modified_at = NOW(),
        last_modified_by = COALESCE(p_user_id, last_modified_by)
    WHERE page_name = p_old_page
      AND position_section = p_old_section
      AND position_order > p_old_order
      AND is_active = true;

    -- Shift components in new section down
    UPDATE page_components
    SET position_order = position_order + 1,
        last_modified_at = NOW(),
        last_modified_by = COALESCE(p_user_id, last_modified_by)
    WHERE page_name = p_new_page
      AND position_section = p_new_section
      AND position_order >= p_new_order
      AND is_active = true;
  END IF;

  -- Update the component's position
  UPDATE page_components
  SET page_name = p_new_page,
      position_section = p_new_section,
      position_order = p_new_order,
      parent_component_id = p_new_parent,
      version = v_new_version,
      last_modified_by = COALESCE(p_user_id, last_modified_by),
      last_modified_at = NOW()
  WHERE component_id = p_component_id
    AND is_active = true;

  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Component not found or update failed: %', p_component_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to validate component positions in a section
CREATE OR REPLACE FUNCTION validate_component_positions(
  p_page_name VARCHAR(100),
  p_section_id VARCHAR(100)
)
RETURNS TABLE(
  component_id VARCHAR(100),
  expected_order INTEGER,
  actual_order INTEGER,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH ordered_components AS (
    SELECT 
      pc.component_id,
      pc.position_order,
      ROW_NUMBER() OVER (ORDER BY pc.position_order) - 1 AS expected_order
    FROM page_components pc
    WHERE pc.page_name = p_page_name
      AND pc.position_section = p_section_id
      AND pc.is_active = true
    ORDER BY pc.position_order
  )
  SELECT 
    oc.component_id,
    oc.expected_order::INTEGER,
    oc.position_order::INTEGER,
    (oc.expected_order = oc.position_order) AS is_valid
  FROM ordered_components oc;
END;
$$ LANGUAGE plpgsql;

-- Function to fix component position gaps in a section
CREATE OR REPLACE FUNCTION fix_component_position_gaps(
  p_page_name VARCHAR(100),
  p_section_id VARCHAR(100),
  p_user_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_fixed_count INTEGER := 0;
  v_component RECORD;
  v_new_order INTEGER := 0;
BEGIN
  -- Update positions to remove gaps
  FOR v_component IN
    SELECT component_id, position_order
    FROM page_components
    WHERE page_name = p_page_name
      AND position_section = p_section_id
      AND is_active = true
    ORDER BY position_order
  LOOP
    IF v_component.position_order != v_new_order THEN
      UPDATE page_components
      SET position_order = v_new_order,
          last_modified_at = NOW(),
          last_modified_by = COALESCE(p_user_id, last_modified_by)
      WHERE component_id = v_component.component_id;
      
      v_fixed_count := v_fixed_count + 1;
    END IF;
    
    v_new_order := v_new_order + 1;
  END LOOP;
  
  RETURN v_fixed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get component hierarchy for a page
CREATE OR REPLACE FUNCTION get_component_hierarchy(p_page_name VARCHAR(100))
RETURNS TABLE(
  component_id VARCHAR(100),
  component_type VARCHAR(100),
  parent_component_id VARCHAR(100),
  position_section VARCHAR(100),
  position_order INTEGER,
  level INTEGER,
  path TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE component_tree AS (
    -- Base case: root components (no parent)
    SELECT 
      pc.component_id,
      pc.component_type,
      pc.parent_component_id,
      pc.position_section,
      pc.position_order,
      0 as level,
      ARRAY[pc.component_id] as path
    FROM page_components pc
    WHERE pc.page_name = p_page_name
      AND pc.is_active = true
      AND pc.parent_component_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child components
    SELECT 
      pc.component_id,
      pc.component_type,
      pc.parent_component_id,
      pc.position_section,
      pc.position_order,
      ct.level + 1,
      ct.path || pc.component_id
    FROM page_components pc
    INNER JOIN component_tree ct ON pc.parent_component_id = ct.component_id
    WHERE pc.page_name = p_page_name
      AND pc.is_active = true
  )
  SELECT 
    ct.component_id,
    ct.component_type,
    ct.parent_component_id,
    ct.position_section,
    ct.position_order,
    ct.level,
    ct.path
  FROM component_tree ct
  ORDER BY ct.position_section, ct.position_order, ct.level;
END;
$$ LANGUAGE plpgsql;