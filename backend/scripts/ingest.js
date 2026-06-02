import path from 'path';
import dotenv from 'dotenv';
import { ingestFile } from '../services/ingestFile.js';

dotenv.config();

const fileArg = process.argv[2];
if (!fileArg) {
  console.error('Usage: npm run ingest -- ..\\data\\sample_drrm_repository.csv');
  process.exit(1);
}

ingestFile(path.resolve(fileArg))
  .then(() => {
    console.log('Ingestion complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
