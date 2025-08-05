
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { merchantBranchesTable } from '../db/schema';
import { type GetBranchByIdInput } from '../schema';
import { getMerchantBranchById } from '../handlers/get_merchant_branch_by_id';

// Test data
const testBranch = {
  id: 'branch-123',
  date_added_utc: new Date('2024-01-15T10:30:00Z'),
  name: 'Main Branch',
  source_url: 'https://example.com/branch',
  address: '123 Main St, City, State',
  merchant_id: 'merchant-456'
};

const testInput: GetBranchByIdInput = {
  id: 'branch-123'
};

describe('getMerchantBranchById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return merchant branch when found', async () => {
    // Create test branch
    await db.insert(merchantBranchesTable)
      .values(testBranch)
      .execute();

    const result = await getMerchantBranchById(testInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('branch-123');
    expect(result!.name).toEqual('Main Branch');
    expect(result!.source_url).toEqual('https://example.com/branch');
    expect(result!.address).toEqual('123 Main St, City, State');
    expect(result!.merchant_id).toEqual('merchant-456');
    expect(result!.date_added_utc).toBeInstanceOf(Date);
    expect(result!.date_added_utc.getTime()).toEqual(testBranch.date_added_utc.getTime());
  });

  it('should return null when branch not found', async () => {
    const nonExistentInput: GetBranchByIdInput = {
      id: 'non-existent-branch'
    };

    const result = await getMerchantBranchById(nonExistentInput);

    expect(result).toBeNull();
  });

  it('should handle branch with null optional fields', async () => {
    const branchWithNulls = {
      id: 'branch-minimal',
      date_added_utc: new Date('2024-01-20T15:45:00Z'),
      name: 'Minimal Branch',
      source_url: null,
      address: null,
      merchant_id: null
    };

    await db.insert(merchantBranchesTable)
      .values(branchWithNulls)
      .execute();

    const input: GetBranchByIdInput = {
      id: 'branch-minimal'
    };

    const result = await getMerchantBranchById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('branch-minimal');
    expect(result!.name).toEqual('Minimal Branch');
    expect(result!.source_url).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.merchant_id).toBeNull();
    expect(result!.date_added_utc).toBeInstanceOf(Date);
  });
});
