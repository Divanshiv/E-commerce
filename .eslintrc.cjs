module.exports = {
  root: true,
  env: { browser: true, node: true, es2022: true },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }],
    'no-console': 'off',
    'no-undef': 'error',
  },
  overrides: [
    {
      files: ['frontend/**/*.jsx', 'frontend/**/*.js'],
      env: { browser: true },
      globals: { React: 'writable' },
    },
    {
      files: ['backend/**/*.js'],
      env: { node: true },
    },
  ],
};
