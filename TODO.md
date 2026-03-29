# CRM Lead Detail Page Implementation
✅ Plan approved by user

## Backend Changes [3/3] ✅
- [✅] 1. Add `notes: String` to `backend/models/lead.js`
- [✅] 2. Add `PUT /update-lead` endpoint to `backend/server.js`
- [✅] 3. Install axios in backend (`cd backend && npm i axios`)

## Frontend Changes [4/4] ✅
- [✅] 1. Add Edit button linking to `/lead/[id]` in `frontend/app/page.tsx`
- [✅] 2. Create `frontend/app/lead/[id]/page.tsx` (detail form + toast)
- [✅] 3. Create `frontend/app/api/leads/[id]/route.ts` (GET single lead)
- [✅] 4. Create `frontend/app/api/update-lead/route.ts` (PUT proxy)

## Setup [2/3] ✅
- [✅] 1. Install react-hot-toast (`cd frontend && npm i react-hot-toast`)
- [ ] 2. Restart backend server
- [ ] 3. Test full flow + get n8n webhook URL

**Next:** Backend: `cd backend && node server.js` then test edit flow!

