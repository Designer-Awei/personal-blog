/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./components/theme-provider.jsx":
/*!***************************************!*\
  !*** ./components/theme-provider.jsx ***!
  \***************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ThemeProvider: () => (/* binding */ ThemeProvider)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_themes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-themes */ \"next-themes\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([next_themes__WEBPACK_IMPORTED_MODULE_1__]);\nnext_themes__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n/* __next_internal_client_entry_do_not_use__ ThemeProvider auto */ \n\nfunction ThemeProvider({ children, ...props }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_themes__WEBPACK_IMPORTED_MODULE_1__.ThemeProvider, {\n        ...props,\n        children: children\n    }, void 0, false, {\n        fileName: \"D:\\\\AI_project\\\\personal-blog\\\\components\\\\theme-provider.jsx\",\n        lineNumber: 6,\n        columnNumber: 10\n    }, this);\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9jb21wb25lbnRzL3RoZW1lLXByb3ZpZGVyLmpzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUVpRTtBQUUxRCxTQUFTQSxjQUFjLEVBQUVFLFFBQVEsRUFBRSxHQUFHQyxPQUFPO0lBQ2xELHFCQUFPLDhEQUFDRixzREFBa0JBO1FBQUUsR0FBR0UsS0FBSztrQkFBR0Q7Ozs7OztBQUN6QyIsInNvdXJjZXMiOlsid2VicGFjazovL3BlcnNvbmFsLWJsb2cvLi9jb21wb25lbnRzL3RoZW1lLXByb3ZpZGVyLmpzeD9lMjBjIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIGNsaWVudFwiXHJcblxyXG5pbXBvcnQgeyBUaGVtZVByb3ZpZGVyIGFzIE5leHRUaGVtZXNQcm92aWRlciB9IGZyb20gXCJuZXh0LXRoZW1lc1wiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gVGhlbWVQcm92aWRlcih7IGNoaWxkcmVuLCAuLi5wcm9wcyB9KSB7XHJcbiAgcmV0dXJuIDxOZXh0VGhlbWVzUHJvdmlkZXIgey4uLnByb3BzfT57Y2hpbGRyZW59PC9OZXh0VGhlbWVzUHJvdmlkZXI+XHJcbn0gIl0sIm5hbWVzIjpbIlRoZW1lUHJvdmlkZXIiLCJOZXh0VGhlbWVzUHJvdmlkZXIiLCJjaGlsZHJlbiIsInByb3BzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./components/theme-provider.jsx\n");

/***/ }),

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _components_theme_provider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../components/theme-provider */ \"./components/theme-provider.jsx\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_2__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_components_theme_provider__WEBPACK_IMPORTED_MODULE_1__]);\n_components_theme_provider__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\nfunction App({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_theme_provider__WEBPACK_IMPORTED_MODULE_1__.ThemeProvider, {\n        attribute: \"class\",\n        defaultTheme: \"system\",\n        enableSystem: true,\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n            ...pageProps\n        }, void 0, false, {\n            fileName: \"D:\\\\AI_project\\\\personal-blog\\\\pages\\\\_app.js\",\n            lineNumber: 7,\n            columnNumber: 13\n        }, this)\n    }, void 0, false, {\n        fileName: \"D:\\\\AI_project\\\\personal-blog\\\\pages\\\\_app.js\",\n        lineNumber: 6,\n        columnNumber: 9\n    }, this);\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBNEQ7QUFDOUI7QUFFZixTQUFTQyxJQUFJLEVBQUVDLFNBQVMsRUFBRUMsU0FBUyxFQUFFO0lBQ2hELHFCQUNJLDhEQUFDSCxxRUFBYUE7UUFBQ0ksV0FBVTtRQUFRQyxjQUFhO1FBQVNDLFlBQVk7a0JBQy9ELDRFQUFDSjtZQUFXLEdBQUdDLFNBQVM7Ozs7Ozs7Ozs7O0FBR3BDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcGVyc29uYWwtYmxvZy8uL3BhZ2VzL19hcHAuanM/ZTBhZCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUaGVtZVByb3ZpZGVyIH0gZnJvbSAnLi4vY29tcG9uZW50cy90aGVtZS1wcm92aWRlcidcclxuaW1wb3J0ICcuLi9zdHlsZXMvZ2xvYmFscy5jc3MnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBBcHAoeyBDb21wb25lbnQsIHBhZ2VQcm9wcyB9KSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIDxUaGVtZVByb3ZpZGVyIGF0dHJpYnV0ZT1cImNsYXNzXCIgZGVmYXVsdFRoZW1lPVwic3lzdGVtXCIgZW5hYmxlU3lzdGVtPlxyXG4gICAgICAgICAgICA8Q29tcG9uZW50IHsuLi5wYWdlUHJvcHN9IC8+XHJcbiAgICAgICAgPC9UaGVtZVByb3ZpZGVyPlxyXG4gICAgKTtcclxufSAiXSwibmFtZXMiOlsiVGhlbWVQcm92aWRlciIsIkFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyIsImF0dHJpYnV0ZSIsImRlZmF1bHRUaGVtZSIsImVuYWJsZVN5c3RlbSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "next-themes":
/*!******************************!*\
  !*** external "next-themes" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = import("next-themes");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./pages/_app.js"));
module.exports = __webpack_exports__;

})();