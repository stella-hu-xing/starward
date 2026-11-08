module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module'
  },
  env: {
    node: true,
    browser: true,
    es2024: true
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.cjs'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/require-await': 'off',
    'no-console': 'off'
  }
};
