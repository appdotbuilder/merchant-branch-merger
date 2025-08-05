import { db } from '../db';
import { merchantBranchesTable } from '../db/schema';
import type { NewMerchantBranch } from '../db/schema';

const DEMO_BRANCHES_TO_INSERT: NewMerchantBranch[] = [
  {
    id: 'demo-branch-1',
    date_added_utc: new Date('2023-01-01T10:00:00Z'),
    name: 'Coffee Shop Central',
    source_url: 'https://example.com/coffee-central',
    address: '123 Coffee Ave, Downtown',
    merchant_id: 'merchant-A'
  },
  {
    id: 'demo-branch-2',
    date_added_utc: new Date('2023-01-05T11:00:00Z'),
    name: 'Coffee Shop North',
    source_url: null,
    address: '456 North St, Suburbia',
    merchant_id: 'merchant-A'
  },
  {
    id: 'demo-branch-3',
    date_added_utc: new Date('2023-01-10T09:30:00Z'),
    name: 'Coffee Shop Express',
    source_url: 'https://example.com/coffee-express',
    address: '789 Express Ln, Mall',
    merchant_id: 'merchant-A'
  },
  {
    id: 'demo-branch-4',
    date_added_utc: new Date('2023-02-01T14:00:00Z'),
    name: 'Teahouse Grand',
    source_url: null,
    address: '101 Tea Blvd, Arts District',
    merchant_id: 'merchant-B'
  },
  {
    id: 'demo-branch-5',
    date_added_utc: new Date('2023-02-05T15:00:00Z'),
    name: 'Teahouse Mini',
    source_url: 'https://example.com/tea-mini',
    address: '202 Mini St, Old Town',
    merchant_id: 'merchant-B'
  },
  {
    id: 'demo-branch-6',
    date_added_utc: new Date('2023-03-01T08:00:00Z'),
    name: 'Snack Joint HQ',
    source_url: null,
    address: '303 Snack Rd, Industrial Park',
    merchant_id: 'merchant-C'
  }
];

export async function populateDemoBranches(): Promise<void> {
  try {
    for (const branch of DEMO_BRANCHES_TO_INSERT) {
      await db.insert(merchantBranchesTable)
        .values(branch)
        .onConflictDoNothing({ target: merchantBranchesTable.id })
        .execute();
    }
    console.log('Demo branches populated successfully or already exist.');
  } catch (error) {
    console.error('Failed to populate demo branches:', error);
    throw error;
  }
}