import os from "os";
import cp from "child_process";
import sysinfo from "systeminformation";

import { MetaModule, Module, RenderModule } from "./bar";
import style from "./style";
import { humanBytes } from "./utils";

function percent(value) {
	return `${Math.round(value * 100)}%`;
}

/** A string with substitutions made using {key}. */
type FormatString = string | ((info: object) => string|Promise<string>);

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
 * - `hour`: Current numerical hour out of 24. Example: 23
 * - `twelveHour`: Current numerical hour out of 12. Example: 11
 * - `amPm`: Equal to "pm" if it is after noon. Example: pm
 * - `minute`: Current minute. Example: 59
 * - `second`: Current second. Example: 59
 * 
 * No further precision is given since the bar doesn't update very fast.
 * @todo Add Day of Week
*/
export function time(format: FormatString): RenderModule {
	return {
		type: "render",
		render() {
			let d = new Date();
			return applyFormat(format, {
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
				hour: d.getHours(),
				twelveHour: ((d.getHours() - 1) % 12) + 1,
				amPm: d.getHours() >= 12 ? "pm" : "am",
				minute: d.getMinutes().toString().padStart(2,"0"),
				second: d.getSeconds().toString().padStart(2,"0"),
			});
		}
	};
}
/** Outputs a variable from your environment. A use case would be indicating what user is logged in or which virtual TTY is in use. */
export function envvar(name: string): Module {
	return {
		type: "render",
		render() {
			return process.env[name] ?? `(no such envvar: "${name}")`;
		},
	};
}
/** Runs a command and outputs its (trimmed) result. Use case may include collecting information about another process. */
export function command(command: string): Module {
	return {
		type: "render",
		render() {
			let stdout = cp.execSync(command);
			return stdout.toString('utf8').trim();
		}
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
				render() {
					let bg = this.bg_color;
					this.bg_color = b;
					return style(a, `reset fg:${b} bg:${bg}`);
				}
			}
		} else /*if(c == "right")*/ {
			return {
				type: "render",
				auto_bg: false,
				auto_fg: false,
				render() {
					let fg = this.bg_color;
					this.bg_color = b;
					return style(a, `reset fg:${fg} bg:${b}`);
				}
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
		render() {
			this.bg_color = startStyle;
			return style(start, `reset fg:${startStyle}`);
		}
	};
	
	let endModule = <RenderModule>{
		type: "render",
		auto_bg: false,
		auto_fg: false,
		render() {
			let color = this.bg_color;
			this.bg_color = null;
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
 */
export function ram(format: FormatString): RenderModule {
	return {
		type: "render",
		render() {
			let free = os.freemem();
			let total = os.totalmem();
			let used = total - free;
			return applyFormat(format, {
				ramUsagePercent: percent(used / total),
				free: humanBytes(free),
				used: humanBytes(used),
				total: humanBytes(total),
			})
		}
	};
}
/** Experimental. Uses a command to get the current input binding state of i3wm. Provides the format option `state`. */
export function i3state(format: FormatString): RenderModule {
	return {
		type: "render",
		render() {
			let state = cp
				.execSync("i3-msg -t GET_BINDING_STATE | jq .name | tr -d '\"'")
				.toString('utf8').trim();
			return applyFormat(format, {
				state: state
			});
		}
	};
}