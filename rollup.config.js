import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import analyze from 'rollup-plugin-analyzer';
import peerDeps from 'rollup-plugin-peer-deps-external';
import clearDist from 'rollup-plugin-delete';

const buildConfigs = {
  // cjs: {
  //   output: {
  //     file: 'dist/xlsx.cjs.js',
  //     format: 'cjs',
  //   },
  // },
  esm: {
    output: {
      file: 'dist/xlsx.esm.js',
      format: 'es',
    },
  },
  // global: {
  //   output: {
  //     file: 'dist/xlsx.global.js',
  //     format: 'iife',
  //     name: 'XLSX',
  //   },
  // },
};
const distPath = 'dist';

export default Object.entries(buildConfigs).map(([, config]) => {
  return {
    input: 'src/index.ts',
    output: config.output,
    plugins: [
      clearDist({ targets: `${distPath}/*`, runOnce: true }),
      peerDeps(),
      typescript(),
      resolve(),
      commonjs({
        namedExports: {
          'file-saver': ['saveAs'],
        },
      }),
      terser(),
      analyze(),
    ],
  };
});
