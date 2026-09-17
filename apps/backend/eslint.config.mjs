// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Nest binds controller/route methods itself, so treating a bare method
      // reference as an unbound `this` risk is a false positive on that pattern.
      '@typescript-eslint/unbound-method': 'off',
      // These flag `any` crossing external boundaries (SerpAPI JSON, Supabase
      // client generics) that aren't typed upstream — real hardening needs
      // schemas/type guards at each boundary, tracked separately, not a blanket
      // lint failure today.
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
    },
  },
  {
    // Test doubles only. A fake standing in for an async repository/use-case
    // must return a Promise to satisfy the interface it replaces, but has
    // nothing to await — `require-await` flags every one of them. Scoped to
    // spec files so production code keeps the rule.
    files: ['test/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },
);
