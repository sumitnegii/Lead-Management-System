# TODO: Change Frontend from localhost to Render Backend

## Steps (Approved Plan):
- [ ] 1. Edit all 8 API proxy files: Replace `process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"` with `process.env.NEXT_PUBLIC_API_URL`
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
