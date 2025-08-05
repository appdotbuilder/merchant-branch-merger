
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { mergeBranchesInputSchema, getBranchByIdInputSchema } from './schema';
import { getMerchantBranches } from './handlers/get_merchant_branches';
import { getMerchantBranchById } from './handlers/get_merchant_branch_by_id';
import { mergeMerchantBranches } from './handlers/merge_merchant_branches';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  getMerchantBranches: publicProcedure
    .query(() => getMerchantBranches()),
  getMerchantBranchById: publicProcedure
    .input(getBranchByIdInputSchema)
    .query(({ input }) => getMerchantBranchById(input)),
  mergeMerchantBranches: publicProcedure
    .input(mergeBranchesInputSchema)
    .mutation(({ input }) => mergeMerchantBranches(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
