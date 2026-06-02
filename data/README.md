# DRRM data for local ingest

Place your exported CSV or Excel here, then run:

```cmd
cd backend
npm run ingest -- ..\data\your_export.csv
```

## Base44 export columns (supported)

Minimum required: `chunk_id`, `localized_text`

Recommended columns from Base44 `DRRMChunk` entity:

| Column | Maps to |
|--------|---------|
| `chunk_id` | Unique ID |
| `source_type` | source |
| `agency_office` | agency |
| `hazard_type` | topic + hazard_type |
| `phase` | phase |
| `original_text` | original_text |
| `localized_text` | localized_text (required for chat) |
| `validation_status` | Only `Approved` rows are used in chat |

Simple CSV format also works: `source`, `agency`, `topic`, `original_text`, `localized_text`, `chunk_id`

See `sample_drrm_repository.csv` for an example.
