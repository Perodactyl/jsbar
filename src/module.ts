//Common utility modules which are most likely to be handy.

// import { render } from "./bar";
import { applyFormat, collapse, FormatString, getCmd, Asyncable } from "./utils";
import { ClickEvent } from "./input";
import { StyleString } from "./style";
import style from "./style";

export interface RenderModuleTyped<T> { //Regular module which outputs something
	type: "render",
	render(this: RenderModuleTyped<T>, env: RenderEnvironment): string|Promise<string>, //Outputs ANSI control characters and text
	alloc?(): number|Promise<number>, //Gets the visual length needed
	input?(this: RenderModuleTyped<T>, event: ClickEvent): void,

	auto_bg?: boolean, //If not false, the output will automatically be styled in accordance with `env.bg_color`
	auto_fg?: boolean,

	data: T, //Usable inside calls to store state info.
}

export type RenderModule = Omit<RenderModuleTyped<undefined>, "data">;
export interface MetaModule { //Module which outputs a list of children to render
	type: "meta",
	children(this: MetaModule, env: RenderEnvironment): Module[] | Promise<Module[]>,
	input?(this: MetaModule, event: ClickEvent): void,
}

export type Module = RenderModule | RenderModuleTyped<any> | MetaModule;

export type ModuleProvider = (...args: any[]) => Module;

//Making it this way is a bit fishy.
export interface RenderEnvironment {
	fg_color: string|null,
	bg_color: string|null,
	parent?: RenderEnvironment,
	[key: string]: any
}

/** Displays any given text. */
export function text(msg: string): RenderModule {
	return {
		type: "render",
		render() {
			return msg;
		},
		alloc() {
			return msg.length;
		},
	};
}

/** Makes variables from the current environment available in a format string. Loose wrapper for `process.env["key"]`. */
export function envvar(format: FormatString): RenderModule {
	return {
		type: "render",
		render() {
			return applyFormat(format, process.env);
		},
	};
}

/** Makes variables from the render context available in a format string. */
export function renderEnv(format: FormatString): RenderModule {
	return {
		type: "render",
		render(env) {
			return applyFormat(format, collapse(env));
		},
	}
}

/** Internally used module which sets a variable in the render environment. */
export function setRenderEnv(key: string | number, value: any): RenderModule {
	return {
		type: "render",
		render(env) {
			env[key] = value;
			return "";
		}
	}
}

/** Runs a command and outputs its (trimmed) result. Use case may include collecting information about another process. */
export function command(command: string): RenderModule {
	return {
		type: "render",
		render() {
			return getCmd(command);
		},
	};
}

/** Experimental. Uses a command to get the current input binding state of i3wm (or maybe sway?). Provides the format option `state`. */
export function WMState(format: FormatString, provider: "i3-msg" | "swaymsg" | (()=>Asyncable<string>)="i3-msg"): RenderModule {
	return {
		type: "render",
		async render(env) {
			let state: string;
			if(typeof provider === "string")state = getCmd(`${provider} -t GET_BINDING_STATE | jq .name | tr -d '"'`);
			else state = await provider();
			return applyFormat(format, {
				state: state
			});
		}
	};
}

export function group(modules: Module[]): MetaModule {
	return {
		type: "meta",
		children() {
			return modules;
		}
	}
}

export function color(fg: StyleString): RenderModule {
	return {
		type: "render",
		render(env) {
			env["fg_color"] = fg;
			return style("", `fg:${fg}`);
		},
	}
}

/** Only renders its modules if a condition is true. */
export function conditional(modules: Module[], condition: (opts: {modules: Module[], env: RenderEnvironment})=>Asyncable<boolean>): MetaModule {
	return {
		type: "meta",
		async children(env) {
			let results: string[] = [];
			let opts = {
				modules,
				env: env,
			};

			let shouldRender = await condition(opts);
			if(shouldRender) {
				return modules;
			} else {
				return [];
			}
		},
	}
}

/** Checks a callback to determine which selection from the `modules` array to use.
 * @param checker Function which either returns number (index into modules array) or null (do not render).
*/
export function select(modules: Module[][], checker: (opts: {env: RenderEnvironment})=>Asyncable<number|null>): MetaModule {
	return {
		type: "meta",
		async children(env) {
			let opts = {
				env: env,
			};

			let target = await checker(opts);

			if(typeof target === "number") {
				return modules[target];
			} else {
				return [];
			}
		},
	}
}