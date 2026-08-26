## [1.2.0-beta.1](https://github.com/LerianStudio/console-sdk/compare/sindarian-logs-v1.1.0...sindarian-logs-v1.2.0-beta.1) (2026-08-26)


### Features

* **sindarian-tokens:** add the shared, WCAG-gated console token package ([c703f47](https://github.com/LerianStudio/console-sdk/commit/c703f47e84b830252102be4eb98dafffec61384b))
* **sindarian-ui:** add clipboard auto-clear to CopyField ([e11c064](https://github.com/LerianStudio/console-sdk/commit/e11c064d1e95160fc71499ba0a32bf46cedfb8fc))
* **sindarian-ui:** add CopyField component ([dcb2b6c](https://github.com/LerianStudio/console-sdk/commit/dcb2b6c783199014ddae690e27ce75d876c2ee99))
* **sindarian-ui:** add enterprise components (sindarian-x port) ([93bd278](https://github.com/LerianStudio/console-sdk/commit/93bd27814d3db5117ff58e349371b798f68ce791))
* **sindarian-ui:** add finance domain grammar (sindarian-x port) ([248ebe9](https://github.com/LerianStudio/console-sdk/commit/248ebe953600a4b9e8664f07062d4d312bc0d89a))
* **sindarian-ui:** add missing primitives and form fields (sindarian-x port) ([eaa3c07](https://github.com/LerianStudio/console-sdk/commit/eaa3c077306606e11eb2770106e24f52920aaeb0))
* **sindarian-ui:** add QRCode component ([91f92d1](https://github.com/LerianStudio/console-sdk/commit/91f92d1f267dc49258a680f0ef46d5152ce159b3))
* **sindarian-ui:** add theme system, toast helpers and chart wrapper (sindarian-x port) ([6fcdb9b](https://github.com/LerianStudio/console-sdk/commit/6fcdb9b631eac5a29b1d074a732eccbc5366f03c))
* **sindarian-ui:** add warning toast variant ([f7d2d32](https://github.com/LerianStudio/console-sdk/commit/f7d2d329b89e405e3e3238beb1842a882df181b7))
* **sindarian-ui:** allow overriding the delinquency aging copy ([07ab85c](https://github.com/LerianStudio/console-sdk/commit/07ab85c6e058ee1959dfa3b20df56b892c137f7d))
* **sindarian-ui:** export the money-diff and aging-label input types ([37373d5](https://github.com/LerianStudio/console-sdk/commit/37373d5f8d5130b4686c14a18a81c958612e6a9e))
* **sindarian-ui:** forward element props from SectionLabel ([0522e48](https://github.com/LerianStudio/console-sdk/commit/0522e481ad3477b09d711e5375fb928656824ee1))
* **sindarian-ui:** let apps inject the sidebar's router ([c5d23a0](https://github.com/LerianStudio/console-sdk/commit/c5d23a0bcb31dd3398ab9f5b3057c653e7b69f38))
* **sindarian-ui:** scaffold enterprise foundation (sub-barrels, deps, tokens, cn export) ([#131](https://github.com/LerianStudio/console-sdk/issues/131)) ([bd5a2fd](https://github.com/LerianStudio/console-sdk/commit/bd5a2fdecc79cdbbd554781a03eaa123c3c7da80))
* **sindarian-ui:** ship a tree-shakeable ESM build alongside CJS ([4edca3e](https://github.com/LerianStudio/console-sdk/commit/4edca3e49b0a4d4bae3e3a25a7e7a5f6cf629394))


### Bug Fixes

* **sindarian-i18n-cli:** keep locale ids that collide with Object.prototype ([6d970a4](https://github.com/LerianStudio/console-sdk/commit/6d970a4280561055dc4e8143195c42e101fdf5cf))
* **sindarian-i18n-cli:** sort non-default locale files ([49b1dcc](https://github.com/LerianStudio/console-sdk/commit/49b1dcc42d55f89475db6e081c7c9b5ab6953e72))
* **sindarian-tokens:** dark variant reaches the element carrying the class ([c8fa48b](https://github.com/LerianStudio/console-sdk/commit/c8fa48b2382ffc9bed21d669ea5ad727fa6ee4cd))
* **sindarian-tokens:** stop the contrast instrument returning wrong colours silently ([94423d8](https://github.com/LerianStudio/console-sdk/commit/94423d8bb3914098ce1db37d3bff2c4cee8e0c4b))
* **sindarian-ui:** address review findings on enterprise components ([c8b58bf](https://github.com/LerianStudio/console-sdk/commit/c8b58bf4150beea6ff1cb0ba472a8cdd0b7c922b))
* **sindarian-ui:** address review findings on ported primitives and fields ([9a53576](https://github.com/LerianStudio/console-sdk/commit/9a535764271f3926713015634213270953c2a012))
* **sindarian-ui:** address round-2 review findings on enterprise components ([6beef2f](https://github.com/LerianStudio/console-sdk/commit/6beef2fa77e18138399b7676c08e632fb76de55b))
* **sindarian-ui:** address round-3 review findings on enterprise components ([c05cc24](https://github.com/LerianStudio/console-sdk/commit/c05cc24543ea61b0b3eb87fdcd56a093940a6ff3))
* **sindarian-ui:** align input placeholder baseline ([1da4446](https://github.com/LerianStudio/console-sdk/commit/1da44465ae3e8d82f0cbe0e28564387fb9cdbea6))
* **sindarian-ui:** check the storage area before the storage key ([92340fa](https://github.com/LerianStudio/console-sdk/commit/92340fa2527de377c2cb779dfdabf3009a6c0d29))
* **sindarian-ui:** drop aria-valuenow for a non-finite gauge reading ([fe2bbae](https://github.com/LerianStudio/console-sdk/commit/fe2bbae434ebff280085fa81a2a9891b6968ff25))
* **sindarian-ui:** drop form context from Input ([1c60735](https://github.com/LerianStudio/console-sdk/commit/1c607351f8421f142c0e540587ee09944a1e88b5))
* **sindarian-ui:** drop the stray leading dot on an empty status rail lead ([fbe98da](https://github.com/LerianStudio/console-sdk/commit/fbe98dac9a67b85dfd0f5d5f0ca585432ac634e3))
* **sindarian-ui:** forward forceMount through the alert dialog ([5b66b9a](https://github.com/LerianStudio/console-sdk/commit/5b66b9a53ac13da82ffdffac0b5a8e0d55e3f6ca))
* **sindarian-ui:** give each date range segment a real focusable trigger ([af96b25](https://github.com/LerianStudio/console-sdk/commit/af96b25fd4e90351d7f7afb6cc2ad7a46a1dd9e8))
* **sindarian-ui:** harden chart style injection and mirror provider fallback in theme script ([95b6d12](https://github.com/LerianStudio/console-sdk/commit/95b6d1205bd188cc38d17430c2bda9f037f2ae68))
* **sindarian-ui:** harden domain money, PII masking and gauge a11y ([5d580f2](https://github.com/LerianStudio/console-sdk/commit/5d580f2a7cc0c8f1286358867df6d61696c85bfe)), closes [#135](https://github.com/LerianStudio/console-sdk/issues/135)
* **sindarian-ui:** harden form field accessible-name and path typing ([9d18fa5](https://github.com/LerianStudio/console-sdk/commit/9d18fa54187ba6328291efd68188e7919672ee6d))
* **sindarian-ui:** invalidate a stale echo token on an external change ([cbef4f5](https://github.com/LerianStudio/console-sdk/commit/cbef4f5925720a59756595be5482e4149db71757))
* **sindarian-ui:** keep the copy field value out of autofill and spellcheck ([74715a3](https://github.com/LerianStudio/console-sdk/commit/74715a3ad5bdfb98fbccd5b2ade9ca0a0377e578))
* **sindarian-ui:** make Input's focus() and blur() actually run ([951c0cc](https://github.com/LerianStudio/console-sdk/commit/951c0cc675778ed36bdbb2f551b6ff48982d6d7e))
* **sindarian-ui:** mark Button child as Slottable ([6e728a1](https://github.com/LerianStudio/console-sdk/commit/6e728a1216dd2f8ff3858bbf84a9b392730bea2e))
* **sindarian-ui:** name the radio group with its visible label ([eddab80](https://github.com/LerianStudio/console-sdk/commit/eddab80f27c781913341fdfefad76041aa59e4bc))
* **sindarian-ui:** print delinquency money at the currency scale ([8e62985](https://github.com/LerianStudio/console-sdk/commit/8e629852dbc77d6088da2c8144560fee94ac625c))
* **sindarian-ui:** refuse verdicts the domain data cannot support ([3e02d73](https://github.com/LerianStudio/console-sdk/commit/3e02d73b9bee34e86226a826e4f947c703c476dc)), closes [#135](https://github.com/LerianStudio/console-sdk/issues/135)
* **sindarian-ui:** reject url() colors, allow numeric series keys, survive blocked storage ([5729c9b](https://github.com/LerianStudio/console-sdk/commit/5729c9b0e6330119e5f45f1eb8a66faaf2fc34de))
* **sindarian-ui:** release the file input after reading the selection ([53b0852](https://github.com/LerianStudio/console-sdk/commit/53b0852b2e2fa396ba0faa7f509721cf502acf97))
* **sindarian-ui:** require an accessible name on every ported form field ([808ab3a](https://github.com/LerianStudio/console-sdk/commit/808ab3aa181abcd0e5ccb223758cee20238bc256))
* **sindarian-ui:** resolve one version of every [@radix-ui](https://github.com/radix-ui) package ([ec7e1c3](https://github.com/LerianStudio/console-sdk/commit/ec7e1c34cfe3fa7ee4cb697738002f14de556adf))
* **sindarian-ui:** seed the textarea story form value ([5449854](https://github.com/LerianStudio/console-sdk/commit/5449854b743c82458b4e5ef80e55a6514fc616fb))
* **sindarian-ui:** snap stepped value before clamping in NumberInput ([d9bce0a](https://github.com/LerianStudio/console-sdk/commit/d9bce0af6d949451aae64bfc0f9396d2f6d37ac7))
* **sindarian-ui:** stop portal labels recursing forever in the label guard ([d70edbb](https://github.com/LerianStudio/console-sdk/commit/d70edbbdec92445df1983bf0cb485bc6b096620f))
* **sindarian-ui:** stop shipping test files and start type-checking stories ([3cd2830](https://github.com/LerianStudio/console-sdk/commit/3cd2830b4f0561ed964709e7e1c5be0c02cf20d4))
* **sindarian-ui:** tighten badge borders and icon button layout ([47f63f4](https://github.com/LerianStudio/console-sdk/commit/47f63f4345721a55ea0b5e281c1bbf1f266ba92a))
* **sindarian-ui:** treat a boolean status rail lead as empty ([3d7296f](https://github.com/LerianStudio/console-sdk/commit/3d7296fb639bec8f718ecff8fd805586fd6d29a4))
* **sindarian-ui:** treat a cleared storage area as a theme reset ([bdd89f1](https://github.com/LerianStudio/console-sdk/commit/bdd89f10a1a311daca83371d509e693e38396568))
* **sindarian-ui:** treat blank labels as absent and de-flake file-upload tests ([b1f477f](https://github.com/LerianStudio/console-sdk/commit/b1f477faa0aa425e6149129b61432be4733fa4da))
* **sindarian-ui:** treat empty label collections and fragments as absent ([bc4633c](https://github.com/LerianStudio/console-sdk/commit/bc4633ca90d910aad633a6414f110fbef070e458))
* **sindarian-ui:** treat portal labels as nameless and keep next/link options intact ([9b54560](https://github.com/LerianStudio/console-sdk/commit/9b54560c84e30950bae88489eb9b28539acf0c59))
* **sindarian-ui:** widen dialog content padding ([3f62a5d](https://github.com/LerianStudio/console-sdk/commit/3f62a5d590c1b9939b10b9e7996c1d0e662bd076))

# Sindarian-logs Changelog

## [1.1.0](https://github.com/LerianStudio/console-sdk/releases/tag/sindarian-logs-v1.1.0)

- **Features:**
  - Migrated to TypeScript 6.

- **Fixes:**
  - Used non-PII identifier in README log example.
  - Redacted PII in README example and cleaned changelog.

Contributors: @caio_aletroca

[Compare changes](https://github.com/LerianStudio/console-sdk/compare/sindarian-logs-v1.0.0...sindarian-logs-v1.1.0)

---

## [1.0.0](https://github.com/LerianStudio/console-sdk/releases/tag/sindarian-logs-v1.0.0)

- **Features:**
  - Implemented sindarian-logs.
  - Trigger pipeline.

- **Fixes:**
  - Turbo configuration.
  - Trigger pipeline.
  - CI test.

Contributors: @caio_aletroca,

[View all changes](https://github.com/LerianStudio/console-sdk/commits/sindarian-logs-v1.0.0)
