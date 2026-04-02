# TODO: Change Frontend from localhost to Render Backend

## Steps (Approved Plan):
- [x] 1. API proxy files already use `process.env.NEXT_PUBLIC_API_URL` ✅
- [x] 2. frontend/.env.local created for local: `NEXT_PUBLIC_API_URL=http://localhost:4000` ✅
- [x] 3. Deployed Frontend (Vercel) - Set `NEXT_PUBLIC_API_URL=https://lead-management-system-3-mr50.onrender.com` on Vercel dashboard
- [x] 4. Backend deployed Render ✅
**COMPLETE** 🎉
  - frontend/app/api/leads/route.ts
  - frontend/app/api/leads/[id]/route.ts  
  - frontend/app/api/my-leads/[chatId]/route.ts
  - frontend/app/api/agents/route.ts
  - frontend/app/api/agents/[chatId]/route.ts
  - frontend/app/api/assign/route.ts
  - frontend/app/api/update-lead/route.ts
  - frontend/app/api/unassign-lead/route.ts
- [ ] 2. Create frontend/.env.local: `NEXT_PUBLIC_API_URL=https://lead-management-system-3-mr50.onrender.com`
- [ ] 3. Test: `cd frontend && npm run dev`, visit localhost:3000/api/leads
- [ ] 4. Deploy frontend, set env var there.
- [ ] 5. Mark complete & remove this TODO.

Progress tracked here.
