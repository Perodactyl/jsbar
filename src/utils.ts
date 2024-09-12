import { execSync } from "node:child_process";

export function display(...args: string[]) {
	//1. Clear entire buffer
	//2. Reset cursor
	process.stdout.write("\x1B[3J\x1B[G" + args.join(" "));
}

function strip(text: string): string {
	let reg = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
	return text.replace(reg, "");
}

export function vislength(text: string): number {
	//https://stackoverflow.com/questions/54369513/how-to-count-the-correct-length-of-a-string-with-emojis-in-javascript
	//See the above stackoverflow for info on why I use [...()].length.
	return [...strip(text)].length;
}

let byteSuffixes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB",];
export function humanBytes(value: number): string {
	let i = 0;
	while(value >= 1024) {
		value = value / 1024;
		i++;
	}
	return `${Math.round(value*100)/100}${byteSuffixes[i]}`;
}

export function execCmd(command: string): void {
	execSync(command);
}

export function getCmd(command: string): string {
	return execSync(command).toString("utf-8").trim();
}

export function percent(value: number) {
	return `${Math.round(value * 100)}%`;
}

/** A string with substitutions made using {key}. */
export type FormatString = string | ((info: {[key:string]:any}) => string|Promise<string>);

/** Takes an object which might have a `parent` key.
 * If it does, collapses properties, prioritizing the last element in the stack over its parents.
 * 
 * Recommended use case is collapsing a RenderEnvironment.
*/
export function collapse(data: object) {
	let out = {};
	let stack = [data];
	let current = data;
	while(true) {

		if(Object.keys(current).includes("parent")) {
			if(current["parent"] === undefined)break;
			current = current["parent"];
			stack.push(current);
		} else {
			break;
		}
	}
	for(let i = stack.length-1; i >= 0; i--) {
		out = {
			...out,
			...stack[i],
		};
	}
	return out;
}

/** Applies substitutions to a Format String. */
export async function applyFormat(text: FormatString, env: object) {
	if(typeof text == "string")
		return text.replace(/{(.*?)}/g, (match,g1)=>env[g1] ?? match);
	else if(typeof text == "function")
		return String(await text(env));
	else
		return `Cannot use type ${typeof text} as a format template.`;
}

export function naturalSort(array: Array<string|number>) {
	array.sort((a,b)=>{
		if(typeof a === "number" && typeof b === "number") {
			return b - a;
		} else {
			return a.toString().localeCompare(b.toString(), undefined, {numeric: true});
		}
	});
}