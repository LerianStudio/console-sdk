## [sindarian-ui-1.0.0-beta.9] - 2025-11-21

[Compare changes](https://github.com/LerianStudio/console-sdk/compare/sindarian-ui-v1.0.0-beta.8...sindarian-ui-v1.0.0-beta.9)
Contributors: Caio Alexandre Troti Caetano, Gabriel Castro, lerian-studio

### ✨ Features
- **Backend Flexibility**: Enhanced the backend's modularity with new Pipes and Interceptors, allowing for more customizable request handling and response formatting. This improvement provides developers with greater control over application behavior, leading to more robust and adaptable systems.
- **Comprehensive Error Handling**: Introduced support for multiple APP_FILTERs, enabling developers to implement more sophisticated error management strategies. This feature enhances system reliability by allowing multiple global exception filters.

### 🐛 Bug Fixes
- **Route Specificity**: Fixed an issue with route matching in the sindarian-server, ensuring accurate and reliable server responses. This resolves previous inconsistencies and improves user interaction with the server.
- **Test Accuracy**: Updated test mocks for `PipeHandler.execute` to better reflect real-world scenarios, enhancing the reliability and relevance of test results.
- **Decorator Functionality**: Corrected decorators to return actual values instead of metadata objects, ensuring that decorated functions behave as expected and deliver accurate outputs.

### 🔄 Changes
- **Frontend Consistency**: Implemented a process to include CSS files in the distribution directory during builds, ensuring consistent styling across all environments. This change enhances the visual experience for users by maintaining uniformity in application appearance.
- **Form Handling**: Added a missing client directive in `form.tsx`, improving client-side validation and interaction for a better user experience.

### 📚 Documentation
- **Enhanced Guidance**: Improved documentation for backend and frontend components, providing clearer instructions and better support for developers working with the console-sdk.

### 🔧 Maintenance
- **Dependency Updates**: Performed multiple chore updates, including version bumps and dependency updates across backend, build, and frontend components. These updates keep the project secure and compatible with the latest libraries and tools.


