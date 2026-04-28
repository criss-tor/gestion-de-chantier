-- Create gantt_markers table
CREATE TABLE IF NOT EXISTS gantt_markers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chantier_id UUID REFERENCES chantiers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  end_date DATE,
  type VARCHAR(50) NOT NULL DEFAULT 'appointment',
  label TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gantt_markers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON gantt_markers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON gantt_markers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON gantt_markers
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON gantt_markers
  FOR DELETE USING (true);
