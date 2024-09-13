import { MetaModule, Module, RenderEnvironment, RenderModule } from "../module";
import style, { StyleString } from "../style";
import { collapse } from "../utils";

/**
 * Stylizes a set of modules to look like a powerline.
 * @param {string} start Starting character to use. Should be a single powerline or NerdFont glyph.
 * @param {string} end   Final character to use. Should be a single powerline or NerdFont glyph.
 * @param {string} startStyle Color of the first section of this powerline.
 * @param {string} modules List of modules to display on this powerline.
 */
export default function powerline(start:string,end:string,startStyle: StyleString, modules:Module[]): MetaModule;
/**
 * Adds a new section to a powerline. Should be within the `modules` list of a parent `powerline` module.
 * @param {string} char Character used to transition into this section. Should be a single powerline or NerdFont glyph.
 * @param {string} newStyle Color of this section of the powerline.
 * @param {"left" | "right"} alignment Set to "left" if `char` begins with background, having its foreground on the right. Set to "right" if `char` ends has its background on the right side. This should be intuitive: which way does the arrow point?
 */
export default function powerline(char:string,newStyle:StyleString,alignment:"left" | "right"): RenderModule;
export default function powerline(a:string,b:string,c:"left"|"right"|string, modules?:Module[]): Module {
	if(!modules) { //Assume this is a switch to a new style.
		if(c == "left") {
			return {
				type: "render",
				auto_bg: false,
				auto_fg: false,
				render(env: RenderEnvironment) {
					// let bg = collapse(env)["bg_color"];
					let e = env;
					while(!e["isPowerBar"] && e.parent) {
						e = e.parent;
					}
					let bg = e["bg_color"];
					e.bg_color = b;
					env.bg_color = b;
					return style(a, `reset fg:${b} bg:${bg}`);
				},
				alloc() { return a.length; },
			}
		} else /*if(c == "right")*/ {
			return {
				type: "render",
				auto_bg: false,
				auto_fg: false,
				render(env: RenderEnvironment) {
					// let fg = collapse(env)["bg_color"];
					let e = env;
					while(!e["isPowerBar"] && e.parent) {
						e = e.parent;
					}
					let fg = e["bg_color"];
					e.bg_color = b;
					return style(a, `reset fg:${fg} bg:${b}`);
				},
				alloc() { return a.length; },
			}
		}
	}
	
	let start = a;
	let end = b;
	let startStyle = c;

	let startModule = <RenderModule>{
		type: "render",
		auto_bg: false,
		auto_fg: false,
		render(env: RenderEnvironment) {
			env.bg_color = startStyle;
			env.isPowerBar = true;
			return style(start, `reset fg:${startStyle}`);
		}
	};
	
	let endModule = <RenderModule>{
		type: "render",
		auto_bg: false,
		auto_fg: false,
		render(env: RenderEnvironment) {
			let color = env.bg_color;
			env.bg_color = null;
			env.isPowerBar = false;
			return style(end, `reset fg:${color} bg:none`);
		}
	};

	let output = [startModule, ...modules, endModule];
	
	return {
		type: "meta",
		children() {
			return output;
		},
	};
}