
import { db } from '../db';
import { merchantBranchesTable } from '../db/schema';
import { type MerchantBranch } from '../schema';

export async function getMerchantBranches(): Promise<MerchantBranch[]> {
  try {
    const results = await db.select()
      .from(merchantBranchesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch merchant branches:', error);
    throw error;
  }
}
