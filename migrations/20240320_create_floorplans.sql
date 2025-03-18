-- Create floorplans table
CREATE TABLE IF NOT EXISTS floorplans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  original_width INTEGER NOT NULL,
  original_height INTEGER NOT NULL,
  pixels_per_meter DOUBLE PRECISION NOT NULL,
  calibration_method TEXT NOT NULL CHECK (calibration_method IN ('door', 'grid', 'manual')),
  regions JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(property_id)
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_floorplans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_floorplans_updated_at
  BEFORE UPDATE ON floorplans
  FOR EACH ROW
  EXECUTE FUNCTION update_floorplans_updated_at();