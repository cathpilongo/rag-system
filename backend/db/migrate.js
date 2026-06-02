import { pool } from './pool.js';

const ALTERS = [
  `ALTER TABLE drrm_repository ADD COLUMN IF NOT EXISTS source_type VARCHAR(64)`,
  `ALTER TABLE drrm_repository ADD COLUMN IF NOT EXISTS agency_office VARCHAR(255)`,
  `ALTER TABLE drrm_repository ADD COLUMN IF NOT EXISTS doc_title VARCHAR(255)`,
  `ALTER TABLE drrm_repository ADD COLUMN IF NOT EXISTS doc_year VARCHAR(16)`,
  `ALTER TABLE drrm_repository ADD COLUMN IF NOT EXISTS page_section VARCHAR(255)`,
  `ALTER TABLE drrm_repository ADD COLUMN IF NOT EXISTS format_type VARCHAR(64)`,
  `ALTER TABLE drrm_repository ADD COLUMN IF NOT EXISTS priority VARCHAR(32) DEFAULT 'Medium'`,
  `ALTER TABLE drrm_repository ADD COLUMN IF NOT EXISTS source_url TEXT`,
  `ALTER TABLE drrm_repository ADD COLUMN IF NOT EXISTS date_accessed VARCHAR(32)`,
  `ALTER TABLE drrm_repository ADD COLUMN IF NOT EXISTS notes TEXT`,
];

const DATA_FIXES = [
  `UPDATE drrm_repository
   SET doc_title = topic
   WHERE (doc_title IS NULL OR doc_title = '')
     AND topic IS NOT NULL
     AND topic != ''`,
  `UPDATE drrm_repository
   SET hazard_type = 'Typhoon'
   WHERE hazard_type IN ('Rainfall Warning', 'Typhoon Signal', 'Typhoon Preparation')`,
  `UPDATE drrm_repository
   SET hazard_type = 'All_Hazards'
   WHERE hazard_type IN ('Go-Bag', 'Evacuation', 'Emergency Hotlines')`,
  `UPDATE drrm_repository
   SET hazard_type = CASE topic
     WHEN 'Rainfall Warning' THEN 'Typhoon'
     WHEN 'Typhoon Signal' THEN 'Typhoon'
     WHEN 'Typhoon Preparation' THEN 'Typhoon'
     WHEN 'Flood' THEN 'Flood'
     WHEN 'Go-Bag' THEN 'All_Hazards'
     WHEN 'Evacuation' THEN 'All_Hazards'
     WHEN 'Emergency Hotlines' THEN 'All_Hazards'
     ELSE hazard_type
   END
   WHERE hazard_type = topic`,
];

export async function runMigrations() {
  for (const sql of ALTERS) {
    await pool.query(sql);
  }
  for (const sql of DATA_FIXES) {
    await pool.query(sql);
  }
}
