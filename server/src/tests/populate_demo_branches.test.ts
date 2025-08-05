import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { merchantBranchesTable } from '../db/schema';
import { populateDemoBranches } from '../handlers/populate_demo_branches';
import { eq } from 'drizzle-orm';

describe('populateDemoBranches', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should populate demo branches successfully', async () => {
    await populateDemoBranches();

    // Query all branches to verify they were inserted
    const branches = await db.select()
      .from(merchantBranchesTable)
      .execute();

    expect(branches).toHaveLength(6);
    
    // Check specific demo branches exist
    const branch1 = branches.find(b => b.id === 'demo-branch-1');
    expect(branch1).toBeDefined();
    expect(branch1?.name).toBe('Coffee Shop Central');
    expect(branch1?.merchant_id).toBe('merchant-A');
    expect(branch1?.address).toBe('123 Coffee Ave, Downtown');
    expect(branch1?.source_url).toBe('https://example.com/coffee-central');
    expect(branch1?.date_added_utc).toBeInstanceOf(Date);

    const branch2 = branches.find(b => b.id === 'demo-branch-2');
    expect(branch2).toBeDefined();
    expect(branch2?.name).toBe('Coffee Shop North');
    expect(branch2?.source_url).toBeNull();

    const branch6 = branches.find(b => b.id === 'demo-branch-6');
    expect(branch6).toBeDefined();
    expect(branch6?.name).toBe('Snack Joint HQ');
    expect(branch6?.merchant_id).toBe('merchant-C');
  });

  it('should handle duplicate inserts gracefully with onConflictDoNothing', async () => {
    // First population
    await populateDemoBranches();
    
    const firstCount = await db.select()
      .from(merchantBranchesTable)
      .execute();
    expect(firstCount).toHaveLength(6);

    // Second population - should not create duplicates
    await populateDemoBranches();
    
    const secondCount = await db.select()
      .from(merchantBranchesTable)
      .execute();
    expect(secondCount).toHaveLength(6);
  });

  it('should create branches with correct merchant groupings', async () => {
    await populateDemoBranches();

    // Check merchant-A branches
    const merchantABranches = await db.select()
      .from(merchantBranchesTable)
      .where(eq(merchantBranchesTable.merchant_id, 'merchant-A'))
      .execute();
    expect(merchantABranches).toHaveLength(3);

    // Check merchant-B branches
    const merchantBBranches = await db.select()
      .from(merchantBranchesTable)
      .where(eq(merchantBranchesTable.merchant_id, 'merchant-B'))
      .execute();
    expect(merchantBBranches).toHaveLength(2);

    // Check merchant-C branches
    const merchantCBranches = await db.select()
      .from(merchantBranchesTable)
      .where(eq(merchantBranchesTable.merchant_id, 'merchant-C'))
      .execute();
    expect(merchantCBranches).toHaveLength(1);
  });

  it('should create branches with proper date ordering', async () => {
    await populateDemoBranches();

    const branches = await db.select()
      .from(merchantBranchesTable)
      .execute();

    // Check that dates are properly set
    const branch1 = branches.find(b => b.id === 'demo-branch-1');
    const branch6 = branches.find(b => b.id === 'demo-branch-6');

    expect(branch1?.date_added_utc).toEqual(new Date('2023-01-01T10:00:00Z'));
    expect(branch6?.date_added_utc).toEqual(new Date('2023-03-01T08:00:00Z'));
    
    // Verify branch6 was added later than branch1
    expect(branch6?.date_added_utc && branch1?.date_added_utc && branch6.date_added_utc > branch1.date_added_utc).toBe(true);
  });
});