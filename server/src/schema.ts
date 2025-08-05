
import { z } from 'zod';

// MerchantBranch schema
export const merchantBranchSchema = z.object({
  id: z.string(),
  date_added_utc: z.coerce.date(),
  name: z.string(),
  source_url: z.string().nullable(),
  address: z.string().nullable(),
  merchant_id: z.string().nullable()
});

export type MerchantBranch = z.infer<typeof merchantBranchSchema>;

// Input schema for merging branches
export const mergeBranchesInputSchema = z.object({
  canonical_branch_id: z.string(),
  branch_ids_to_merge: z.array(z.string()).min(1, "At least one branch must be selected for merging")
});

export type MergeBranchesInput = z.infer<typeof mergeBranchesInputSchema>;

// Input schema for getting branch by ID
export const getBranchByIdInputSchema = z.object({
  id: z.string()
});

export type GetBranchByIdInput = z.infer<typeof getBranchByIdInputSchema>;
