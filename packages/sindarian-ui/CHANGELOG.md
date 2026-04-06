## [1.0.0-beta.43](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.42...sindarian-ui-v1.0.0-beta.43) (2026-04-06)


### Features

* Adjusted pipeline ([352f6cb](https://github.com/LerianStudio/console-sdk/commit/352f6cbde7df6427bac8c218c6475057c93c115b))
* **ci:** use shared gptchangelog workflow for changelog generation ([dd0a169](https://github.com/LerianStudio/console-sdk/commit/dd0a16928cf91f2739c8024128ccbf7c96d10893))
* Implemented middleware into server ([7a1790a](https://github.com/LerianStudio/console-sdk/commit/7a1790a60eae66b0ef626021cd40d1e18c6f3623))
* Implemented sindarian-logs ([9db48de](https://github.com/LerianStudio/console-sdk/commit/9db48de49a016c0bd5bcf6fa771a90d1390492da))
* Trigger pipeline ([40d045d](https://github.com/LerianStudio/console-sdk/commit/40d045d238b56be6411e0fed8e3ee676c0e12b0e))
* Upgraded dependencies ([984a9ee](https://github.com/LerianStudio/console-sdk/commit/984a9ee36f545869eba16c19ad14a6f35ea5aae5))


### Bug Fixes

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
* **sheet:** prevent sheet from closing when interacting with sonner toasts ([eb88df7](https://github.com/LerianStudio/console-sdk/commit/eb88df77eb5ecb375104c160208f44b036b2f2e8))
* Trigger pipeline ([b5d7092](https://github.com/LerianStudio/console-sdk/commit/b5d7092a171c885c97dbcdf6ff25104be3ecc443))
* Turbo configuration ([3b7f209](https://github.com/LerianStudio/console-sdk/commit/3b7f2095f2168abb8789a188eea36e9cee1e18a9))

# Sindarian-ui Changelog

## [1.0.0](https://github.com/LerianStudio/console-sdk/releases/tag/sindarian-ui-v1.0.0)

- **Features:**
  - Implemented LargeDialog and adjusted dialogs.
  - Added basic and more advanced card components.
  - Introduced PaperCollapsible and adjusted Progress.
  - Configured split libraries for better modularity.
  - Adjusted various UI components including Tabs, Stepper, Alert, Breadcrumb, Input, and Button.

- **Fixes:**
  - Corrected Toaster import path.

- **Improvements:**
  - Updated packages and improved build setup.
  - Enhanced Jest configuration and added more components.
  - Improved storybook configuration and updated components.

Contributors: @caio_aletroca, @ferr3ira-gabriel, @ferr3ira.gabriel, @lf, @lfbarrile01

[View all changes](https://github.com/LerianStudio/console-sdk/commits/sindarian-ui-v1.0.0)

---

## [1.0.0-beta.42](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.41...sindarian-ui-v1.0.0-beta.42) (2026-03-24)


### Features

* **badge:** add semantic status variants (error, success, info, alert) ([82dd7c6](https://github.com/LerianStudio/console-sdk/commit/82dd7c683439c6a1f9495c4e6740b735311a26b9))
* **toast:** migrate from Radix Toast to Sonner ([915ec12](https://github.com/LerianStudio/console-sdk/commit/915ec123b9e33facca5dd56f8f9af95624eb5e1a))


### Bug Fixes

* **sindarian-ui:** fix dark mode input styles, autofill and scrollbar ([992a431](https://github.com/LerianStudio/console-sdk/commit/992a4312c22827b197e0c9f3131b1930aac69e8d))
* **toast:** align default duration with Toaster component (10s) ([6088597](https://github.com/LerianStudio/console-sdk/commit/60885972f3c682f9bfe5684b8b5933e129a669fb))
* **toast:** improve close button styles and align ID type with Sonner ([2081067](https://github.com/LerianStudio/console-sdk/commit/208106703f595a046ae717db27fd85411fada41e))
* **toast:** use theme foreground color for close button hover state ([9cf50ca](https://github.com/LerianStudio/console-sdk/commit/9cf50ca6ceb23136798cf94580279b1deec28183))

## [1.0.0-beta.42](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.41...sindarian-ui-v1.0.0-beta.42) (2026-03-24)


### Features

* **badge:** add semantic status variants (error, success, info, alert) ([82dd7c6](https://github.com/LerianStudio/console-sdk/commit/82dd7c683439c6a1f9495c4e6740b735311a26b9))
* **toast:** migrate from Radix Toast to Sonner ([915ec12](https://github.com/LerianStudio/console-sdk/commit/915ec123b9e33facca5dd56f8f9af95624eb5e1a))


### Bug Fixes

* **sindarian-ui:** fix dark mode input styles, autofill and scrollbar ([992a431](https://github.com/LerianStudio/console-sdk/commit/992a4312c22827b197e0c9f3131b1930aac69e8d))
* **toast:** align default duration with Toaster component (10s) ([6088597](https://github.com/LerianStudio/console-sdk/commit/60885972f3c682f9bfe5684b8b5933e129a669fb))
* **toast:** improve close button styles and align ID type with Sonner ([2081067](https://github.com/LerianStudio/console-sdk/commit/208106703f595a046ae717db27fd85411fada41e))
* **toast:** use theme foreground color for close button hover state ([9cf50ca](https://github.com/LerianStudio/console-sdk/commit/9cf50ca6ceb23136798cf94580279b1deec28183))

## [1.0.0-beta.41](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.40...sindarian-ui-v1.0.0-beta.41) (2026-03-13)


### Features

* **sindarian-ui:** apply scrollbar-thin-translucent to page content and sidebar ([fce5995](https://github.com/LerianStudio/console-sdk/commit/fce5995ec59bc5a8c5a9a0236db546b558b8873b))

## [1.0.0-beta.40](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.39...sindarian-ui-v1.0.0-beta.40) (2026-03-12)


### Features

* **sindarian-ui:** add scrollbar-thin-translucent Tailwind utility ([c5a6935](https://github.com/LerianStudio/console-sdk/commit/c5a6935970c8b8b977a1e7ae118abe5ed5f59134))


### Bug Fixes

* Bug when empty response breaks on Patch operations. ([9179bcf](https://github.com/LerianStudio/console-sdk/commit/9179bcfeae735774d8a52724c811ad88ced8cacf))

## [1.0.0-beta.39](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.38...sindarian-ui-v1.0.0-beta.39) (2026-03-05)


### Bug Fixes

* **sindarian-ui:** improve multiple-select robustness and password field form behavior ([50b914b](https://github.com/LerianStudio/console-sdk/commit/50b914b37c1e49e3828a9a2f6283fe754e50797c))

## [1.0.0-beta.38](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.37...sindarian-ui-v1.0.0-beta.38) (2026-03-04)


### Features

* Added bind overwrite for simple classes ([27f8eb6](https://github.com/LerianStudio/console-sdk/commit/27f8eb604c2e2cb9d5f8ddfce60e2cbb1161e77b))


### Bug Fixes

* **sindarian-ui:** improve active tab trigger text contrast in light mode ([20c51b2](https://github.com/LerianStudio/console-sdk/commit/20c51b2e965b6ab6cfe824350766ae51aafcfac7))

## [1.0.0-beta.37](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.36...sindarian-ui-v1.0.0-beta.37) (2026-02-25)

## [1.0.0-beta.36](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.35...sindarian-ui-v1.0.0-beta.36) (2026-02-20)


### Features

* **sindarian-ui:** add dark mode toggle to Storybook ([ca87f15](https://github.com/LerianStudio/console-sdk/commit/ca87f159a1f08a60b03b243c7bb6c19419f4e466))
* **sindarian-ui:** add design token system and dark mode CSS vars ([87ea615](https://github.com/LerianStudio/console-sdk/commit/87ea6156c3b633dd0c1f81f5eba88d1beb29e9b2))

## [1.0.0-beta.35](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.34...sindarian-ui-v1.0.0-beta.35) (2026-02-12)


### Features

* Small fixes to Sheet styling ([1b15539](https://github.com/LerianStudio/console-sdk/commit/1b1553974a3d26d1d88d63030b8637e46ebe9ae7))

## [1.0.0-beta.34](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.33...sindarian-ui-v1.0.0-beta.34) (2026-02-03)


### Features

* **date-picker-field:** add valueAsString prop for string date handling ([a5a2c63](https://github.com/LerianStudio/console-sdk/commit/a5a2c63197967502dd603e2b01f26d2cfec8fc49))


### Bug Fixes

* **date-picker-field:** add validation for invalid date parsing ([72026a9](https://github.com/LerianStudio/console-sdk/commit/72026a91a345c4662f580d6d005a7a556f81400e))

## [1.0.0-beta.33](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.32...sindarian-ui-v1.0.0-beta.33) (2026-01-28)


### Features

* Fixed StateField styles ([1fb78c4](https://github.com/LerianStudio/console-sdk/commit/1fb78c4793ea72915693004afdf7c30f61b23eed))

## [1.0.0-beta.32](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.31...sindarian-ui-v1.0.0-beta.32) (2026-01-28)


### Features

* Added PasswordField to exports ([7d0a5ba](https://github.com/LerianStudio/console-sdk/commit/7d0a5bab0f9f18aff0e58cd47460e5bcc5c4fa28))

## [1.0.0-beta.31](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.30...sindarian-ui-v1.0.0-beta.31) (2026-01-28)


### Features

* Added onChange to SelectField ([69e8866](https://github.com/LerianStudio/console-sdk/commit/69e8866d893ce99bdb1298845d9b53b87a2ba0a4))

## [1.0.0-beta.30](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.29...sindarian-ui-v1.0.0-beta.30) (2026-01-26)


### Features

* Implemented DatePicker and DateRange fields ([dedc04d](https://github.com/LerianStudio/console-sdk/commit/dedc04d4cb240c8bc9979097a1b8a89da9526167))
* Updated dependencies ([57b55ac](https://github.com/LerianStudio/console-sdk/commit/57b55ac1a09197469c92ad09d586ad5714f1a913))


### Bug Fixes

* Jest new version issues with node 22 ([41f2467](https://github.com/LerianStudio/console-sdk/commit/41f246758c3298fa8f22faf9d1646d6e2cb5f526))

## [1.0.0-beta.29](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.28...sindarian-ui-v1.0.0-beta.29) (2026-01-13)


### Bug Fixes

* **page-header:** add max-width constraint to description in collapsible info ([4e802b8](https://github.com/LerianStudio/console-sdk/commit/4e802b835910cab391a60edd8137df48b9b716f5))

## [1.0.0-beta.28](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.27...sindarian-ui-v1.0.0-beta.28) (2026-01-09)


### Features

* **page-header:** add context for open state and improve layout ([dfd7a1b](https://github.com/LerianStudio/console-sdk/commit/dfd7a1b5eec4ac5f714d97c765de5a16c03b1f1d))

## [1.0.0-beta.27](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.26...sindarian-ui-v1.0.0-beta.27) (2026-01-07)


### Features

* **sindarian-server:** return 204 No Content for DELETE routes with null response ([7065070](https://github.com/LerianStudio/console-sdk/commit/7065070bfda088d38763f6276cb8df9e580baad0))


### Bug Fixes

* **sindarian-ui:** correct ref type in CommandList ([c4a5207](https://github.com/LerianStudio/console-sdk/commit/c4a5207cd74a4cea957d2f5dd3b5ae491a933d91))
* **sindarian-ui:** correct ref type in CommandList ([36ef7e1](https://github.com/LerianStudio/console-sdk/commit/36ef7e1c83612e1354b8bc4184fef9d7801c58aa))
* **sindarian-ui:** prevent scroll propagation in CommandList ([152443a](https://github.com/LerianStudio/console-sdk/commit/152443a197c3950ecd4d373811fd55014ca18c3d))

## [1.0.0-beta.26](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.25...sindarian-ui-v1.0.0-beta.26) (2025-12-30)


### Features

* Added scroll to sidebar ([9d3204f](https://github.com/LerianStudio/console-sdk/commit/9d3204f9d3162573ea9a35f45e3bdb9996c07de5))

## [1.0.0-beta.25](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.24...sindarian-ui-v1.0.0-beta.25) (2025-12-29)


### Features

* Added unit tests for SidebarProvider ([11354bf](https://github.com/LerianStudio/console-sdk/commit/11354bfa738aa742d3d15ef9970f68ab5d7efe86))

## [1.0.0-beta.24](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.23...sindarian-ui-v1.0.0-beta.24) (2025-12-29)


### Features

* Added new method to the provider. ([68cbf11](https://github.com/LerianStudio/console-sdk/commit/68cbf1118d79234aa6f5c992cd90f08811f860c0))

## [1.0.0-beta.23](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.22...sindarian-ui-v1.0.0-beta.23) (2025-12-29)


### Bug Fixes

* Hydration errors ([d616bfc](https://github.com/LerianStudio/console-sdk/commit/d616bfcc7a64c4c49827987454ac939a028b38f8))

## [1.0.0-beta.22](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.21...sindarian-ui-v1.0.0-beta.22) (2025-12-29)


### Features

* Finished sub item collapsible on Sidebar ([e815145](https://github.com/LerianStudio/console-sdk/commit/e815145bae15164acf45dee6bf86d86eb4da2a39))

## [1.0.0-beta.21](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.20...sindarian-ui-v1.0.0-beta.21) (2025-12-23)


### Features

* Implemented Sidebar collapsible items ([42cef79](https://github.com/LerianStudio/console-sdk/commit/42cef79f8d4c5f2ec3adab704ea04c3a02f52153))

## [1.0.0-beta.20](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.19...sindarian-ui-v1.0.0-beta.20) (2025-12-22)


### Bug Fixes

* Sidebar issues ([bfb007b](https://github.com/LerianStudio/console-sdk/commit/bfb007b40db5326e8b9dc6ddbb4c9bfcb50e0a09))

## [1.0.0-beta.19](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.18...sindarian-ui-v1.0.0-beta.19) (2025-12-22)


### Features

* Implemented guards ([a5137c5](https://github.com/LerianStudio/console-sdk/commit/a5137c5cf3733fbe834aa7186145c6c9bf12a6d4))
* Updated readme ([773ae26](https://github.com/LerianStudio/console-sdk/commit/773ae26f2677f532b3d04685ba0f4f977c8fb0d7))


### Bug Fixes

* LocalStorage is undefined. ([15b2252](https://github.com/LerianStudio/console-sdk/commit/15b2252ad86604b6500dbe2ce743aaf23eb3bd50))

## [1.0.0-beta.18](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.17...sindarian-ui-v1.0.0-beta.18) (2025-12-19)


### Features

* Updated IdTableCell ([61fd443](https://github.com/LerianStudio/console-sdk/commit/61fd443e30bbacddea4824254ef04aab05011806))

## [1.0.0-beta.17](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.16...sindarian-ui-v1.0.0-beta.17) (2025-12-17)


### Features

* Added data-testid to missing components ([3be7734](https://github.com/LerianStudio/console-sdk/commit/3be77349bd92b55de870d3a61a155b468a17ad2f))
* More small fixes ([e5ea1c3](https://github.com/LerianStudio/console-sdk/commit/e5ea1c3c72274411b027cccc49826e6acfe9bd91))


### Bug Fixes

* Case where exception filter returns invalid response. ([fc529bb](https://github.com/LerianStudio/console-sdk/commit/fc529bb49e7195c3193ead77baf8a37fee63b0cc))

## [1.0.0-beta.16](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.15...sindarian-ui-v1.0.0-beta.16) (2025-12-02)


### Features

* Fixed CSS again ([9d4a129](https://github.com/LerianStudio/console-sdk/commit/9d4a129f5baf99f55487c2181fb0847e7fdf21bc))

## [1.0.0-beta.15](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.14...sindarian-ui-v1.0.0-beta.15) (2025-12-02)


### Features

* Fixed CSS ([3b46ba4](https://github.com/LerianStudio/console-sdk/commit/3b46ba471e01a0685ce5e5a727a5aff43ecc48af))

## [1.0.0-beta.14](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.13...sindarian-ui-v1.0.0-beta.14) (2025-12-02)


### Features

* Added more tests ([509c318](https://github.com/LerianStudio/console-sdk/commit/509c31823feddcf274af8b75efc7510d2e57dd4a))
* Added new methods to server factory. ([ddcb9e1](https://github.com/LerianStudio/console-sdk/commit/ddcb9e1638fe0c139c188c7723531f90f2703f07))
* Added Sidebar animation ([b83497e](https://github.com/LerianStudio/console-sdk/commit/b83497ee745a350a62c36ca9165a52ed8ee0a43b))
* Fixed build ([fd7e801](https://github.com/LerianStudio/console-sdk/commit/fd7e801f9727997023185d4c2efbdd9865abb742))
* Try to publish changes. ([a43d3ab](https://github.com/LerianStudio/console-sdk/commit/a43d3abdeba772c56b2908065728867af505b4bd))

## [sindarian-ui-1.0.0-beta.13] - 2025-11-27

[Compare changes](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.12...sindarian-ui-v1.0.0-beta.13)
Contributors: Caio Alexandre Troti Caetano, lerian-studio

### ✨ Features
- **Enhanced Visual Styling**: The application now boasts new CSS styles that offer a more cohesive and modern appearance. This update not only improves the aesthetic appeal but also enhances usability, making navigation and interaction more intuitive for users.

### 🔧 Maintenance
- **Dependency Updates**: The build process and dependencies have been updated to align with `sindarian-ui` version 1.0.0-beta.13. This ensures that the project remains stable and compatible with the latest development tools, providing a smoother development experience and reducing potential technical debt.
- **Changelog Documentation**: Updated the changelog to accurately reflect the changes and improvements from `sindarian-ui` version 1.0.0-beta.12. This helps users track the project's progress and understand the evolution of its features.


## [sindarian-ui-1.0.0-beta.12] - 2025-11-26

[Compare changes](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.11...sindarian-ui-v1.0.0-beta.12)
Contributors: Caio Alexandre Troti Caetano, lerian-studio

### ✨ Features
- **New Navigation Sidebar**: We've added a sidebar to the frontend, making it easier for users to navigate through different sections of the application. This improvement enhances accessibility and streamlines user interaction with the platform.

### 📚 Documentation
- **Updated CHANGELOG for sindarian-ui**: The changelog now reflects recent updates and improvements, providing users with clear insights into the latest version's changes and new features.

### 🔧 Maintenance
- **Dependency Updates**: Released new beta versions for sindarian-ui (v1.0.0-beta.12) and sindarian-server (v1.0.0-beta.18 and v1.0.0-beta.19). These updates ensure compatibility with the latest tools and libraries, contributing to overall system stability and security.
- **Code Quality Enhancements**: General maintenance across backend and frontend components, including minor code quality improvements. These changes help maintain the health of the codebase and prepare the system for future enhancements.


## [sindarian-ui-1.0.0-beta.11] - 2025-11-21

[Compare changes](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.10...sindarian-ui-v1.0.0-beta.11)
Contributors: Caio Alexandre Troti Caetano, lerian-studio

### ✨ Features
- **New IconButton Component**: We've added an `IconButton` to our frontend toolkit, allowing developers to seamlessly integrate icon-based buttons into their applications. This component enhances both the aesthetic and functional aspects of user interfaces, making it easier to create visually appealing and interactive designs.

### 🔧 Maintenance
- **Dependency and Build Updates**: As part of the `sindarian-ui` release v1.0.0-beta.11, we've updated our project dependencies and build configurations. These updates ensure our system remains compatible with the latest tools and libraries, providing a stable foundation for ongoing development and future feature expansions. Enjoy a smooth transition with no breaking changes.


## [1.0.0-beta.10](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.9...sindarian-ui-v1.0.0-beta.10) (2025-11-21)


### Bug Fixes

* prevent Git conflicts in parallel package releases ([abc3ae1](https://github.com/LerianStudio/console-sdk/commit/abc3ae1992fb545d6eb55b5028a126c0910c36c6))
* update changelog action to use helm-repo branch with working directory ([3166b0a](https://github.com/LerianStudio/console-sdk/commit/3166b0a7ca5945dc2ef4e2f119de4d9dd4c6f22c))
