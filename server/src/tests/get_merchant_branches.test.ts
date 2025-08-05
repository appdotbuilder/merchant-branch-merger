
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { merchantBranchesTable } from '../db/schema';
import { getMerchantBranches } from '../handlers/get_merchant_branches';

describe('getMerchantBranches', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no branches exist', async () => {
    const result = await getMerchantBranches();
    expect(result).toEqual([]);
  });

  it('should return all merchant branches', async () => {
    // Insert test data
    const testBranches = [
      {
        id: 'branch-1',
        date_added_utc: new Date('2024-01-01T10:00:00Z'),
        name: 'Main Branch',
        source_url: 'https://example.com/main',
        address: '123 Main St',
        merchant_id: 'merchant-1'
      },
      {
        id: 'branch-2',
        date_added_utc: new Date('2024-01-02T10:00:00Z'),
        name: 'Second Branch',
        source_url: 'https://example.com/second',
        address: '456 Second St',
        merchant_id: 'merchant-1'
      }
    ];

    await db.insert(merchantBranchesTable)
      .values(testBranches)
      .execute();

    const result = await getMerchantBranches();

    expect(result).toHaveLength(2);
    
    // Verify first branch
    const branch1 = result.find(b => b.id === 'branch-1');
    expect(branch1).toBeDefined();
    expect(branch1!.name).toEqual('Main Branch');
    expect(branch1!.source_url).toEqual('https://example.com/main');
    expect(branch1!.address).toEqual('123 Main St');
    expect(branch1!.merchant_id).toEqual('merchant-1');
    expect(branch1!.date_added_utc).toBeInstanceOf(Date);

    // Verify second branch
    const branch2 = result.find(b => b.id === 'branch-2');
    expect(branch2).toBeDefined();
    expect(branch2!.name).toEqual('Second Branch');
    expect(branch2!.source_url).toEqual('https://example.com/second');
    expect(branch2!.address).toEqual('456 Second St');
    expect(branch2!.merchant_id).toEqual('merchant-1');
    expect(branch2!.date_added_utc).toBeInstanceOf(Date);
  });

  it('should handle branches with null values', async () => {
    // Insert branch with nullable fields as null
    const testBranch = {
      id: 'branch-null',
      date_added_utc: new Date('2024-01-01T10:00:00Z'),
      name: 'Null Fields Branch',
      source_url: null,
      address: null,
      merchant_id: null
    };

    await db.insert(merchantBranchesTable)
      .values(testBranch)
      .execute();

    const result = await getMerchantBranches();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('branch-null');
    expect(result[0].name).toEqual('Null Fields Branch');
    expect(result[0].source_url).toBeNull();
    expect(result[0].address).toBeNull();
    expect(result[0].merchant_id).toBeNull();
    expect(result[0].date_added_utc).toBeInstanceOf(Date);
  });
});
