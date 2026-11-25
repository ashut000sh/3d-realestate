# Meeting notes

One file per meeting, named by date: `YYYY-MM-DD.md` (for example `2026-11-24.md`).
Owner: M3 (Nirmal Yadav). These notes become the project log appendix of the final report,
so write them on the day, keep them honest, and never edit old notes later
(add a correction in the next meeting's notes instead).

## How to add notes for a meeting

1. Copy `TEMPLATE.md` to a new file named with the meeting date.
2. Fill in every section during or right after the meeting. Write "None" rather than deleting a section.
3. Make a small branch, commit, open a pull request into `dev`:

   ```bash
   git checkout dev && git pull
   git checkout -b feature/docs-notes-2026-12-01
   git add docs/meetings/2026-12-01.md
   git commit -m "docs(meetings): notes for 2026-12-01"
   git push -u origin feature/docs-notes-2026-12-01
   ```

4. Add the same week's entry to `docs/PROGRESS.md` (it can go in the same pull request).

## Meetings so far

| Date | Main decisions |
|---|---|
| _(add a row for each meeting)_ | |
