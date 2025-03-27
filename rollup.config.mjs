import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.ts",
  external: [/node_modules/],
  output: [
    {
      file: "dist/bundle.esm.js",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "dist/bundle.cjs.js",
      format: "cjs",
      sourcemap: true,
    },
  ],
  plugins: [resolve(), commonjs(), typescript()],
};
