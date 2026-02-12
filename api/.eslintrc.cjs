const path = require('path')

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: path.resolve(__dirname, 'tsconfig.json'),
  },
  plugins: [
    "@typescript-eslint",
    "import",
    "simple-import-sort",
    "unused-imports",
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-redundant-type-constituents": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "unused-imports/no-unused-imports": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "unused-imports/no-unused-imports": "error",
    "no-console": "error",
    "no-debugger": "error",
    "no-var": "off",
    "prefer-const": "error",
    "no-duplicate-imports": "error",
    "@typescript-eslint/require-await": "error",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "max-lines-per-function": ["error", { max: 80 }],
    complexity: ["error", { max: 10 }],
    "object-property-newline": ["error", { allowAllPropertiesOnSameLine: false }],
  },
  ignorePatterns: ['dist', 'node_modules', '*.js', '.eslintrc.cjs', 'build.js'],
  overrides: [
    {
      files: ['*.js', '*.cjs'],
      parserOptions: {
        project: null,
      },
    },
  ],
}
