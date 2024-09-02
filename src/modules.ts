import { freemem, totalmem } from "node:os";
import * as sysinfo from "systeminformation";
import { getVolume, setVolume, getMuted, setMuted } from "loudness";

import { MetaModule, Module, render, RenderEnvironment, RenderModule, RenderModuleTyped } from "./bar";
import style from "./style";
import { getCmd, humanBytes } from "./utils";
import { ClickEventType } from "./input";

function percent(value) {
	return `${Math.round(value * 100)}%`;
}

/** A string with substitutions made using {key}. */
type FormatString = string | ((info: {[key:string]:any}) => string|Promise<string>);

/** Applies substitutions to a Format String. */
async function applyFormat(text: FormatString, env: object) {
	if(typeof text == "string")
		return text.replace(/{(.*?)}/g, (match,g1)=>env[g1] ?? match);
	else if(typeof text == "function")
		return String(await text(env));
	else
		return `Cannot use type ${typeof text} as a format template.`;
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

/**
 * Outputs the date and/or time.
 * 
 * Format values:
 * - `year`: Current year. Example: 2024
 * - `month`: Current month as a number. Example: 7
 * - `monthName`: Current month name. Example: August
 * - `shortMonthName`: Shortened month name. Example: Aug
 * - `dayOfMonth`: Numerical day of the current month. Example: 21
 * - `dayOfMonthSuffix`: **Suffix** to `dayOfMonth`. Example for dayOfMonth=21: "st". Combines to form "21st"
 * - `dayOfWeek`: Current day. Example: Wednesday.
 * - `dayOfWeekNumber`: Number of days since Sunday. Example: 3.
 * - `shortDayOfWeek`: Abbreviated day. Example: Wed.
 * - `hour`: Current numerical hour out of 24. Example: 23
 * - `twelveHour`: Current numerical hour out of 12. Example: 11
 * - `amPm`: Equal to "pm" if it is after noon. Example: pm
 * - `minute`: Current minute. Example: 59
 * - `second`: Current second. Example: 59
 * 
 * No further precision is given since the bar doesn't update very fast.
 * 
 * If `format2` is defined, it will toggle between both formats when clicked.
 * @todo Add Day of Week
*/
export function time(format1: FormatString, format2: FormatString): RenderModuleTyped<{isState2:boolean}>
export function time(format1: FormatString): RenderModuleTyped<{isState2:boolean}>
export function time(format1: FormatString, format2?: FormatString): RenderModuleTyped<{isState2:boolean}> {
	return {
		type: "render",
		render() {
			let d = new Date();
			let twelveHour = ((d.getHours() - 1) % 12) + 1;
			if(twelveHour == 0)twelveHour = 12;
			let env = {
				year: d.getFullYear(),
				month: d.getMonth(),
				monthName: [
					"January", "February",
					"March", "April", "May",
					"June", "July", "August",
					"September", "October",
					"November", "December",
				][d.getMonth()],
				shortMonthName: [
					"Jan", "Feb", "Mar",
					"Apr", "May", "Jun",
					"Jul", "Aug", "Sep",
					"Oct", "Nov", "Dec",
				][d.getMonth()],
				dayOfMonth: d.getDate(),
				dayOfMonthSuffix: (()=>{
					let day = d.getDate();
					if(day >= 10 && day < 20)return "th";
					else switch(day.toString().slice(-1)) {
						case "0": return "th";
						case "1": return "st";
						case "2": return "nd";
						case "3": return "rd";
						default:  return "th";
					}
				})(),
				dayOfWeek: [
					"Monday", "Tuesday",
					"Wednesday", "Thursday",
					"Friday", "Saturday",
					"Sunday",
				][d.getDay()-1],
				dayOfWeekNumber: d.getDay(),
				shortDayOfWeek: [
					"Mon", "Tue", "Wed",
					"Thu", "Fri", "Sat",
					"Sun",
				][d.getDay()-1],
				hour: d.getHours(),
				twelveHour,
				amPm: d.getHours() >= 12 ? "pm" : "am",
				minute: d.getMinutes().toString().padStart(2,"0"),
				second: d.getSeconds().toString().padStart(2,"0"),
			};
			if(format2 && this.data.isState2)
				return applyFormat(format2, env);
			else
				return applyFormat(format1, env);
		},
		input(event) {
			if(event.type == "mouseLeft")
				this.data.isState2 = !this.data.isState2;
		},
		data: {isState2:false},
	};
}
/** Outputs a variable from your environment. A use case would be indicating what user is logged in or which virtual TTY is in use. */
export function envvar(name: string): RenderModule {
	return {
		type: "render",
		render() {
			return process.env[name] ?? `(no such envvar: "${name}")`;
		},
	};
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
/**
 * Stylizes a set of modules to look like a powerline.
 * @param {string} start Starting character to use. Should be a single powerline or NerdFont glyph.
 * @param {string} end   Final character to use. Should be a single powerline or NerdFont glyph.
 * @param {string} startStyle Color of the first section of this powerline.
 * @param {string} modules List of modules to display on this powerline.
 */
export function powerline(start:string,end:string,startStyle:string, modules:Module[]): MetaModule;
/**
 * Adds a new section to a powerline. Should be within the `modules` list of a parent `powerline` module.
 * @param {string} char Character used to transition into this section. Should be a single powerline or NerdFont glyph.
 * @param {string} newStyle Color of this section of the powerline.
 * @param {"left" | "right"} alignment Set to "left" if `char` begins with background, having its foreground on the right. Set to "right" if `char` ends has its background on the right side. This should be intuitive: which way does the arrow point?
 */
export function powerline(char:string,newStyle:string,alignment:"left" | "right"): RenderModule;
export function powerline(a:string,b:string,c:"left"|"right"|string, modules?:Module[]): Module {
	if(!modules) { //Assume this is a switch.
		if(c == "left") {
			return {
				type: "render",
				auto_bg: false,
				auto_fg: false,
				render(env: RenderEnvironment) {
					let bg = env.bg_color;
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
					let fg = env.bg_color;
					env.bg_color = b;
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

/**
 * Outputs info about RAM usage.
 * 
 * Format values:
 * - `ramUsagePercent`: Current RAM usage, as a string with a percent sign.
 * - `free`: Current size free, in human-readable format.
 * - `used`: Current amount used, in human-readable format.
 * - `total`: Total amount of installed RAM, in human-readable format.
 * 
 * If `format2` is defined, it will toggle between both formats when clicked.
 */
export function ram(format: FormatString, format2: FormatString): RenderModuleTyped<{isState2: boolean}>
export function ram(format: FormatString): RenderModuleTyped<{isState2: boolean}>
export function ram(format: FormatString, format2?: FormatString): RenderModuleTyped<{isState2: boolean}> {
	return {
		type: "render",
		render() {
			let free = freemem();
			let total = totalmem();
			let used = total - free;

			let env = {
				ramUsagePercent: percent(used / total),
				free: humanBytes(free),
				used: humanBytes(used),
				total: humanBytes(total),
			};

			if(this.data.isState2 && format2) 
				return applyFormat(format2, env);
			else
				return applyFormat(format, env);
		},
		input(event) {
			if(event.type == "mouseLeft")
				this.data.isState2 = !this.data.isState2;
		},
		data: {isState2: false},
	};
}

type AudioAction = `+${number}` | `-${number}` | `=${number}` | "mute" | "unmute" | "!mute";
type AudioActions = {
	[key in ClickEventType]?: AudioAction;
};

/**
 * Outputs volume and mute state.
 * 
 * Format values:
 * - `mute`: (boolean) True if the output is muted.
 * - `volume`: (number) Volume as a percent (without the percent sign).
 * 
 * @param actions Maps mouse events to an action:
 * - `!mute` toggles mute.
 * - `mute` enables mute.
 * - `unmute` disables mute.
 * - `+num` increases volume by num.
 * ` `-num` decreases volume by num.
 * ` `=num` sets the volume to a specific value.
 * 
 * Seems like the volume maxes at 100%.
 * 
 * This module uses the NPM package "loudness" which internally uses ALSA on linux.
 */
export function audio(format: FormatString, actions: AudioActions): RenderModule
export function audio(format: FormatString, muteFormat: FormatString, actions: AudioActions): RenderModule
export function audio(a: FormatString, b: FormatString|AudioActions, c?: AudioActions): RenderModule {
	let format = a;
	let actions = b;
	let muteFormat;;
	
	if(c) {
		muteFormat = <FormatString>b;
		actions = c;
	}
	
	return {
		type: "render",
		async render() {
			let env = {
				volume: await getVolume(),
				mute: await getMuted(),
			}
			
			if(muteFormat && env.mute)
				return await applyFormat(muteFormat, env);
			else
				return await applyFormat(format, env);
		},
		
		async input(event) {
			let action = actions[event.type];
			if(!action)return;
			let match: RegExpMatchArray|null|undefined;
			if(match = action?.match(/([-+=])(\d+)/)) {
				let op = match[1];
				let value = Number(match[2]);
				console.error(`audio: ${value}`);
				if(op == "+") {
					await setVolume((await getVolume()) + value);
				} else if(op == "-") {
					await setVolume((await getVolume()) - value);
				} else {
					await setVolume(value);
				}
			} else if(action == "mute") {
				await setMuted(true);
			} else if(action == "unmute") {
				await setMuted(false);
			} else if(action == "!mute") {
				await setMuted(!(await getMuted()));
			} else {
				console.error(`audio: Invalid action "${action}"`)
			}
		},
	};
}

/** Experimental. Uses a command to get the current input binding state of i3wm (or maybe sway?). Provides the format option `state`. */
export function WMState(format: FormatString, provider: "i3-msg" | "swaymsg" | (()=>string|Promise<string>)="i3-msg"): RenderModule {
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

/** Experimental. Only renders its modules if a condition is true. Unoptimized since it re-renders its whole subtree. */
export function conditional(modules: Module[], condition: (opts: {modules: Module[], outputs: string[]})=>boolean|Promise<boolean>): MetaModule {
	return {
		type: "meta",
		async children() {
			let results: string[] = [];
			for(let module of modules) {
				results.push(await render([module]));
			}
			let opts = {
				modules,
				outputs: results,
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

/** Experimental. Displays a certain module for each X workspace. Requires xprop. */
// export function XWorkspaces(): MetaModule {
// 	return {
// 		children() {
// 			let 
// 			return [

// 			]
// 		},
// 	}
// }