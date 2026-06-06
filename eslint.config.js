import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import prettier from 'eslint-config-prettier'
import pluginPrettier from 'eslint-plugin-prettier'

export default defineConfigWithVueTs(
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      // Vue
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'off',
      'vue/block-order': [
        'error',
        {
          order: ['script', 'template', 'style'],
        },
      ],

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',

      // Prettier
      'prettier/prettier': 'error',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['examples/**'],
    rules: {
      'no-console': 'off',
      'vue/no-template-shadow': 'off',
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      'vue/one-component-per-file': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['dist/**', 'dist-example/**', 'node_modules/**', '.changeset/**', 'coverage/**'],
  },
  prettier
)
