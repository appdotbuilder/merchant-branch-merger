
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { merchantBranchesTable } from '../db/schema';
import { type MergeBranchesInput } from '../schema';
import { mergeMerchantBranches } from '../handlers/merge_merchant_branches';
import { eq, inArray } from 'drizzle-orm';

describe('mergeMerchantBranches', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test branches
  const createTestBranches = async () => {
    const branches = [
      {
        id: 'branch-1',
        date_added_utc: new Date('2024-01-01'),
        name: 'Main Branch',
        source_url: 'https://example.com/main',
        address: '123 Main St',
        merchant_id: 'merchant-1'
      },
      {
        id: 'branch-2',
        date_added_utc: new Date('2024-01-02'),
        name: 'Secondary Branch',
        source_url: 'https://example.com/secondary',
        address: '456 Oak Ave',
        merchant_id: 'merchant-1'
      },
      {
        id: 'branch-3',
        date_added_utc: new Date('2024-01-03'),
        name: 'Third Branch',
        source_url: null,
        address: null,
        merchant_id: 'merchant-1'
      }
    ];

    await db.insert(merchantBranchesTable)
      .values(branches)
      .execute();

    return branches;
  };

  it('should merge branches successfully', async () => {
    const testBranches = await createTestBranches();
    
    const input: MergeBranchesInput = {
      canonical_branch_id: 'branch-1',
      branch_ids_to_merge: ['branch-2', 'branch-3']
    };

    const result = await mergeMerchantBranches(input);

    // Should return the canonical branch
    expect(result.id).toEqual('branch-1');
    expect(result.name).toEqual('Main Branch');
    expect(result.source_url).toEqual('https://example.com/main');
    expect(result.address).toEqual('123 Main St');
    expect(result.merchant_id).toEqual('merchant-1');
    expect(result.date_added_utc).toBeInstanceOf(Date);
  });

  it('should delete merged branches from database', async () => {
    await createTestBranches();
    
    const input: MergeBranchesInput = {
      canonical_branch_id: 'branch-1',
      branch_ids_to_merge: ['branch-2', 'branch-3']
    };

    await mergeMerchantBranches(input);

    // Check that merged branches are deleted
    const remainingBranches = await db.select()
      .from(merchantBranchesTable)
      .execute();

    expect(remainingBranches).toHaveLength(1);
    expect(remainingBranches[0].id).toEqual('branch-1');

    // Verify specific branches are gone
    const deletedBranches = await db.select()
      .from(merchantBranchesTable)
      .where(inArray(merchantBranchesTable.id, ['branch-2', 'branch-3']))
      .execute();

    expect(deletedBranches).toHaveLength(0);
  });

  it('should throw error when canonical branch does not exist', async () => {
    await createTestBranches();
    
    const input: MergeBranchesInput = {
      canonical_branch_id: 'nonexistent-branch',
      branch_ids_to_merge: ['branch-2']
    };

    await expect(mergeMerchantBranches(input)).rejects.toThrow(/canonical branch.*not found/i);
  });

  it('should throw error when branch to merge does not exist', async () => {
    await createTestBranches();
    
    const input: MergeBranchesInput = {
      canonical_branch_id: 'branch-1',
      branch_ids_to_merge: ['branch-2', 'nonexistent-branch']
    };

    await expect(mergeMerchantBranches(input)).rejects.toThrow(/branches not found.*nonexistent-branch/i);
  });

  it('should throw error when trying to merge canonical branch with itself', async () => {
    await createTestBranches();
    
    const input: MergeBranchesInput = {
      canonical_branch_id: 'branch-1',
      branch_ids_to_merge: ['branch-1', 'branch-2']
    };

    await expect(mergeMerchantBranches(input)).rejects.toThrow(/cannot merge canonical branch with itself/i);
  });

  it('should handle single branch merge', async () => {
    await createTestBranches();
    
    const input: MergeBranchesInput = {
      canonical_branch_id: 'branch-1',
      branch_ids_to_merge: ['branch-2']
    };

    const result = await mergeMerchantBranches(input);

    expect(result.id).toEqual('branch-1');

    // Verify only one branch was deleted
    const remainingBranches = await db.select()
      .from(merchantBranchesTable)
      .execute();

    expect(remainingBranches).toHaveLength(2);
    expect(remainingBranches.find(b => b.id === 'branch-2')).toBeUndefined();
    expect(remainingBranches.find(b => b.id === 'branch-3')).toBeDefined();
  });

  it('should preserve canonical branch data unchanged', async () => {
    const testBranches = await createTestBranches();
    
    const input: MergeBranchesInput = {
      canonical_branch_id: 'branch-1',
      branch_ids_to_merge: ['branch-2', 'branch-3']
    };

    const result = await mergeMerchantBranches(input);

    // Verify canonical branch data is preserved exactly
    const originalBranch = testBranches[0];
    expect(result.id).toEqual(originalBranch.id);
    expect(result.name).toEqual(originalBranch.name);
    expect(result.source_url).toEqual(originalBranch.source_url);
    expect(result.address).toEqual(originalBranch.address);
    expect(result.merchant_id).toEqual(originalBranch.merchant_id);
    expect(result.date_added_utc).toEqual(originalBranch.date_added_utc);
  });
});
