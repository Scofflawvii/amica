import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/public/**',
      'src/workers/decoderWorker.min.js',
      'src/workers/**/*.min.js',
      'src/workers/bvh/**',
      '**/generateMeshBVH.worker.js',
      '**/*.worker.js.map',
      'test_*.cjs',
      'test_*.js'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        performance: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Worker: 'readonly',
        self: 'readonly',
        onmessage: 'readonly',
        postMessage: 'readonly',
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly',
        WebGLRenderingContext: 'readonly',
        WebGL2RenderingContext: 'readonly',
        WebAssembly: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        XMLHttpRequest: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        define: 'readonly',
        Audio: 'readonly',
        data: 'readonly',
        Image: 'readonly',
        alert: 'readonly',
        createImageBitmap: 'readonly',
        XRSession: 'readonly',
        XRSessionMode: 'readonly',
        XRRigidTransform: 'readonly',
        XRInputSourceEvent: 'readonly',
        XRFrame: 'readonly'
      }
    },
    plugins: {
      'next': nextPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin
    },
    rules: {
      // Next.js specific rules
      'next/no-img-element': 'off',
      
      // React rules
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js
      'react/prop-types': 'off', // Using TypeScript
      'react-hooks/rules-of-hooks': 'error',
      
  // General rules  
  'no-unused-vars': 'warn',
  // Quiet console usage across the project to avoid noisy production builds
  'no-console': 'off',
      'no-undef': 'error',
      'no-useless-escape': 'error',
      'no-empty': 'error',
      'no-prototype-builtins': 'error'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    // Allow console statements in specific files where they're intentional
    files: [
      'src/utils/debug.ts',
      'src/components/debugPane.tsx',
      'public/debugLogger.js',
      'src/workers/**/*.js'
    ],
    rules: {
      'no-console': 'off'
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin
    },
    rules: {
      // Disable base rule and enable TypeScript rule
      'no-unused-vars': 'off',
      // Be strict during dev, quiet during production build
      '@typescript-eslint/no-unused-vars': process.env.NODE_ENV === 'production'
        ? 'off'
        : ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': process.env.NODE_ENV === 'production' ? 'off' : 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn'
    }
  }
];
