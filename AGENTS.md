<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Git workflow

After each clear, self-contained group of changes is finished and the project build passes, automatically create a Git commit for that group.

Before committing:

1. Run `git status` and review the changed files.
2. Run the appropriate verification, usually `npm.cmd run build` for this app.
3. Do not include ignored, local, secret, cache, build output, screenshot, archive, or one-off prompt files.
4. Use a concise commit message that describes the completed change group.

If the build cannot be run or fails, report that clearly and do not commit unless the user explicitly asks.

## UI font-weight incident playbook

This app has a global `bold-mode` setting. It deliberately changes Tailwind font weight utility classes:

- `.bold-mode .font-normal` becomes heavier.
- `.bold-mode .font-medium` becomes heavier.
- `.bold-mode .font-semibold` becomes much heavier.
- `.bold-mode .font-bold` becomes very heavy.

Trigger this playbook for any request about text being too bold, too thin, too heavy, too light, or visually unbalanced. This is especially important in `components/AIAssistant.tsx`.

Two prior failures caused this rule:

1. Heavy text was not actually made light.
   The mistake was trusting JSX edits and Tailwind class changes without checking the running CSS. `font-medium` and `font-semibold` were still being lifted by `bold-mode`, and a local `.ai-assistant` CSS rule was not present in the generated dev CSS at the time.

2. A title made from light to heavier still looked too thin.
   The mistake was assuming `500` would be visually enough because it is numerically heavier than `400`. In Chinese UI text, especially next to a heavy AI logo, `500` can still look too light. The AI assistant title needs a clearly stronger local weight such as `600`, while the body remains `400`.

Do not trust source edits alone. Font-weight work is not done until the rendered/effective result is checked or a clear fallback verification is reported.

Required checks before and after any font-weight change:

1. Check the exact JSX/CSS source for the target element and its parents.
2. Check whether the target or any parent is inside `bold-mode`, or uses `font-normal`, `font-medium`, `font-semibold`, or `font-bold`.
3. Check whether a parent has an inline `style={{ fontWeight: ... }}` that changes the baseline for descendants.
4. Check generated dev output under `.next/dev/static/chunks` for the relevant text, selector, or `fontWeight`, to confirm the running app has picked up the change.
5. If the in-app browser is available, refresh and inspect the actual rendered element or screenshot. Prefer confirming computed/effective weight instead of relying on visual intuition alone.
6. If browser inspection is unavailable, explicitly say so and provide the fallback evidence used, such as source check, generated output check, and TypeScript check.

AI assistant weight rules:

- AI assistant panel title: use an explicit local weight around `600`.
- Chat body: keep explicit local weight `400`.
- Quick prompts and action buttons: keep light, usually `400`; use `500` only if there is a clear visual reason.
- Avoid relying on Tailwind weight utilities inside the AI assistant when `bold-mode` could override them. Use explicit local styles when necessary.

If a user reports that a font-weight change still looks wrong, perform the checks above before making another adjustment.
