import { vislength, display, humanBytes } from "./utils";
import config from "./config";
import style from "./style";

let width = process.stdout.columns;
console.error(`Bar is ${width} characters wide`);

export interface RenderModule {
	type: "render",
	render(): string|Promise<string>,
	alloc?(): number|Promise<number>,
	input?(): unknown, //TODO

	auto_bg?: boolean,
	auto_fg?: boolean,
}
export interface MetaModule {
	type: "meta",
	children(): Module[] | Promise<Module[]>,
}
export type Module = RenderModule | MetaModule;

export type ModuleProvider = (...args: any[]) => Module;

interface RenderEnvironment {
	fg_color: string|null,
	bg_color: string|null,
	[key: string]: any
}

async function render(config: Module[], custom_env?: object) {
	custom_env = custom_env ?? {};
	let env: RenderEnvironment = {
		fg_color: "white",
		bg_color: null,
		...custom_env,
	};
	let result = "";

	if(config.length > 0)for(let segment of config) {
		let out: string;
		if(segment.type == "render") {
			out = await segment.render.apply(env);
			// out = style(out, "reset");
			if(segment.auto_bg != false)out = style(out, `bg:${env.bg_color}`);
			if(segment.auto_fg != false)out = style(out, `fg:${env.fg_color}`);
		} else {
			out = await render(await segment.children.apply(env));
		}
		
		result += out;
	}

	return result;
}

async function status() {
	let left   = await render(config.  display_left ?? []);
	let center = await render(config.display_center ?? []);
	let right  = await render(config. display_right ?? []);
	
	//Position of center and right segments.
	//leftOffset = 0
	let centerOffset = Math.floor(width / 2) - Math.floor(vislength(center) / 2);
	let rightOffset = width - vislength(right) - 1;
	
	let offsetL = centerOffset - vislength(left); //Distance from the end of the left segment to the start of the center.
	let offsetR = rightOffset - offsetL - vislength(left) - vislength(center) + 1; //Distance from the end of the center segment to the start of the right.
	if(offsetR < 0) { //Push the center leftward if needed.
		offsetL += offsetR;
		offsetR = 0;
		if(offsetL < 0) {
			let msg = `Output is too long, by ${-offsetL} characters! (${vislength(left)+vislength(center)+vislength(right)})`;
			console.error(msg);
			offsetL = 0;
			if(msg.length < width) {
				return msg;
			} else {
				return `Too Long!`;
			}
		}
	}
	let final = left + " ".repeat(offsetL) + center + " ".repeat(offsetR) + right;
	return final.replace(/[\n\r]/g, ""); //Do **not** allow newlines.
}

//This rivals "public static void main"
export default async function statusbar() {
	//Hides the terminal caret and enables mouse input.
	process.stdout.write("\x1B[?25l\x1B[?1000h");
	// display(await status());
	display("");
	return setInterval(async ()=>{
		display(await status());
		// handleEvents();
	}, 250);
}