import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import { dts } from 'rollup-plugin-dts';

// Common TypeScript plugin options for JS outputs
const tsPluginOptions = {
  tsconfig: './tsconfig.lib.json',
  declaration: false, // Do not emit declarations here, dts plugin will handle it
  declarationMap: false,
};

const plugins = [typescript(tsPluginOptions)];

const external = ['@xmtp/proto', '@xmtp/content-type-primitives'];

export default defineConfig([
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [typescript(tsPluginOptions)], // Use specific options
    external,
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/browser/index.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [typescript(tsPluginOptions), terser()], // Use specific options
    external,
  },
  {
    input: 'src/index.ts', // dts plugin takes src input
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts({ tsconfig: './tsconfig.lib.json', respectExternal: false })], // dts plugin handles declarations
  },
]);
