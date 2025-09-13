## Detected stack
- package.json: True
- Build tool: Vite
- React: True | Vue: False | Angular: False
- HTML/CSS/JS present: html=True css=False js=False

## Structural refactors applied
- No `src/` folder detected or we left structure intact to avoid breaking behavior.

## Tooling and quality-of-life additions
- Added `.editorconfig` and `.gitattributes` for consistent line endings and indentation.
- Added `.prettierrc.json`, `.prettierignore`, and `.eslintrc.json` to standardize formatting and linting (non-enforced; opt-in).
- Created/updated `README.md` with quick start and changes overview.

### Source relocation to `src/`
- Moved `App.tsx`, `index.tsx`, `types.ts`, and the `components/`, `hooks/`, `lib/` folders into `src/`. Updated `index.html` to load `/src/index.tsx`. No runtime logic was changed.

### Build/bundling improvements
- `vite.config.ts`: added `build.rollupOptions.output.manualChunks` to separate vendor + heavy libs (charts, motion, icons).
- `vite.config.ts`: set alias `@` → `src` for ergonomic imports.
- `tsconfig.json`: added `baseUrl` and `paths` mapping for `@/*`.
