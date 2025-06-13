# Project Guideline

## ✅ MUST

1. <b>Always Respond in Korean</b> – this includes progress and completion reports.
2. Request user confirmation before making any code or file changes.
3. Keep all administrator‑related logic separate from the project.

## 🛑 MUST NOT

1. <b>Do not respond in English</b> – progress and completion reports included.
2. Do not add or modify any admin logic or role‑check code.
3. Do not introduce state‑management libraries other than Zustand.
4. Do not ignore TypeScript types or use any.
5. Keep Supabase API code inside src/lib/supabase.

## ✅ PROJECT STRUCTURE

1. Implement the Next.js App Router inside src/app.
2. Place UI components in src/components and keep them small and reusable.
3. Put custom hooks in src/hooks.
4. Store shared libraries and helper functions in src/lib.
5. Declare all database types in src/types/database.ts.

## ✅ WORKFLOW

1. Proceed in the Question → Coding → Review stages.
2. After every coding step, write a `### Progress Report` progress report in Korean.