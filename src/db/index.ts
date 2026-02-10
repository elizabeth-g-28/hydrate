import Dexie, { type EntityTable } from 'dexie';
import type { WaterEntry } from '../types';

const db = new Dexie('HydrateDB') as Dexie & {
  waterEntries: EntityTable<WaterEntry, 'id'>;
};

db.version(1).stores({
  waterEntries: '++id, date, timestamp',
});

export { db };
