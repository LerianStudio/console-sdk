## [2.0.0-beta.1](https://github.com/LerianStudio/console-sdk/compare/sindarian-tokens-v1.2.0-beta.1...sindarian-tokens-v2.0.0-beta.1) (2026-09-09)


### ⚠ BREAKING CHANGES

* **sindarian-ui:** ConfirmationDialog requires `pendingLabel` whenever `loading`
is passed; the implicit "Processing..." default is gone.

### Features

* **sindarian-ui:** add MultipleFileUpload beside the single-file one ([a28035e](https://github.com/LerianStudio/console-sdk/commit/a28035e125df2b524c76009b0b29a345c84712e3))
* **sindarian-ui:** forward what the form fields were dropping ([ff1279e](https://github.com/LerianStudio/console-sdk/commit/ff1279e80289764a2ea51dff2aad3adc337b8112))


### Bug Fixes

* apply the repair the steward validated on this head ([4e39399](https://github.com/LerianStudio/console-sdk/commit/4e3939931a3764df868f216294cae355e61553db))
* apply the repair the steward validated on this head ([324114b](https://github.com/LerianStudio/console-sdk/commit/324114b1498b39c46057d22e40923287a8abdc26))
* apply the repair the steward validated on this head ([6963524](https://github.com/LerianStudio/console-sdk/commit/69635245b592ecc8798b8aa26f2789b1aa38c358))
* apply the repair the steward validated on this head ([7447721](https://github.com/LerianStudio/console-sdk/commit/74477216e0f6876ff0d746ba9f3e337f8cfa524a))
* apply the repair the steward validated on this head ([436b4c5](https://github.com/LerianStudio/console-sdk/commit/436b4c593b00634dcc4863a3d2f08a3cd770af28))
* apply the repair the steward validated on this head ([337c60f](https://github.com/LerianStudio/console-sdk/commit/337c60f9fa4c793208b415572d1dc18a1f4ff1a5))
* apply the repair the steward validated on this head ([ed3ca04](https://github.com/LerianStudio/console-sdk/commit/ed3ca04d16c56b17a69106cebe4a68bb8cedcfcb))
* apply the repair the steward validated on this head ([0a4e6cc](https://github.com/LerianStudio/console-sdk/commit/0a4e6cc3fac2d052bcb1ab6d14e1fe3487d22b1a))
* **file-upload:** hold the cap and abandon reads on unmount ([c97ad4c](https://github.com/LerianStudio/console-sdk/commit/c97ad4c7537f7bd92aea0319b79d628ac670077d))
* **file-upload:** validate the batch before applying the cap ([720678d](https://github.com/LerianStudio/console-sdk/commit/720678db8410f8550ee74a9cb98781f907fa29b4))
* **logs:** reach for the error code when the message is empty ([dc5336f](https://github.com/LerianStudio/console-sdk/commit/dc5336f23a3caab545e84bd02ef7c024a7c05862))
* **sindarian-logs:** stop logging the whole upstream body ([8e22900](https://github.com/LerianStudio/console-sdk/commit/8e229001d008ad507f5b1d61cc731c811161610a))
* **sindarian-ui:** accept rich confirmation copy, require pendingLabel ([2d80366](https://github.com/LerianStudio/console-sdk/commit/2d803660ff4f0b3670195d43b249e1d366de6fbc))
* **sindarian-ui:** add a disabled prop to DateRangePicker ([c34dc87](https://github.com/LerianStudio/console-sdk/commit/c34dc87f8a731141b3a42adb90f6b3c04a298361)), closes [#171](https://github.com/LerianStudio/console-sdk/issues/171)
* **sindarian-ui:** add locale to date fields and pin required picks ([322031e](https://github.com/LerianStudio/console-sdk/commit/322031edaa1027ff1ea9d3e3962b2cd92f9c5494)), closes [#171](https://github.com/LerianStudio/console-sdk/issues/171)
* **sindarian-ui:** announce data table sort state with aria-sort ([a0d629e](https://github.com/LerianStudio/console-sdk/commit/a0d629e063def140e43e9812a9f363d3d4669656)), closes [#173](https://github.com/LerianStudio/console-sdk/issues/173)
* **sindarian-ui:** cancel the browser drop on a disabled zone ([c414f52](https://github.com/LerianStudio/console-sdk/commit/c414f52536348741d26ed92a2cc439bfe6d23ec0))
* **sindarian-ui:** carry leaf max widths up to a grouped header ([375e1e2](https://github.com/LerianStudio/console-sdk/commit/375e1e2b28a3634a04d9e35bb0f1ce7bce7ecd8f))
* **sindarian-ui:** clear the open segment when the date picker is disabled ([c0f5f67](https://github.com/LerianStudio/console-sdk/commit/c0f5f673a890e833b044be6d5064c09e9d7ef485))
* **sindarian-ui:** darken light destructive to clear AA ([489b003](https://github.com/LerianStudio/console-sdk/commit/489b003421adb60d432bfebd519a9078ece7f851))
* **sindarian-ui:** default EntityBoxHeaderTitle to h2 and lift subtitle contrast to AA ([54eb1c1](https://github.com/LerianStudio/console-sdk/commit/54eb1c1777888755e78f5e8a79a440dfb9142489)), closes [#27272](https://github.com/LerianStudio/console-sdk/issues/27272)
* **sindarian-ui:** drop the tight tracking from CardTitle ([1f03bd0](https://github.com/LerianStudio/console-sdk/commit/1f03bd07e59d1e6d409707684732248c8f3696cb))
* **sindarian-ui:** expose a labelled Badge as an image to assistive tech ([3cadcb4](https://github.com/LerianStudio/console-sdk/commit/3cadcb4de946b5a6c4053c5cf01da3a9751665c1))
* **sindarian-ui:** fix page header heading levels and action overflow ([9026b5e](https://github.com/LerianStudio/console-sdk/commit/9026b5e8c2160f9d83f866086d6d581e9667ae8d))
* **sindarian-ui:** forward rest props from AlertBanner to its root ([c20ba3a](https://github.com/LerianStudio/console-sdk/commit/c20ba3a0224249b65d8e4e6ae3f80114e4bcd62c))
* **sindarian-ui:** forward value and max to Progress ([d7474ad](https://github.com/LerianStudio/console-sdk/commit/d7474ade989b35e503e889a2a40fe2bdd44d8db5))
* **sindarian-ui:** give the date picker labels the console voice ([235cd4e](https://github.com/LerianStudio/console-sdk/commit/235cd4eff196cf840c1a4ddff3845521d52a6f90))
* **sindarian-ui:** give the range trigger a border, body face and marker ([f0bb149](https://github.com/LerianStudio/console-sdk/commit/f0bb149c2ea808252b89f46f9f58805ae72304fa)), closes [#171](https://github.com/LerianStudio/console-sdk/issues/171)
* **sindarian-ui:** hand the day button ARIA back to react-day-picker ([aa09402](https://github.com/LerianStudio/console-sdk/commit/aa09402df3cadf07e3090b904b7c48757c1ccd27)), closes [#171](https://github.com/LerianStudio/console-sdk/issues/171)
* **sindarian-ui:** keep explicit column sizes and size grouped headers ([41f433a](https://github.com/LerianStudio/console-sdk/commit/41f433a4704ab3e5ba77d312390b7779f8eb61c5))
* **sindarian-ui:** keep the ARIA, focus and describedby promises ([fb7f128](https://github.com/LerianStudio/console-sdk/commit/fb7f1286949b8dea246cdaab1a96d3feb77a0707))
* **sindarian-ui:** keep the page header title at its min-content width ([5eda20b](https://github.com/LerianStudio/console-sdk/commit/5eda20be7dc2d3f4b23c3ab2b24320757ba7516f)), closes [#174](https://github.com/LerianStudio/console-sdk/issues/174)
* **sindarian-ui:** label the month dropdown in the calendar's own locale ([f766078](https://github.com/LerianStudio/console-sdk/commit/f7660782fd35376c1107d2fc415b5cb896553860))
* **sindarian-ui:** let form fields work without react-hook-form ([d243fb4](https://github.com/LerianStudio/console-sdk/commit/d243fb4823760a38d93a3c7c5d01918054453c00))
* **sindarian-ui:** let the page header title yield to the action row ([ac006ee](https://github.com/LerianStudio/console-sdk/commit/ac006eed8e9283246cbf61dcee807f94c13d7c42)), closes [#170](https://github.com/LerianStudio/console-sdk/issues/170) [#168](https://github.com/LerianStudio/console-sdk/issues/168) [#170](https://github.com/LerianStudio/console-sdk/issues/170)
* **sindarian-ui:** lift dark muted ink to clear AA ([8d44835](https://github.com/LerianStudio/console-sdk/commit/8d44835cd159959109302b1a9e6ceb4a2d59e397)), closes [#A1A1](https://github.com/LerianStudio/console-sdk/issues/A1A1) [#C9C9](https://github.com/LerianStudio/console-sdk/issues/C9C9)
* **sindarian-ui:** make MultipleSelect controlled props satisfiable ([282b650](https://github.com/LerianStudio/console-sdk/commit/282b65096013aa68d86f65c849304f8e278a1449))
* **sindarian-ui:** paint a negative money amount with the error ink ([560faae](https://github.com/LerianStudio/console-sdk/commit/560faae8001ebf627d48b9151bb1c9063d010756))
* **sindarian-ui:** paint FormMessage with the error text token ([ecb865e](https://github.com/LerianStudio/console-sdk/commit/ecb865eaba94478797974ed9f0d9f226584ca2c4))
* **sindarian-ui:** paint kit inks with AA tokens and lift the focus ring ([da61447](https://github.com/LerianStudio/console-sdk/commit/da61447f383c2127e0df1cf940ae12e9b25d82bb))
* **sindarian-ui:** put figures on Inter and tick on the type ramp ([b79c298](https://github.com/LerianStudio/console-sdk/commit/b79c298b5ede19cae78d5d7b847935b5d20a2899))
* **sindarian-ui:** reattach the field ref when the field name changes ([1738ce9](https://github.com/LerianStudio/console-sdk/commit/1738ce96fd75613c303328975a07829cd7ccf286))
* **sindarian-ui:** register Autocomplete items, label the clear button ([69266ee](https://github.com/LerianStudio/console-sdk/commit/69266eec9ab879cbd907a682c2ea2fd93831549c))
* **sindarian-ui:** remove dead cmdk-input-wrapper selector from CommandDialog ([158c76c](https://github.com/LerianStudio/console-sdk/commit/158c76ce055724648346444d543e4d626fee7479))
* **sindarian-ui:** separate badge children with a default gap ([dc8e118](https://github.com/LerianStudio/console-sdk/commit/dc8e1188c846819f10381a860234ca0032e5e761))
* **sindarian-ui:** ship a plain-CSS reduced-motion floor ([96ea7ce](https://github.com/LerianStudio/console-sdk/commit/96ea7ce7eed1827e6b63979bd02b60977aa371b5))
* **sindarian-ui:** size table columns and give VirtualizedTable a head seam ([a875d56](https://github.com/LerianStudio/console-sdk/commit/a875d56d1014390f94e80da7f47a0758f0443475))
* **sindarian-ui:** skip the page header children row for empty nodes ([00f319b](https://github.com/LerianStudio/console-sdk/commit/00f319ba9981e120f11080989d07ae86485a0985))
* **sindarian-ui:** speak product-console's table-head label voice ([f72048b](https://github.com/LerianStudio/console-sdk/commit/f72048b1c0141243e63bf329163f46d3fac2a42e))
* **sindarian-ui:** stop dimming the system text tokens to 70% ([0c210ed](https://github.com/LerianStudio/console-sdk/commit/0c210ed0f9e157f7cce232ba13bc35e34b8dc854))
* **sindarian-ui:** truncate a long select value in the trigger ([c927fde](https://github.com/LerianStudio/console-sdk/commit/c927fdeb592f2a4e122d2f700e5ac5f74ccf0f51))
* **sindarian-ui:** type SelectField value and onChange by its multi flag ([f48eedc](https://github.com/LerianStudio/console-sdk/commit/f48eedc16dad936eaec191a3bfd466f104dce4d9))

## [1.2.0-beta.1](https://github.com/LerianStudio/console-sdk/compare/sindarian-tokens-v1.1.0...sindarian-tokens-v1.2.0-beta.1) (2026-09-02)


### Features

* **sindarian-ui:** add a destructive button variant ([a96f033](https://github.com/LerianStudio/console-sdk/commit/a96f033e966385dea48315bee8856c83598c6704))
* **sindarian-ui:** add a heading-level escape hatch to CardTitle ([37baf21](https://github.com/LerianStudio/console-sdk/commit/37baf21e6d46f39516211fc9ef086b920fea68d1))
* **sindarian-ui:** add a small badge size ([fec2d9a](https://github.com/LerianStudio/console-sdk/commit/fec2d9aca68cac40b61b1eb5d7ea94ba79b6e5d1))
* **sindarian-ui:** add badge credit variant ([2098091](https://github.com/LerianStudio/console-sdk/commit/2098091160bfb99c472ff5797256b4335e69027a))
* **sindarian-ui:** add DataTable headClassName and footer seams ([495edab](https://github.com/LerianStudio/console-sdk/commit/495edabfa98f946d97ddb77908509ebe59bccfb1))
* **sindarian-ui:** add domain and enterprise component seams ([447b366](https://github.com/LerianStudio/console-sdk/commit/447b3668a32fdbb35fa1261553d4ce2e5ae027a5))
* **sindarian-ui:** add page-header margin seams ([610e194](https://github.com/LerianStudio/console-sdk/commit/610e1947ccd4296ab3f63786f02f38be70881f8b))
* **sindarian-ui:** allow naming the AppShell banner landmark ([939a812](https://github.com/LerianStudio/console-sdk/commit/939a812d1b9d7c14a50313bafe6266f5c4cbd844))
* **sindarian-ui:** follow the resolved theme in Toaster ([b5b7c58](https://github.com/LerianStudio/console-sdk/commit/b5b7c58c710b248ceba55bcbbd7336a0c42341c1))
* **sindarian-ui:** give sidebar expand button an accessible name and state ([50e0f8a](https://github.com/LerianStudio/console-sdk/commit/50e0f8ab83501c7d7cd14b2e8de769cf16803ed2))
* **sindarian-ui:** let the alert-dialog cancel take a variant ([506e258](https://github.com/LerianStudio/console-sdk/commit/506e258ea4de32d7709bada682dd9fb0d26deb0b))
* **sindarian-ui:** localize the ConfirmationDialog pending announcement ([73027fc](https://github.com/LerianStudio/console-sdk/commit/73027fc4130a65d378c1dbf19766825507cc2414))
* **sindarian-ui:** merge the button variant classes in cn ([a6b8965](https://github.com/LerianStudio/console-sdk/commit/a6b896572a0070401e5148acfa1eaa3e1c934059))
* **sindarian-ui:** thread a variant through AlertDialogAction ([4c29964](https://github.com/LerianStudio/console-sdk/commit/4c29964376af87d6cab0d86c343e2bd2e339be10))


### Bug Fixes

* **sindarian-ui:** declare color-scheme in the light and dark theme blocks ([f9f40b2](https://github.com/LerianStudio/console-sdk/commit/f9f40b2bf577ec91c331c998e7246176e994054e))
* **sindarian-ui:** define --destructive for dark mode ([9b39c57](https://github.com/LerianStudio/console-sdk/commit/9b39c57f1bf51ce7ce430691357cdca71387d8bb)), closes [#EF4444](https://github.com/LerianStudio/console-sdk/issues/EF4444) [#F87272](https://github.com/LerianStudio/console-sdk/issues/F87272) [#430A0](https://github.com/LerianStudio/console-sdk/issues/430A0) [#1](https://github.com/LerianStudio/console-sdk/issues/1) [#EF4343](https://github.com/LerianStudio/console-sdk/issues/EF4343) [#27272](https://github.com/LerianStudio/console-sdk/issues/27272) [#3F3F46](https://github.com/LerianStudio/console-sdk/issues/3F3F46) [#1](https://github.com/LerianStudio/console-sdk/issues/1) [#3](https://github.com/LerianStudio/console-sdk/issues/3)
* **sindarian-ui:** drop caret-blink keyframes duplicated from tw-animate-css ([7dfc7a8](https://github.com/LerianStudio/console-sdk/commit/7dfc7a8531cfd63765fd2f37ecdfe59e5718e826))
* **sindarian-ui:** drop the dangling button font-size var ([a9a58c9](https://github.com/LerianStudio/console-sdk/commit/a9a58c976a12985e49eb64aae4143234eb646bc3))
* **sindarian-ui:** give --font-sans a working fallback ([91957c5](https://github.com/LerianStudio/console-sdk/commit/91957c5d7559393b5cea878326c83b4a60938848)), closes [#3](https://github.com/LerianStudio/console-sdk/issues/3)
* **sindarian-ui:** give kit buttons a keyboard focus ring ([1b3df7b](https://github.com/LerianStudio/console-sdk/commit/1b3df7b76b7e32fa05d62cdbfda1cbad3d5064d0))
* **sindarian-ui:** guard kit animations behind prefers-reduced-motion ([2220ded](https://github.com/LerianStudio/console-sdk/commit/2220dedcc0db0ada02686ba83ba6b9e6763ed069))
* **sindarian-ui:** keep the listbox in the DOM so aria-controls resolves ([ad0d8dd](https://github.com/LerianStudio/console-sdk/commit/ad0d8dd4b51e8a747310bdb6b4f4a7bbc177cff2)), closes [LerianStudio/console-sdk#150](https://github.com/LerianStudio/console-sdk/issues/150)
* **sindarian-ui:** keep the ruled marker in sync under forwarded data-variant ([093cb99](https://github.com/LerianStudio/console-sdk/commit/093cb995982622e6a8bc9e5f1d374565defdb0c2))
* **sindarian-ui:** lift dark credit pair to meet AA over cards ([1590cd8](https://github.com/LerianStudio/console-sdk/commit/1590cd8b2e4d9e6cca3086996550cc19d2ddebb6)), closes [#FCA6A6](https://github.com/LerianStudio/console-sdk/issues/FCA6A6) [#3F3F46](https://github.com/LerianStudio/console-sdk/issues/3F3F46) [#524950](https://github.com/LerianStudio/console-sdk/issues/524950) [#3F3F46](https://github.com/LerianStudio/console-sdk/issues/3F3F46) [#27272](https://github.com/LerianStudio/console-sdk/issues/27272)
* **sindarian-ui:** make ConfirmationDialog a real alert dialog ([1cf5304](https://github.com/LerianStudio/console-sdk/commit/1cf5304986e490b2a5b20f1cecf510d63d5221e2))
* **sindarian-ui:** quote the Inter font-family fallback ([2da0a43](https://github.com/LerianStudio/console-sdk/commit/2da0a4357e8c04636d6611ace7502f00963755d4))
* **sindarian-ui:** render DataTable heads in the kit label voice ([3bbeea4](https://github.com/LerianStudio/console-sdk/commit/3bbeea4105bc0bad194db385063b7859d17e5cba))
* **sindarian-ui:** restore the ConfirmationDialog cancel variant ([86b013d](https://github.com/LerianStudio/console-sdk/commit/86b013dbb79cd320670daa8b34e659f06dc9ae0b))
* **sindarian-ui:** theme sonner toasts through system tokens ([748af29](https://github.com/LerianStudio/console-sdk/commit/748af2935bccd9e4c562acbbda4badbb83671d4b)), closes [#22c55](https://github.com/LerianStudio/console-sdk/issues/22c55) [#ef4444](https://github.com/LerianStudio/console-sdk/issues/ef4444) [#f59e0](https://github.com/LerianStudio/console-sdk/issues/f59e0) [#3](https://github.com/LerianStudio/console-sdk/issues/3)
* **sindarian-ui:** tokenize badge destructive variant ([2a097db](https://github.com/LerianStudio/console-sdk/commit/2a097db243f5724c2e4d824034c8298b010a0ddc))

# Sindarian-tokens Changelog

## [1.1.0](https://github.com/LerianStudio/console-sdk/releases/tag/sindarian-tokens-v1.1.0)

- **Features**
  - Release v1.1.0
  - Release v1.1.0-beta.1

- **Contributors**
  - @fred

[Compare changes](https://github.com/LerianStudio/console-sdk/compare/sindarian-tokens-v1.0.2...sindarian-tokens-v1.1.0)

---

## [1.1.0](https://github.com/LerianStudio/console-sdk/compare/sindarian-tokens-v1.0.2...sindarian-tokens-v1.1.0) (2026-08-26)


### Features

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

## [1.1.0-beta.1](https://github.com/LerianStudio/console-sdk/compare/sindarian-tokens-v1.0.2...sindarian-tokens-v1.1.0-beta.1) (2026-08-26)


### Features

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

# Sindarian-tokens Changelog

## [1.0.2](https://github.com/LerianStudio/console-sdk/releases/tag/sindarian-tokens-v1.0.2)

- Fixes:
  - Dark variant now correctly reaches the element carrying the class.

Contributors: @jefferson.comff

[Compare changes](https://github.com/LerianStudio/console-sdk/compare/sindarian-tokens-v1.0.1...sindarian-tokens-v1.0.2)

---

## [1.0.1](https://github.com/LerianStudio/console-sdk/releases/tag/sindarian-tokens-v1.0.1)

- Fixes:
  - Stop the contrast instrument from returning incorrect colors silently.

Contributors: @jeff, @jefferson.comff

[Compare changes](https://github.com/LerianStudio/console-sdk/compare/sindarian-tokens-v1.0.0...sindarian-tokens-v1.0.1)

---

## [1.0.0](https://github.com/LerianStudio/console-sdk/releases/tag/sindarian-tokens-v1.0.0)

- **Features**
  - Added the shared, WCAG-gated console token package.

Contributors: @jefferson.comff

[View all changes](https://github.com/LerianStudio/console-sdk/commits/sindarian-tokens-v1.0.0)
