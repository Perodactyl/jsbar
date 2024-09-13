import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

/** @type {import("rollup").RollupOptions} */
export default {
	input: "src/entry.ts",
	output: {
		file: "jsbar.js",
		format: "cjs",
	},
	plugins: [
		typescript({compilerOptions: {target: "ESNext"}}),
		terser(),
	],
	external: [
		/node:.*/,
		"loudness",
	]
}
