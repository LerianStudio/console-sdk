## [1.3.0](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.2.0...sindarian-server-v1.3.0) (2026-08-26)


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
* **sindarian-i18n-cli:** reject a locale file that is not a JSON object ([4a91486](https://github.com/LerianStudio/console-sdk/commit/4a9148669a72be88a3686eeacb5abb39ccaecfc6))
* **sindarian-i18n-cli:** reject locale entries whose value is not a string ([d9b93d1](https://github.com/LerianStudio/console-sdk/commit/d9b93d1026d99af353dbee0219a3744f58c43184))
* **sindarian-i18n-cli:** sort non-default locale files ([49b1dcc](https://github.com/LerianStudio/console-sdk/commit/49b1dcc42d55f89475db6e081c7c9b5ab6953e72))
* **sindarian-tokens:** dark variant reaches the element carrying the class ([c8fa48b](https://github.com/LerianStudio/console-sdk/commit/c8fa48b2382ffc9bed21d669ea5ad727fa6ee4cd))
* **sindarian-tokens:** stop the contrast instrument returning wrong colours silently ([94423d8](https://github.com/LerianStudio/console-sdk/commit/94423d8bb3914098ce1db37d3bff2c4cee8e0c4b))
* **sindarian-ui:** address review findings on enterprise components ([c8b58bf](https://github.com/LerianStudio/console-sdk/commit/c8b58bf4150beea6ff1cb0ba472a8cdd0b7c922b))
* **sindarian-ui:** address review findings on ported primitives and fields ([9a53576](https://github.com/LerianStudio/console-sdk/commit/9a535764271f3926713015634213270953c2a012))
* **sindarian-ui:** address round-2 review findings on enterprise components ([6beef2f](https://github.com/LerianStudio/console-sdk/commit/6beef2fa77e18138399b7676c08e632fb76de55b))
* **sindarian-ui:** address round-3 review findings on enterprise components ([c05cc24](https://github.com/LerianStudio/console-sdk/commit/c05cc24543ea61b0b3eb87fdcd56a093940a6ff3))
* **sindarian-ui:** align input placeholder baseline ([1da4446](https://github.com/LerianStudio/console-sdk/commit/1da44465ae3e8d82f0cbe0e28564387fb9cdbea6))
* **sindarian-ui:** check the storage area before the storage key ([92340fa](https://github.com/LerianStudio/console-sdk/commit/92340fa2527de377c2cb779dfdabf3009a6c0d29))
* **sindarian-ui:** clamp a sub-scale delinquency threshold to the floor ([ac10b22](https://github.com/LerianStudio/console-sdk/commit/ac10b22283ec3b9426a267f3e3568f96bc5374ed))
* **sindarian-ui:** decide the delinquency band on the exact integer ratio ([e0a5afe](https://github.com/LerianStudio/console-sdk/commit/e0a5afe379b0bc46ad6dc2d69cab34f16c30ef1b))
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
* **sindarian-ui:** keep the default label when a ModeToggle override is blank ([7594244](https://github.com/LerianStudio/console-sdk/commit/7594244d9685ae5206bf536675b853307d107a0c))
* **sindarian-ui:** make Input's focus() and blur() actually run ([951c0cc](https://github.com/LerianStudio/console-sdk/commit/951c0cc675778ed36bdbb2f551b6ff48982d6d7e))
* **sindarian-ui:** mark Button child as Slottable ([6e728a1](https://github.com/LerianStudio/console-sdk/commit/6e728a1216dd2f8ff3858bbf84a9b392730bea2e))
* **sindarian-ui:** name the next entry that actually failed to load ([6b0908a](https://github.com/LerianStudio/console-sdk/commit/6b0908a494e6110213cf3fc1f620e556897e0b87))
* **sindarian-ui:** name the radio group with its visible label ([eddab80](https://github.com/LerianStudio/console-sdk/commit/eddab80f27c781913341fdfefad76041aa59e4bc))
* **sindarian-ui:** print delinquency money at the currency scale ([8e62985](https://github.com/LerianStudio/console-sdk/commit/8e629852dbc77d6088da2c8144560fee94ac625c))
* **sindarian-ui:** redact an email carrying more than one @ ([dc6e79e](https://github.com/LerianStudio/console-sdk/commit/dc6e79efeb30025576c1f169b6fba72ded07c071))
* **sindarian-ui:** refuse verdicts the domain data cannot support ([3e02d73](https://github.com/LerianStudio/console-sdk/commit/3e02d73b9bee34e86226a826e4f947c703c476dc)), closes [#135](https://github.com/LerianStudio/console-sdk/issues/135)
* **sindarian-ui:** reject non-finite entries and unusable steps ([43506fb](https://github.com/LerianStudio/console-sdk/commit/43506fb3b66cf68f4dc3faca367318026469fc2d))
* **sindarian-ui:** reject url() colors, allow numeric series keys, survive blocked storage ([5729c9b](https://github.com/LerianStudio/console-sdk/commit/5729c9b0e6330119e5f45f1eb8a66faaf2fc34de))
* **sindarian-ui:** release the file input after reading the selection ([53b0852](https://github.com/LerianStudio/console-sdk/commit/53b0852b2e2fa396ba0faa7f509721cf502acf97))
* **sindarian-ui:** require an accessible name on every ported form field ([808ab3a](https://github.com/LerianStudio/console-sdk/commit/808ab3aa181abcd0e5ccb223758cee20238bc256))
* **sindarian-ui:** resolve one version of every [@radix-ui](https://github.com/radix-ui) package ([ec7e1c3](https://github.com/LerianStudio/console-sdk/commit/ec7e1c34cfe3fa7ee4cb697738002f14de556adf))
* **sindarian-ui:** seed the textarea story form value ([5449854](https://github.com/LerianStudio/console-sdk/commit/5449854b743c82458b4e5ef80e55a6514fc616fb))
* **sindarian-ui:** show the chip for an accepted empty file ([7f6df6d](https://github.com/LerianStudio/console-sdk/commit/7f6df6d4e957e141c1998a0f5b0bfcccf5135d04))
* **sindarian-ui:** snap stepped value before clamping in NumberInput ([d9bce0a](https://github.com/LerianStudio/console-sdk/commit/d9bce0af6d949451aae64bfc0f9396d2f6d37ac7))
* **sindarian-ui:** stop portal labels recursing forever in the label guard ([d70edbb](https://github.com/LerianStudio/console-sdk/commit/d70edbbdec92445df1983bf0cb485bc6b096620f))
* **sindarian-ui:** stop shipping test files and start type-checking stories ([3cd2830](https://github.com/LerianStudio/console-sdk/commit/3cd2830b4f0561ed964709e7e1c5be0c02cf20d4))
* **sindarian-ui:** surface a real next/link load failure in development ([4a1a651](https://github.com/LerianStudio/console-sdk/commit/4a1a651f1f46930169d984f942f6a7f620e2e9c9))
* **sindarian-ui:** survive a huge finite delinquency threshold ([d698df2](https://github.com/LerianStudio/console-sdk/commit/d698df248b5a6227352faa1aaa18882533e0f6bd))
* **sindarian-ui:** survive a malformed locale tag instead of throwing ([56569eb](https://github.com/LerianStudio/console-sdk/commit/56569eb1d0ea29847839027774b0d3dcbd229298))
* **sindarian-ui:** tighten badge borders and icon button layout ([47f63f4](https://github.com/LerianStudio/console-sdk/commit/47f63f4345721a55ea0b5e281c1bbf1f266ba92a))
* **sindarian-ui:** treat a boolean status rail lead as empty ([3d7296f](https://github.com/LerianStudio/console-sdk/commit/3d7296fb639bec8f718ecff8fd805586fd6d29a4))
* **sindarian-ui:** treat a cleared storage area as a theme reset ([bdd89f1](https://github.com/LerianStudio/console-sdk/commit/bdd89f10a1a311daca83371d509e693e38396568))
* **sindarian-ui:** treat blank labels as absent and de-flake file-upload tests ([b1f477f](https://github.com/LerianStudio/console-sdk/commit/b1f477faa0aa425e6149129b61432be4733fa4da))
* **sindarian-ui:** treat empty label collections and fragments as absent ([bc4633c](https://github.com/LerianStudio/console-sdk/commit/bc4633ca90d910aad633a6414f110fbef070e458))
* **sindarian-ui:** treat portal labels as nameless and keep next/link options intact ([9b54560](https://github.com/LerianStudio/console-sdk/commit/9b54560c84e30950bae88489eb9b28539acf0c59))
* **sindarian-ui:** warn only when next is installed but broken ([186533a](https://github.com/LerianStudio/console-sdk/commit/186533aea7da30b58b05d762ae02e59f1285e70a))
* **sindarian-ui:** widen dialog content padding ([3f62a5d](https://github.com/LerianStudio/console-sdk/commit/3f62a5d590c1b9939b10b9e7996c1d0e662bd076))

## [1.2.0-beta.3](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.2.0-beta.2...sindarian-server-v1.2.0-beta.3) (2026-07-29)


### Features

* **sindarian-ui:** add clipboard auto-clear to CopyField ([e11c064](https://github.com/LerianStudio/console-sdk/commit/e11c064d1e95160fc71499ba0a32bf46cedfb8fc))
* **sindarian-ui:** add CopyField component ([dcb2b6c](https://github.com/LerianStudio/console-sdk/commit/dcb2b6c783199014ddae690e27ce75d876c2ee99))
* **sindarian-ui:** add QRCode component ([91f92d1](https://github.com/LerianStudio/console-sdk/commit/91f92d1f267dc49258a680f0ef46d5152ce159b3))


### Bug Fixes

* **sindarian-ui:** tighten badge borders and icon button layout ([47f63f4](https://github.com/LerianStudio/console-sdk/commit/47f63f4345721a55ea0b5e281c1bbf1f266ba92a))

## [1.2.0-beta.2](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.2.0-beta.1...sindarian-server-v1.2.0-beta.2) (2026-07-16)


### Features

* Added new component ([861ceb9](https://github.com/LerianStudio/console-sdk/commit/861ceb9f03fd9684a116a0512aba305223f64f04))
* **sindarian-ui:** add InputOTP component and OtpField ([e865aa5](https://github.com/LerianStudio/console-sdk/commit/e865aa5a8c33febafe2d25ccceaf519d6cf7accb))
* **sindarian-ui:** highlight date pickers when popover opens ([1dd77d7](https://github.com/LerianStudio/console-sdk/commit/1dd77d73c33301dccc8e62369493893dab8f9e3e))


### Bug Fixes

* **sindarian-i18n-cli:** add input validation and improve test quality ([5e3cbd4](https://github.com/LerianStudio/console-sdk/commit/5e3cbd46304d3c19251f69225e5b208b7289093b))
* **sindarian-logs:** redact PII in README example and clean changelog ([8df6b75](https://github.com/LerianStudio/console-sdk/commit/8df6b75dda700696f366a610111fd49352039655))
* **sindarian-logs:** use non-PII identifier in README log example ([511d212](https://github.com/LerianStudio/console-sdk/commit/511d212eb0722f0d7639a068221172f7b03416cd))
* **sindarian-ui:** align calendar today/range styles with accent ([e4b6257](https://github.com/LerianStudio/console-sdk/commit/e4b625757558b4244b72cd47018b1ab7138ba25c))
* **sindarian-ui:** align date picker fields with ring focus styles ([80ecc60](https://github.com/LerianStudio/console-sdk/commit/80ecc60776cf5b5b0ac937b282632b509c19d930))
* **sindarian-ui:** align date/time picker styles with accent tokens ([1ee55e4](https://github.com/LerianStudio/console-sdk/commit/1ee55e441d47844ffd6409095b0bbc28a6e7687a))
* **sindarian-ui:** ensure form field spread order preserves RHF bindings ([d2ed1fc](https://github.com/LerianStudio/console-sdk/commit/d2ed1fc72999bc1bb49b5ba23dae7543a5c77ac5))
* **sindarian-ui:** make picker clear button and time options a11y-friendly ([3209065](https://github.com/LerianStudio/console-sdk/commit/32090650c499efbd2723eebf45d0b86f8d4ae7e6))
* **sindarian-ui:** resolve nested interactive elements and improve component reliability ([a06eb3d](https://github.com/LerianStudio/console-sdk/commit/a06eb3d66ae95161f29ce5a016ffc3e3aa362097))
* **sindarian-ui:** review fixes for OTP component ([3d1950a](https://github.com/LerianStudio/console-sdk/commit/3d1950a066f9abc642120524f9a9fc97686d6be0))
* **sindarian-ui:** use cell-size for calendar week number header ([da77108](https://github.com/LerianStudio/console-sdk/commit/da77108a9ec7ca343c86722ad8b3ee0c5779f436))

## [1.2.0-beta.1](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.1.0...sindarian-server-v1.2.0-beta.1) (2026-07-03)


### Features

* Fix workflow ([4dbe4be](https://github.com/LerianStudio/console-sdk/commit/4dbe4be54519c3f807b8f969d4a16295f5c98074))
* Linted code ([5b2628e](https://github.com/LerianStudio/console-sdk/commit/5b2628e1530645166f6bb0f799f0af649099ce24))
* Merged develop ([6a7a4a9](https://github.com/LerianStudio/console-sdk/commit/6a7a4a9387deee2e22da438f37ad41e3ed9fce40))
* migrate to TypeScript 6 ([ea1e5c9](https://github.com/LerianStudio/console-sdk/commit/ea1e5c9755d224479c279e54e242ad37a7dfff4c))
* New workflow for PRs ([a8dd46d](https://github.com/LerianStudio/console-sdk/commit/a8dd46dae6528acf936bd317312111ce4f866af4))


### Bug Fixes

* address review findings from dependency upgrade ([dc4ae08](https://github.com/LerianStudio/console-sdk/commit/dc4ae08e4121f7254630b1bc51905c341b2af70a))
* address review findings in AI harness files ([0a9ea0c](https://github.com/LerianStudio/console-sdk/commit/0a9ea0cdec164beefe1a3c9dc471070baf4f315a))
* Adjusted react-hook-form typings ([f885c11](https://github.com/LerianStudio/console-sdk/commit/f885c11c8cc078dbfb7ceb519db93ae3f3fd905b))
* Build ([19e236c](https://github.com/LerianStudio/console-sdk/commit/19e236c359260cf6151c5b081726044c16d4d821))
* Coderabbit issues ([fc0e3d5](https://github.com/LerianStudio/console-sdk/commit/fc0e3d599a90a9761cc562eb5ea5cf4952e2fee8))
* Even more typings ([2f58119](https://github.com/LerianStudio/console-sdk/commit/2f58119a9e374773af344905e4a0ba7dd1e86040))
* More typings ([930049c](https://github.com/LerianStudio/console-sdk/commit/930049caa1a3c5be7086671df8a222ebb20b4592))
* Typings ([e9ab899](https://github.com/LerianStudio/console-sdk/commit/e9ab8997966f85cdbb7020bb5239a9f307416a82))

# Sindarian-server Changelog

## [1.1.0](https://github.com/LerianStudio/console-sdk/releases/tag/sindarian-server-v1.1.0)

- **Features:**
  - Implemented middleware into server.
  - Added bind overwrite for simple classes.
  - Implemented guards.
  - Added new methods to server factory.
  - Added support for multiple APP_FILTER.

- **Fixes:**
  - Resolved bug where empty response breaks on Patch operations.
  - Fixed case where exception filter returns invalid response.
  - Fixed route specificity issue.
  - Updated test mock to match actual PipeHandler.execute implementation.
  - Decorators now return actual values instead of metadata objects.

- **Improvements:**
  - Added more module and unit tests.
  - Streamlined release workflow with custom changed-paths action.
  - Updated readme documentation.
  - Added tests and documentation for DELETE 204 No Content behavior.

Contributors: @caio_aletroca, @gabrielcastro.xy, @gui.rodrigues, @lucas.bedatty

[Compare changes](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0...sindarian-server-v1.1.0)

---

## [1.1.0](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0...sindarian-server-v1.1.0) (2026-04-29)


### Features

* Added bind overwrite for simple classes ([27f8eb6](https://github.com/LerianStudio/console-sdk/commit/27f8eb604c2e2cb9d5f8ddfce60e2cbb1161e77b))
* Added data-testid to missing components ([3be7734](https://github.com/LerianStudio/console-sdk/commit/3be77349bd92b55de870d3a61a155b468a17ad2f))
* Added missing client directive on form.tsx ([03f76a9](https://github.com/LerianStudio/console-sdk/commit/03f76a99c719933f862eeb33cdd028aa6a75a932))
* Added more module tests. ([7516e78](https://github.com/LerianStudio/console-sdk/commit/7516e78fd174867be1dae64f226f2e946bbf76b9))
* Added more tests ([509c318](https://github.com/LerianStudio/console-sdk/commit/509c31823feddcf274af8b75efc7510d2e57dd4a))
* Added more unit tests. ([37d303d](https://github.com/LerianStudio/console-sdk/commit/37d303d27eacdaf0744d049f77beb7529d912258))
* Added multiples Pipes and Interceptors ([d651cb7](https://github.com/LerianStudio/console-sdk/commit/d651cb772d7e77ea5d51eab3f52b90386f1d30c5))
* Added new method to the provider. ([68cbf11](https://github.com/LerianStudio/console-sdk/commit/68cbf1118d79234aa6f5c992cd90f08811f860c0))
* Added new methods to server factory. ([ddcb9e1](https://github.com/LerianStudio/console-sdk/commit/ddcb9e1638fe0c139c188c7723531f90f2703f07))
* Added onChange to SelectField ([69e8866](https://github.com/LerianStudio/console-sdk/commit/69e8866d893ce99bdb1298845d9b53b87a2ba0a4))
* Added PasswordField to exports ([7d0a5ba](https://github.com/LerianStudio/console-sdk/commit/7d0a5bab0f9f18aff0e58cd47460e5bcc5c4fa28))
* Added scroll to sidebar ([9d3204f](https://github.com/LerianStudio/console-sdk/commit/9d3204f9d3162573ea9a35f45e3bdb9996c07de5))
* Added sidebar ([8405e43](https://github.com/LerianStudio/console-sdk/commit/8405e433c88b069e36cd2edcf673dcfce2e4f85c))
* Added Sidebar animation ([b83497e](https://github.com/LerianStudio/console-sdk/commit/b83497ee745a350a62c36ca9165a52ed8ee0a43b))
* Added support for multiple APP_FILTER ([7998d68](https://github.com/LerianStudio/console-sdk/commit/7998d6888485e54c9748d45c07947318d74dab51))
* Added unit tests for SidebarProvider ([11354bf](https://github.com/LerianStudio/console-sdk/commit/11354bfa738aa742d3d15ef9970f68ab5d7efe86))
* Adjusted CSS styles ([9e7b985](https://github.com/LerianStudio/console-sdk/commit/9e7b9854f139c5806c932446c93d40106b6ff3e2))
* Adjusted pipeline ([352f6cb](https://github.com/LerianStudio/console-sdk/commit/352f6cbde7df6427bac8c218c6475057c93c115b))
* **badge:** add semantic status variants (error, success, info, alert) ([82dd7c6](https://github.com/LerianStudio/console-sdk/commit/82dd7c683439c6a1f9495c4e6740b735311a26b9))
* **ci:** use shared gptchangelog workflow for changelog generation ([dd0a169](https://github.com/LerianStudio/console-sdk/commit/dd0a16928cf91f2739c8024128ccbf7c96d10893))
* copy CSS files to dist during build process ([bc16df3](https://github.com/LerianStudio/console-sdk/commit/bc16df36a07ba0f5bf0400fa39d8f301bb6f8569))
* **date-picker-field:** add valueAsString prop for string date handling ([a5a2c63](https://github.com/LerianStudio/console-sdk/commit/a5a2c63197967502dd603e2b01f26d2cfec8fc49))
* Exported IconButton ([aa089f3](https://github.com/LerianStudio/console-sdk/commit/aa089f319a25bab3ee06048f672a3f8ea3289bae))
* Finished sub item collapsible on Sidebar ([e815145](https://github.com/LerianStudio/console-sdk/commit/e815145bae15164acf45dee6bf86d86eb4da2a39))
* Fixed build ([fd7e801](https://github.com/LerianStudio/console-sdk/commit/fd7e801f9727997023185d4c2efbdd9865abb742))
* Fixed CSS ([3b46ba4](https://github.com/LerianStudio/console-sdk/commit/3b46ba471e01a0685ce5e5a727a5aff43ecc48af))
* Fixed CSS again ([9d4a129](https://github.com/LerianStudio/console-sdk/commit/9d4a129f5baf99f55487c2181fb0847e7fdf21bc))
* Fixed StateField styles ([1fb78c4](https://github.com/LerianStudio/console-sdk/commit/1fb78c4793ea72915693004afdf7c30f61b23eed))
* Implemented DatePicker and DateRange fields ([dedc04d](https://github.com/LerianStudio/console-sdk/commit/dedc04d4cb240c8bc9979097a1b8a89da9526167))
* Implemented guards ([a5137c5](https://github.com/LerianStudio/console-sdk/commit/a5137c5cf3733fbe834aa7186145c6c9bf12a6d4))
* Implemented middleware into server ([7a1790a](https://github.com/LerianStudio/console-sdk/commit/7a1790a60eae66b0ef626021cd40d1e18c6f3623))
* Implemented Sidebar collapsible items ([42cef79](https://github.com/LerianStudio/console-sdk/commit/42cef79f8d4c5f2ec3adab704ea04c3a02f52153))
* Implemented sindarian-logs ([9db48de](https://github.com/LerianStudio/console-sdk/commit/9db48de49a016c0bd5bcf6fa771a90d1390492da))
* More small fixes ([e5ea1c3](https://github.com/LerianStudio/console-sdk/commit/e5ea1c3c72274411b027cccc49826e6acfe9bd91))
* **page-header:** add context for open state and improve layout ([dfd7a1b](https://github.com/LerianStudio/console-sdk/commit/dfd7a1b5eec4ac5f714d97c765de5a16c03b1f1d))
* **sindarian-server:** return 204 No Content for DELETE routes with null response ([7065070](https://github.com/LerianStudio/console-sdk/commit/7065070bfda088d38763f6276cb8df9e580baad0))
* **sindarian-ui:** add dark mode toggle to Storybook ([ca87f15](https://github.com/LerianStudio/console-sdk/commit/ca87f159a1f08a60b03b243c7bb6c19419f4e466))
* **sindarian-ui:** add design token system and dark mode CSS vars ([87ea615](https://github.com/LerianStudio/console-sdk/commit/87ea6156c3b633dd0c1f81f5eba88d1beb29e9b2))
* **sindarian-ui:** add scrollbar-thin-translucent Tailwind utility ([c5a6935](https://github.com/LerianStudio/console-sdk/commit/c5a6935970c8b8b977a1e7ae118abe5ed5f59134))
* **sindarian-ui:** apply scrollbar-thin-translucent to page content and sidebar ([fce5995](https://github.com/LerianStudio/console-sdk/commit/fce5995ec59bc5a8c5a9a0236db546b558b8873b))
* Small fixes to Sheet styling ([1b15539](https://github.com/LerianStudio/console-sdk/commit/1b1553974a3d26d1d88d63030b8637e46ebe9ae7))
* **toast:** migrate from Radix Toast to Sonner ([915ec12](https://github.com/LerianStudio/console-sdk/commit/915ec123b9e33facca5dd56f8f9af95624eb5e1a))
* Trigger pipeline ([40d045d](https://github.com/LerianStudio/console-sdk/commit/40d045d238b56be6411e0fed8e3ee676c0e12b0e))
* Try to publish changes. ([a43d3ab](https://github.com/LerianStudio/console-sdk/commit/a43d3abdeba772c56b2908065728867af505b4bd))
* Updated dependencies ([57b55ac](https://github.com/LerianStudio/console-sdk/commit/57b55ac1a09197469c92ad09d586ad5714f1a913))
* Updated IdTableCell ([61fd443](https://github.com/LerianStudio/console-sdk/commit/61fd443e30bbacddea4824254ef04aab05011806))
* Updated readme ([773ae26](https://github.com/LerianStudio/console-sdk/commit/773ae26f2677f532b3d04685ba0f4f977c8fb0d7))
* Upgraded dependencies ([984a9ee](https://github.com/LerianStudio/console-sdk/commit/984a9ee36f545869eba16c19ad14a6f35ea5aae5))


### Bug Fixes

* Bug when empty response breaks on Patch operations. ([9179bcf](https://github.com/LerianStudio/console-sdk/commit/9179bcfeae735774d8a52724c811ad88ced8cacf))
* Case where exception filter returns invalid response. ([fc529bb](https://github.com/LerianStudio/console-sdk/commit/fc529bb49e7195c3193ead77baf8a37fee63b0cc))
* CI test ([32f0002](https://github.com/LerianStudio/console-sdk/commit/32f00029800e50570056488b0fd9c82b41493cc9))
* CI test ([fcc5961](https://github.com/LerianStudio/console-sdk/commit/fcc59614b2ae0e81ecc08093c93b4f33a1094292))
* **ci:** add continue-on-error to changelog job to prevent pipeline breaks ([8173805](https://github.com/LerianStudio/console-sdk/commit/81738057bb34b0e88cc40d67b1a66faca35cc306))
* **ci:** disable changelog generation for beta releases ([1986659](https://github.com/LerianStudio/console-sdk/commit/1986659a7451f76f9c1d59e94f4f2a3a10c6093d))
* **ci:** enable changelog generation for beta releases on develop ([68712bb](https://github.com/LerianStudio/console-sdk/commit/68712bb2a9580f134967b3d64c0b7aa6eecf87f7))
* **ci:** remove invalid continue-on-error from reusable workflow job ([b2de64a](https://github.com/LerianStudio/console-sdk/commit/b2de64af81886b3144d1834af5ba81315196bace))
* **ci:** restrict changelog generation to main branch only ([f71f759](https://github.com/LerianStudio/console-sdk/commit/f71f759836dda98371964e8143d258b0a1d6b3bd))
* **ci:** revert changelog to original per-package model and remove discord notification ([74be704](https://github.com/LerianStudio/console-sdk/commit/74be704c0b2cc624743248e52a06ab0785ff046c))
* **ci:** revert semantic-release-action to v4 for v23 compatibility ([74302b5](https://github.com/LerianStudio/console-sdk/commit/74302b5d6026a20d5d7e9e280aa762755a21c9f3))
* **ci:** skip npm-audit when no packages changed ([bacaee8](https://github.com/LerianStudio/console-sdk/commit/bacaee8d9146537268dc30a339d2acf436d7a42e))
* **date-picker-field:** add validation for invalid date parsing ([72026a9](https://github.com/LerianStudio/console-sdk/commit/72026a91a345c4662f580d6d005a7a556f81400e))
* decorators now return actual values instead of metadata objects ([816c31c](https://github.com/LerianStudio/console-sdk/commit/816c31c81c2ad15f0fb112c078238a691a4507c1))
* Hydration errors ([d616bfc](https://github.com/LerianStudio/console-sdk/commit/d616bfcc7a64c4c49827987454ac939a028b38f8))
* Jest new version issues with node 22 ([41f2467](https://github.com/LerianStudio/console-sdk/commit/41f246758c3298fa8f22faf9d1646d6e2cb5f526))
* LocalStorage is undefined. ([15b2252](https://github.com/LerianStudio/console-sdk/commit/15b2252ad86604b6500dbe2ce743aaf23eb3bd50))
* **page-header:** add max-width constraint to description in collapsible info ([4e802b8](https://github.com/LerianStudio/console-sdk/commit/4e802b835910cab391a60edd8137df48b9b716f5))
* prevent Git conflicts in parallel package releases ([abc3ae1](https://github.com/LerianStudio/console-sdk/commit/abc3ae1992fb545d6eb55b5028a126c0910c36c6))
* Route specificity on sindarian-server ([0e91ba5](https://github.com/LerianStudio/console-sdk/commit/0e91ba5cf7acec1cd4b561e2b2cafc232ce377f6))
* **sheet:** prevent sheet from closing when interacting with sonner toasts ([eb88df7](https://github.com/LerianStudio/console-sdk/commit/eb88df77eb5ecb375104c160208f44b036b2f2e8))
* Sidebar issues ([bfb007b](https://github.com/LerianStudio/console-sdk/commit/bfb007b40db5326e8b9dc6ddbb4c9bfcb50e0a09))
* **sindarian-ui:** correct ref type in CommandList ([c4a5207](https://github.com/LerianStudio/console-sdk/commit/c4a5207cd74a4cea957d2f5dd3b5ae491a933d91))
* **sindarian-ui:** correct ref type in CommandList ([36ef7e1](https://github.com/LerianStudio/console-sdk/commit/36ef7e1c83612e1354b8bc4184fef9d7801c58aa))
* **sindarian-ui:** fix dark mode input styles, autofill and scrollbar ([992a431](https://github.com/LerianStudio/console-sdk/commit/992a4312c22827b197e0c9f3131b1930aac69e8d))
* **sindarian-ui:** improve active tab trigger text contrast in light mode ([20c51b2](https://github.com/LerianStudio/console-sdk/commit/20c51b2e965b6ab6cfe824350766ae51aafcfac7))
* **sindarian-ui:** improve multiple-select robustness and password field form behavior ([50b914b](https://github.com/LerianStudio/console-sdk/commit/50b914b37c1e49e3828a9a2f6283fe754e50797c))
* **sindarian-ui:** prevent scroll propagation in CommandList ([152443a](https://github.com/LerianStudio/console-sdk/commit/152443a197c3950ecd4d373811fd55014ca18c3d))
* **toast:** align default duration with Toaster component (10s) ([6088597](https://github.com/LerianStudio/console-sdk/commit/60885972f3c682f9bfe5684b8b5933e129a669fb))
* **toast:** improve close button styles and align ID type with Sonner ([2081067](https://github.com/LerianStudio/console-sdk/commit/208106703f595a046ae717db27fd85411fada41e))
* **toast:** use theme foreground color for close button hover state ([9cf50ca](https://github.com/LerianStudio/console-sdk/commit/9cf50ca6ceb23136798cf94580279b1deec28183))
* Trigger pipeline ([b5d7092](https://github.com/LerianStudio/console-sdk/commit/b5d7092a171c885c97dbcdf6ff25104be3ecc443))
* Turbo configuration ([3b7f209](https://github.com/LerianStudio/console-sdk/commit/3b7f2095f2168abb8789a188eea36e9cee1e18a9))
* update changelog action to use helm-repo branch with working directory ([3166b0a](https://github.com/LerianStudio/console-sdk/commit/3166b0a7ca5945dc2ef4e2f119de4d9dd4c6f22c))
* update the test mock to match the actual PipeHandler.execute implementation ([fad3447](https://github.com/LerianStudio/console-sdk/commit/fad3447ea4705c81865348c1f1640ad52a7cd053))

## [1.0.0-beta.30](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.29...sindarian-server-v1.0.0-beta.30) (2026-04-01)


### Features

* Implemented middleware into server ([7a1790a](https://github.com/LerianStudio/console-sdk/commit/7a1790a60eae66b0ef626021cd40d1e18c6f3623))
* Implemented sindarian-logs ([9db48de](https://github.com/LerianStudio/console-sdk/commit/9db48de49a016c0bd5bcf6fa771a90d1390492da))
* Upgraded dependencies ([984a9ee](https://github.com/LerianStudio/console-sdk/commit/984a9ee36f545869eba16c19ad14a6f35ea5aae5))

## [1.0.0-beta.29](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.28...sindarian-server-v1.0.0-beta.29) (2026-03-25)


### Bug Fixes

* **ci:** add continue-on-error to changelog job to prevent pipeline breaks ([8173805](https://github.com/LerianStudio/console-sdk/commit/81738057bb34b0e88cc40d67b1a66faca35cc306))
* **ci:** remove invalid continue-on-error from reusable workflow job ([b2de64a](https://github.com/LerianStudio/console-sdk/commit/b2de64af81886b3144d1834af5ba81315196bace))
* **ci:** restrict changelog generation to main branch only ([f71f759](https://github.com/LerianStudio/console-sdk/commit/f71f759836dda98371964e8143d258b0a1d6b3bd))

# Sindarian-server Changelog

## [1.0.0](https://github.com/LerianStudio/console-sdk/releases/tag/sindarian-server-v1.0.0)

Features:
- Main sindarian-server implementation.
- Added more functionality and unit tests for sindarian-server.
- Implemented Zod support for validation.
- Configure split libs.
- Implemented exceptions filter system.

Improvements:
- Updated packages.
- Changed method access level.
- Adjusted dependencies.
- Compacted package.json dependencies.
- Better build setup.

Contributors: @caio_aletroca, @ferr3ira-gabriel, @ferr3ira.gabriel, @lf, @lfbarrile01

[View all changes](https://github.com/LerianStudio/console-sdk/commits/sindarian-server-v1.0.0)

---

## [1.0.0-beta.28](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.27...sindarian-server-v1.0.0-beta.28) (2026-03-25)


### Features

* **badge:** add semantic status variants (error, success, info, alert) ([82dd7c6](https://github.com/LerianStudio/console-sdk/commit/82dd7c683439c6a1f9495c4e6740b735311a26b9))
* **ci:** use shared gptchangelog workflow for changelog generation ([dd0a169](https://github.com/LerianStudio/console-sdk/commit/dd0a16928cf91f2739c8024128ccbf7c96d10893))
* **sindarian-ui:** add scrollbar-thin-translucent Tailwind utility ([c5a6935](https://github.com/LerianStudio/console-sdk/commit/c5a6935970c8b8b977a1e7ae118abe5ed5f59134))
* **sindarian-ui:** apply scrollbar-thin-translucent to page content and sidebar ([fce5995](https://github.com/LerianStudio/console-sdk/commit/fce5995ec59bc5a8c5a9a0236db546b558b8873b))
* **toast:** migrate from Radix Toast to Sonner ([915ec12](https://github.com/LerianStudio/console-sdk/commit/915ec123b9e33facca5dd56f8f9af95624eb5e1a))


### Bug Fixes

* **ci:** disable changelog generation for beta releases ([1986659](https://github.com/LerianStudio/console-sdk/commit/1986659a7451f76f9c1d59e94f4f2a3a10c6093d))
* **ci:** enable changelog generation for beta releases on develop ([68712bb](https://github.com/LerianStudio/console-sdk/commit/68712bb2a9580f134967b3d64c0b7aa6eecf87f7))
* **ci:** revert changelog to original per-package model and remove discord notification ([74be704](https://github.com/LerianStudio/console-sdk/commit/74be704c0b2cc624743248e52a06ab0785ff046c))
* **ci:** revert semantic-release-action to v4 for v23 compatibility ([74302b5](https://github.com/LerianStudio/console-sdk/commit/74302b5d6026a20d5d7e9e280aa762755a21c9f3))
* **ci:** skip npm-audit when no packages changed ([bacaee8](https://github.com/LerianStudio/console-sdk/commit/bacaee8d9146537268dc30a339d2acf436d7a42e))
* **sindarian-ui:** fix dark mode input styles, autofill and scrollbar ([992a431](https://github.com/LerianStudio/console-sdk/commit/992a4312c22827b197e0c9f3131b1930aac69e8d))
* **toast:** align default duration with Toaster component (10s) ([6088597](https://github.com/LerianStudio/console-sdk/commit/60885972f3c682f9bfe5684b8b5933e129a669fb))
* **toast:** improve close button styles and align ID type with Sonner ([2081067](https://github.com/LerianStudio/console-sdk/commit/208106703f595a046ae717db27fd85411fada41e))
* **toast:** use theme foreground color for close button hover state ([9cf50ca](https://github.com/LerianStudio/console-sdk/commit/9cf50ca6ceb23136798cf94580279b1deec28183))

## [1.0.0-beta.27](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.26...sindarian-server-v1.0.0-beta.27) (2026-03-09)


### Bug Fixes

* Bug when empty response breaks on Patch operations. ([9179bcf](https://github.com/LerianStudio/console-sdk/commit/9179bcfeae735774d8a52724c811ad88ced8cacf))
* **sindarian-ui:** improve active tab trigger text contrast in light mode ([20c51b2](https://github.com/LerianStudio/console-sdk/commit/20c51b2e965b6ab6cfe824350766ae51aafcfac7))
* **sindarian-ui:** improve multiple-select robustness and password field form behavior ([50b914b](https://github.com/LerianStudio/console-sdk/commit/50b914b37c1e49e3828a9a2f6283fe754e50797c))

## [1.0.0-beta.26](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.25...sindarian-server-v1.0.0-beta.26) (2026-03-03)


### Features

* Added bind overwrite for simple classes ([27f8eb6](https://github.com/LerianStudio/console-sdk/commit/27f8eb604c2e2cb9d5f8ddfce60e2cbb1161e77b))
* Added onChange to SelectField ([69e8866](https://github.com/LerianStudio/console-sdk/commit/69e8866d893ce99bdb1298845d9b53b87a2ba0a4))
* Added PasswordField to exports ([7d0a5ba](https://github.com/LerianStudio/console-sdk/commit/7d0a5bab0f9f18aff0e58cd47460e5bcc5c4fa28))
* **date-picker-field:** add valueAsString prop for string date handling ([a5a2c63](https://github.com/LerianStudio/console-sdk/commit/a5a2c63197967502dd603e2b01f26d2cfec8fc49))
* Fixed StateField styles ([1fb78c4](https://github.com/LerianStudio/console-sdk/commit/1fb78c4793ea72915693004afdf7c30f61b23eed))
* Implemented DatePicker and DateRange fields ([dedc04d](https://github.com/LerianStudio/console-sdk/commit/dedc04d4cb240c8bc9979097a1b8a89da9526167))
* **page-header:** add context for open state and improve layout ([dfd7a1b](https://github.com/LerianStudio/console-sdk/commit/dfd7a1b5eec4ac5f714d97c765de5a16c03b1f1d))
* **sindarian-ui:** add dark mode toggle to Storybook ([ca87f15](https://github.com/LerianStudio/console-sdk/commit/ca87f159a1f08a60b03b243c7bb6c19419f4e466))
* **sindarian-ui:** add design token system and dark mode CSS vars ([87ea615](https://github.com/LerianStudio/console-sdk/commit/87ea6156c3b633dd0c1f81f5eba88d1beb29e9b2))
* Small fixes to Sheet styling ([1b15539](https://github.com/LerianStudio/console-sdk/commit/1b1553974a3d26d1d88d63030b8637e46ebe9ae7))
* Updated dependencies ([57b55ac](https://github.com/LerianStudio/console-sdk/commit/57b55ac1a09197469c92ad09d586ad5714f1a913))


### Bug Fixes

* **date-picker-field:** add validation for invalid date parsing ([72026a9](https://github.com/LerianStudio/console-sdk/commit/72026a91a345c4662f580d6d005a7a556f81400e))
* Jest new version issues with node 22 ([41f2467](https://github.com/LerianStudio/console-sdk/commit/41f246758c3298fa8f22faf9d1646d6e2cb5f526))
* **page-header:** add max-width constraint to description in collapsible info ([4e802b8](https://github.com/LerianStudio/console-sdk/commit/4e802b835910cab391a60edd8137df48b9b716f5))
* **sindarian-ui:** correct ref type in CommandList ([c4a5207](https://github.com/LerianStudio/console-sdk/commit/c4a5207cd74a4cea957d2f5dd3b5ae491a933d91))
* **sindarian-ui:** correct ref type in CommandList ([36ef7e1](https://github.com/LerianStudio/console-sdk/commit/36ef7e1c83612e1354b8bc4184fef9d7801c58aa))
* **sindarian-ui:** prevent scroll propagation in CommandList ([152443a](https://github.com/LerianStudio/console-sdk/commit/152443a197c3950ecd4d373811fd55014ca18c3d))

## [1.0.0-beta.25](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.24...sindarian-server-v1.0.0-beta.25) (2026-01-06)


### Features

* Added new method to the provider. ([68cbf11](https://github.com/LerianStudio/console-sdk/commit/68cbf1118d79234aa6f5c992cd90f08811f860c0))
* Added scroll to sidebar ([9d3204f](https://github.com/LerianStudio/console-sdk/commit/9d3204f9d3162573ea9a35f45e3bdb9996c07de5))
* Added unit tests for SidebarProvider ([11354bf](https://github.com/LerianStudio/console-sdk/commit/11354bfa738aa742d3d15ef9970f68ab5d7efe86))
* Finished sub item collapsible on Sidebar ([e815145](https://github.com/LerianStudio/console-sdk/commit/e815145bae15164acf45dee6bf86d86eb4da2a39))
* Implemented Sidebar collapsible items ([42cef79](https://github.com/LerianStudio/console-sdk/commit/42cef79f8d4c5f2ec3adab704ea04c3a02f52153))
* **sindarian-server:** return 204 No Content for DELETE routes with null response ([7065070](https://github.com/LerianStudio/console-sdk/commit/7065070bfda088d38763f6276cb8df9e580baad0))


### Bug Fixes

* Hydration errors ([d616bfc](https://github.com/LerianStudio/console-sdk/commit/d616bfcc7a64c4c49827987454ac939a028b38f8))
* LocalStorage is undefined. ([15b2252](https://github.com/LerianStudio/console-sdk/commit/15b2252ad86604b6500dbe2ce743aaf23eb3bd50))
* Sidebar issues ([bfb007b](https://github.com/LerianStudio/console-sdk/commit/bfb007b40db5326e8b9dc6ddbb4c9bfcb50e0a09))

## [1.0.0-beta.24](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.23...sindarian-server-v1.0.0-beta.24) (2025-12-19)


### Features

* Implemented guards ([a5137c5](https://github.com/LerianStudio/console-sdk/commit/a5137c5cf3733fbe834aa7186145c6c9bf12a6d4))
* Updated IdTableCell ([61fd443](https://github.com/LerianStudio/console-sdk/commit/61fd443e30bbacddea4824254ef04aab05011806))
* Updated readme ([773ae26](https://github.com/LerianStudio/console-sdk/commit/773ae26f2677f532b3d04685ba0f4f977c8fb0d7))

## [1.0.0-beta.23](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.22...sindarian-server-v1.0.0-beta.23) (2025-12-17)


### Features

* Added data-testid to missing components ([3be7734](https://github.com/LerianStudio/console-sdk/commit/3be77349bd92b55de870d3a61a155b468a17ad2f))
* Fixed CSS ([3b46ba4](https://github.com/LerianStudio/console-sdk/commit/3b46ba471e01a0685ce5e5a727a5aff43ecc48af))
* Fixed CSS again ([9d4a129](https://github.com/LerianStudio/console-sdk/commit/9d4a129f5baf99f55487c2181fb0847e7fdf21bc))
* More small fixes ([e5ea1c3](https://github.com/LerianStudio/console-sdk/commit/e5ea1c3c72274411b027cccc49826e6acfe9bd91))


### Bug Fixes

* Case where exception filter returns invalid response. ([fc529bb](https://github.com/LerianStudio/console-sdk/commit/fc529bb49e7195c3193ead77baf8a37fee63b0cc))

## [1.0.0-beta.22](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.21...sindarian-server-v1.0.0-beta.22) (2025-12-01)


### Features

* Try to publish changes. ([a43d3ab](https://github.com/LerianStudio/console-sdk/commit/a43d3abdeba772c56b2908065728867af505b4bd))

## [sindarian-serer-1.0.0-beta.21] - 2025-12-01

[Compare changes](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.20...sindarian-server-v1.0.0-beta.21)
Contributors: Caio Alexandre Troti Caetano, lerian-studio

### ✨ Features
- **Enhanced Testing**: We've introduced additional tests to our backend systems, significantly boosting the robustness and reliability of the software. This improvement helps maintain high-quality standards and ensures a stable experience for all users.

### 📚 Documentation
- **Changelog Updates**: The changelog for sindarian-ui has been updated to reflect the latest changes in version v1.0.0-beta.13. This update provides users with a clear understanding of recent improvements, enhancing transparency and ease of tracking changes.

### 🔧 Maintenance
- **General Release**: We've released sindarian-server v1.0.0-beta.21, incorporating updates across backend, build, dependencies, frontend, and testing components. These updates are part of our ongoing efforts to maintain system stability and integrate the latest improvements.
- **Dependency Updates**: Various dependencies have been updated to ensure compatibility and leverage performance improvements and security patches. This proactive maintenance reduces potential vulnerabilities and enhances overall system performance.


## [1.0.0-beta.20](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.19...sindarian-server-v1.0.0-beta.20) (2025-12-01)


### Features

* Added new methods to server factory. ([ddcb9e1](https://github.com/LerianStudio/console-sdk/commit/ddcb9e1638fe0c139c188c7723531f90f2703f07))
* Added Sidebar animation ([b83497e](https://github.com/LerianStudio/console-sdk/commit/b83497ee745a350a62c36ca9165a52ed8ee0a43b))
* Adjusted CSS styles ([9e7b985](https://github.com/LerianStudio/console-sdk/commit/9e7b9854f139c5806c932446c93d40106b6ff3e2))
* Fixed build ([fd7e801](https://github.com/LerianStudio/console-sdk/commit/fd7e801f9727997023185d4c2efbdd9865abb742))

## [1.0.0-beta.19](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.18...sindarian-server-v1.0.0-beta.19) (2025-11-26)


### Features

* Added more module tests. ([7516e78](https://github.com/LerianStudio/console-sdk/commit/7516e78fd174867be1dae64f226f2e946bbf76b9))
* Added sidebar ([8405e43](https://github.com/LerianStudio/console-sdk/commit/8405e433c88b069e36cd2edcf673dcfce2e4f85c))

## [1.0.0-beta.18](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.17...sindarian-server-v1.0.0-beta.18) (2025-11-21)


### Features

* Added more unit tests. ([37d303d](https://github.com/LerianStudio/console-sdk/commit/37d303d27eacdaf0744d049f77beb7529d912258))
* Exported IconButton ([aa089f3](https://github.com/LerianStudio/console-sdk/commit/aa089f319a25bab3ee06048f672a3f8ea3289bae))

## [1.0.0-beta.17](https://github.com/LerianStudio/console-sdk/compare/sindarian-server-v1.0.0-beta.16...sindarian-server-v1.0.0-beta.17) (2025-11-21)


### Bug Fixes

* prevent Git conflicts in parallel package releases ([abc3ae1](https://github.com/LerianStudio/console-sdk/commit/abc3ae1992fb545d6eb55b5028a126c0910c36c6))
* Route specificity on sindarian-server ([0e91ba5](https://github.com/LerianStudio/console-sdk/commit/0e91ba5cf7acec1cd4b561e2b2cafc232ce377f6))
* update changelog action to use helm-repo branch with working directory ([3166b0a](https://github.com/LerianStudio/console-sdk/commit/3166b0a7ca5945dc2ef4e2f119de4d9dd4c6f22c))
