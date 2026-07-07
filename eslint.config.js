const js = require('@eslint/js');
const jest = require('eslint-plugin-jest');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        RetryError: 'readonly',
        Segment: 'readonly'
      }
    },
    rules: {
      indent: ['error', 2, { SwitchCase: 1 }],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^onRequest$',
          argsIgnorePattern: '^_+$',
          // eslint 9+ changed the default to 'all'; keep the eslint 8 behavior
          // of not flagging unused catch bindings so existing code is unchanged.
          caughtErrors: 'none'
        }
      ],
      // New in eslint 10 recommended; not enforced under the previous eslint 8
      // config. Disabled to preserve prior behavior (no source changes).
      'preserve-caught-error': 'off'
    }
  },
  // Apply jest-specific linting to test files only
  // https://github.com/jest-community/eslint-plugin-jest#running-rules-only-on-test-related-files
  {
    files: ['**/*.test.js'],
    ...jest.configs['flat/all'],
    rules: {
      ...jest.configs['flat/all'].rules,
      // These jest rules require TypeScript type information; this is a plain
      // JS project with no typed-linting parser, so disable them.
      'jest/no-error-equal': 'off',
      'jest/no-unnecessary-assertion': 'off',
      'jest/valid-expect-with-promise': 'off',
      // New in eslint-plugin-jest 28/29, NOT enforced by the previous v27
      // plugin:jest/all. Disabled to preserve prior lint behavior (no test
      // changes): prefer-importing-jest-globals would inject an ESM import into
      // these CommonJS test files (globals come from setup.js).
      'jest/prefer-importing-jest-globals': 'off',
      'jest/prefer-ending-with-an-expect': 'off',
      'jest/prefer-to-have-been-called-times': 'off',
      'jest/prefer-to-have-been-called': 'off',
      'jest/padding-around-after-all-blocks': 'off',
      'jest/padding-around-after-each-blocks': 'off',
      'jest/padding-around-all': 'off',
      'jest/padding-around-before-all-blocks': 'off',
      'jest/padding-around-before-each-blocks': 'off',
      'jest/padding-around-describe-blocks': 'off',
      'jest/padding-around-expect-groups': 'off',
      'jest/padding-around-test-blocks': 'off'
    }
  }
];
