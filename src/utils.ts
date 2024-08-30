export function display(...args: string[]) {
	//1. Clear entire buffer
	//2. Reset cursor
	process.stdout.write("\x1B[3J\x1B[G" + args.join(" "));
}

function strip(text: string) {
	let reg = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
	return text.replace(reg, "");
}

export function vislength(text) {
	return strip(text).length;
}

let byteSuffixes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB",];
export function humanBytes(value) {
	let i = 0;
	while(value >= 1024) {
		value = value / 1024;
		i++;
	}
	return `${Math.round(value*100)/100}${byteSuffixes[i]}`;
}