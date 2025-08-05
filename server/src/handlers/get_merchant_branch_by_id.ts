
import { db } from '../db';
import { merchantBranchesTable } from '../db/schema';
import { type GetBranchByIdInput, type MerchantBranch } from '../schema';
import { eq } from 'drizzle-orm';

export const getMerchantBranchById = async (input: GetBranchByIdInput): Promise<MerchantBranch | null> => {
  try {
    const result = await db.select()
      .from(merchantBranchesTable)
      .where(eq(merchantBranchesTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get merchant branch by ID:', error);
    throw error;
  }
};
