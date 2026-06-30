# Forge Custom UI Contract

All Forge Engine editor controls must use custom Forge UI components, not browser-default controls.

Rules:

- Use `IconButton`, `PillButton`, `CustomSelect`, custom checkbox rows and Forge modal sections.
- Do not add raw `<select>` elements in editor UI. Use `CustomSelect`.
- Do not use unstyled browser buttons for dock tabs, inspector controls, toolbar actions or content browser actions.
- Active states use dark blue Forge selection, except viewport tool buttons where the product style intentionally uses white active pills.
- Inspector fields must be grouped into custom sections with compact labels, real values and no browser-default layout.
- New UI work must live on the shared tokens/classes in `src/styles/globals.css`.
