import { vislength, display } from "./utils";
import config from "./config";
import style from "./style";
import { beginInput, ClickEvent } from "./input";

let width = process.stdout.columns;
console.error(`Bar is ${width} characters wide`);

export interface RenderModuleTyped<T> { //Regular module which outputs something
	type: "render",
	render(this: RenderModuleTyped<T>, env: RenderEnvironment): string|Promise<string>, //Outputs ANSI control characters and text
	alloc?(): number|Promise<number>, //Gets the visual length needed
	input?(this: RenderModuleTyped<T>, event: ClickEvent): void, //TODO - Called when an input is received.

	auto_bg?: boolean, //If not false, the output will automatically be styled in accordance with `env.bg_color`
	auto_fg?: boolean,

	data: T, //Usable inside calls to store state info.
}
export type RenderModule = Omit<RenderModuleTyped<undefined>, "data">;
export interface MetaModule { //Module which outputs a list of children to render
	type: "meta",
	children(): Module[] | Promise<Module[]>,
}

export type Module = RenderModule | RenderModuleTyped<any> | MetaModule;

export type ModuleProvider = (...args: any[]) => Module;

export interface RenderEnvironment {
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
			out = await segment.render.call(segment, env);
			// out = style(out, "reset");
			if(segment.auto_bg != false)out = style(out, `bg:${env.bg_color}`);
			if(segment.auto_fg != false)out = style(out, `fg:${env.fg_color}`);
		} else {
			out = await render(await segment.children.call(segment, env));
		}
		
		result += out;
	}

	return result;
}

interface EventReceiver {
	start: number, //inclusive, 0 indexed
	end: number, //exclusive

	callback(this: Module, event: ClickEvent): void,
	module: Module,
}

async function targets(config: Module[], offset:number, getLength:true): Promise<[EventReceiver[],number]>
async function targets(config: Module[], offset:number, getLength?:false): Promise<EventReceiver[]>
async function targets(config: Module[], offset:number, getLength?: boolean): Promise<EventReceiver[]|[EventReceiver[],number]> {
	let out: EventReceiver[] = [];
	let pos = offset;
	let totalLength = 0;
	let env: RenderEnvironment = {
		fg_color: "white",
		bg_color: null,
		// ...custom_env,
	};
	if(config.length > 0) for(let module of config) {
		if(module.type == "render") {
			let length: number = (await module.alloc?.call(module)) ?? vislength(await module.render.call(module, env));
			totalLength += length;
			if(module.input) {
				out.push({
					start: pos-1,
					end: pos+length-1,
					callback: module.input,
					module
				});
			}
			pos += length;
		} else {
			let [receivers, length] = await targets(await module.children(), pos, true);
			totalLength += length;
			out.push(...receivers);
			pos += length;
		}
	}
	
	if(getLength) {
		return [out, totalLength];
	} else {
		return out;
	}
}

let eventTargets: EventReceiver[] = [];

async function status() {
	let left   = await render(config.  display_left ?? []);
	let center = await render(config.display_center ?? []);
	let right  = await render(config. display_right ?? []);

	//Position of center and right segments.
	//leftOffset = 0
	let centerOffset = Math.floor(width / 2) - Math.floor(vislength(center) / 2);
	let rightOffset = width - vislength(right) + 1;

	eventTargets = [
		...(await targets(config.  display_left ?? [],            0)),
		...(await targets(config.display_center ?? [], centerOffset)),
		...(await targets(config. display_right ?? [],  rightOffset)),
	];
	
	//I **was** earlier doing a stupid by outputting spaces to move the cursor, then immediately using ANSI codes to color and hide the cursor.
	let final = `${left}\x1B[${centerOffset}G${center}\x1B[${rightOffset}G${right}`;
	return final.replace(/[\n\r]/g, ""); //Do **not** allow newlines.
}

export async function handleEvent(event: ClickEvent) {
	if(event == null)return;
	let target: EventReceiver|null = null;
	for(let receiver of eventTargets) {
		if(event.position >= receiver.start && event.position < receiver.end) {
			target = receiver;
			break;
		}
	}
	if(target == null) return; //Event did not land on a module.
	target.callback.call(target.module, event);
	display(await status());
}

//This rivals "public static void main"
export default async function statusbar() {
	//Hides the terminal caret and enables mouse input.
	process.stdout.write("\x1B[?25l\x1B[?1000h");
	// display(await status());
	beginInput(handleEvent);
	display("");
	return setInterval(async ()=>{
		display(await status());
	}, 250);
}