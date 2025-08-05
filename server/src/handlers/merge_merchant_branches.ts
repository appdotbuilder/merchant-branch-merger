
import { db } from '../db';
import { merchantBranchesTable } from '../db/schema';
import { type MergeBranchesInput, type MerchantBranch } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export async function mergeMerchantBranches(input: MergeBranchesInput): Promise<MerchantBranch> {
  try {
    // Start transaction for data consistency
    return await db.transaction(async (tx) => {
      // 1. Validate that canonical branch exists
      const canonicalBranches = await tx.select()
        .from(merchantBranchesTable)
        .where(eq(merchantBranchesTable.id, input.canonical_branch_id))
        .execute();

      if (canonicalBranches.length === 0) {
        throw new Error(`Canonical branch with ID ${input.canonical_branch_id} not found`);
      }

      const canonicalBranch = canonicalBranches[0];

      // 2. Validate that all branches to merge exist
      const branchesToMerge = await tx.select()
        .from(merchantBranchesTable)
        .where(inArray(merchantBranchesTable.id, input.branch_ids_to_merge))
        .execute();

      if (branchesToMerge.length !== input.branch_ids_to_merge.length) {
        const foundIds = branchesToMerge.map(b => b.id);
        const missingIds = input.branch_ids_to_merge.filter(id => !foundIds.includes(id));
        throw new Error(`Branches not found: ${missingIds.join(', ')}`);
      }

      // 3. Prevent merging canonical branch with itself
      if (input.branch_ids_to_merge.includes(input.canonical_branch_id)) {
        throw new Error('Cannot merge canonical branch with itself');
      }

      // 4. Delete the branches that are being merged
      await tx.delete(merchantBranchesTable)
        .where(inArray(merchantBranchesTable.id, input.branch_ids_to_merge))
        .execute();

      // 5. Return the canonical branch
      return {
        id: canonicalBranch.id,
        date_added_utc: canonicalBranch.date_added_utc,
        name: canonicalBranch.name,
        source_url: canonicalBranch.source_url,
        address: canonicalBranch.address,
        merchant_id: canonicalBranch.merchant_id
      };
    });
  } catch (error) {
    console.error('Branch merge failed:', error);
    throw error;
  }
}
