#!/usr/bin/node

const os = require("os");
const cp = require("child_process");
const sysinfo = require("systeminformation");

function display(...args) {
	//1. Clear entire buffer
	//2. Reset cursor
	process.stdout.write("\x1B[3J\x1B[G" + args.join(" "));
}

function strip(text) {
	let reg = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
	return text.replace(reg, "");
}

function vislength(text) {
	return strip(text).length;
}

let fg_map = new Map();
let bg_map = new Map();
let color_std = [
	"black",
	"red",
	"green",
	"yellow",
	"blue",
	"magenta",
	"cyan",
	"white",
];
let color_bright = [
	"bright-black",
	"bright-red",
	"bright-green",
	"bright-yellow",
	"bright-blue",
	"bright-magenta",
	"bright-cyan",
	"bright-white",
];
for(let i = 0; i < color_std.length; i++) {
	fg_map.set(color_std[i], 30 + i);
	bg_map.set(color_std[i], 40 + i);
}
for(let i = 0; i < color_bright.length; i++) {
	fg_map.set(color_bright[i], 90 + i);
	bg_map.set(color_bright[i], 100 + i);
}
fg_map.set("none", 39);
bg_map.set("none", 49);

function style(text, opts) {
	let out = text;
	for(let option of opts.split(" ").reverse()) {
		if(option == "reset") {
			out = `\x1B[0m` + out;
		} else if(option == "bold") {
			out = `\x1B[1m` + out;
		} else if(option == "nobold") {
			out = `\x1B[22m` + out;
		} else if(option.startsWith("fg") || option.startsWith("bg")) {
			let mode = option.slice(0, 2);
			let colorType = option[3].match(/[0-9]/) ? "256" : option[2] == "#" ? "tc" : "std";
			if(option.slice(3) == "null") {
				continue;
			}
			if(colorType == "tc") {
				out = `\x1B[${mode == "fg" ? 38 : 48};2;${Number(option.slice(4,6), 16)};${Number(option.slice(6,8), 16)};${Number(option.slice(8,11), 16)}m` + out;
			} else if(colorType == "256") {
				out = `\x1B[${mode == "fg" ? 38 : 48};5;${Number(option.slice(3))}m` + out;
			} else {
				out = `\x1B[${(mode == "fg" ? fg_map : bg_map).get(option.slice(3))}m` + out;
			}
		}
	}

	return out;
}

function conditional_style(text, opts, checker, opts2) {
	if(checker(text)) {
		return style(text, opts);
	} else if(opts2) {
		return style(text, opts2);
	} else {
		return text;
	}
}

let width = process.stdout.columns;
console.error(`Bar is ${width} characters wide`);
let pendingEvent = null;

function label(text) {
	return [function() {
		return text;
	}, "display"];
}
function fg(color) {
	return [function() {
		this.fg_color = color;
		return "";
	}, "display"];
}

function humanBytes(value) {
	let suffixes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB",];
	let i = 0;
	while(value >= 1024) {
		value = value / 1024;
		i++;
	}
	return `${Math.round(value*100)/100}${suffixes[i]}`;
}

function percent(value) {
	return `${Math.round(value * 100)}%`;
}

async function applyFormat(text, env) {
	if(typeof text == "string")
		return text.replace(/{(.*?)}/g, (match,g1)=>env[g1] ?? match);
	else if(typeof text == "function")
		return String(await text(env));
	else
		return `Cannot use type ${typeof text} as a format template.`;
}

let modules = {
	text: function(msg) {
		return [function() {
			return msg;
		}, "display"]
	},
	reset: function() {
		return [function() {
			return style("", "reset");
		}, "display", "no_bg", "no_fg"]
	},
	reset_env: function() {
		return [function() {
			for(let key in Object.keys(this)) {
				delete this[key];
			}
			return "";
		}, "internal", "no_bg", "no_fg"]
	},
	time: function(format) {
		return [function() {
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
		}, "info"];
	},
	envvar: function(name) {
		return [function() {
			return process.env[name];
		}, "info"];
	},
	command: function(command) {
		return [async function() {
			let stdout = cp.execSync(command);
			return stdout.toString('utf8').trim();
		}, "misc"];
	},
	subbar: function(config) {
		return [function() {
			return config;
		}, "meta"];
	},
	powerline: function(a,b,c, modules) {
		if(!modules) { //Assume this is a switch.
			if(c == "left") {
				return [function() {
					let bg = this.bg_color;
					this.bg_color = b;
					return style(a, `reset fg:${b} bg:${bg}`);
				}, "powerline", "no_fg", "no_bg"]
			} else if(c == "right") {
				return [function() {
					let fg = this.bg_color;
					this.bg_color = b;
					return style(a, `reset fg:${fg} bg:${b}`);
				}, "powerline", "no_fg", "no_bg"]
			}
		}
		
		let start = a;
		let end = b;
		let startStyle = c;

		let startModule = [function() {
			this.bg_color = startStyle;
			return style(start, `reset fg:${startStyle}`);
		}, "no_fg", "no_bg"];
		
		let endModule = [function() {
			let color = this.bg_color;
			this.bg_color = null;
			return style(end, `reset fg:${color} bg:none`);
		}, "no_fg", "no_bg"];

		let output = [startModule, ...modules, endModule];
		
		return [function() {
			return output;
		}, "meta", "powerline"];
	},
	conditional: function(config, checker, config2) {
		return [async function() {
			if(await checker(config)) {
				return config;
			}
			if(config2 && typeof config2 == "function") return config2();
			if(config2) return config2;
			return [];
		}, "meta"]
	},
	ram: function(format) {
		return [function() {
			let free = os.freemem();
			let total = os.totalmem();
			let used = total - free;
			return applyFormat(format, {
				ramUsagePercent: percent(used / total),
				free: humanBytes(free),
				used: humanBytes(used),
				total: humanBytes(total),
			})
		}, "info"];
	},
	cpuUsage: function() {
		return [async function() {
			return (await sysinfo.currentLoad()).avgLoad;
		}, "info"]
	},
	i3state: function(format) {
		return [function() {
			let state = cp
				.execSync("i3-msg -t GET_BINDING_STATE | jq .name | tr -d '\"'")
				.toString('utf8').trim();
			return applyFormat(format, {
				state: state
			});
		}];
	}
};

let display_left = [
	// powerline_left_end("", "red"),
	// label("hi"),
	// new_powerline_segment_right("", "blue"),
	// powerline_right_end(""),
	// modules.conditional(()=>{
	// 	return [
	// 		label("yes state")
	// 		// getState
	// 	];
	// }, async ()=>getState[0]() != "default", [
	// 	label("no state")
	// ]),
	// modules.subbar([
	// 	label("potato")
	// ])
	modules.powerline("", "", "red", [
		label("Hello PowerLine!"),
		modules.powerline("", "blue", "right"),
		label("Goodbye PowerLine!"),
	])
];
let display_center = [
	modules.i3state(async info=>info.state != "default" ? await render([
		modules.powerline("", "", "202", [
			label(info.state)
		])
	]) : "")
];
let display_right = [
	modules.powerline("", "", "blue", [
		modules.ram("RAM {ramUsagePercent} ({used}/{total})")
	]),
	label(" "),

	modules.powerline("", "", "red", [
		modules.time(" {shortMonthName} {dayOfMonth}{dayOfMonthSuffix}, {year}"),
		modules.powerline("", "bright-red", "right"),
		modules.time(" {twelveHour}:{minute}:{second}"),
	]),
];

async function render(config, custom_env) {
	custom_env = custom_env ?? {};
	let env = {
		fg_color: "white",
		bg_color: null,
		...custom_env,
	};
	let result = "";

	if(config.length > 0)for(let segment of config) {
		let fn = segment[0];
		let tags = segment.slice(1);

		let out;
		if(tags.includes("meta")) {
			out = await render(await fn.apply(env), tags.includes("share_env") ? env : undefined);
		} else {
			out = await fn.apply(env);
		}
		
		if(!tags.includes("no_bg")) {
			out = style(out, `bg:${env.bg_color}`);
		}
		if(!tags.includes("no_fg")) {
			out = style(out, `fg:${env.fg_color}`);
		}
		result += out;
	}

	return result;
}

async function status() {
	let left = await render(display_left);
	let center = await render(display_center);
	let right = await render(display_right);
	
	//leftOffset = 0
	let centerOffset = Math.floor(width / 2) - Math.floor(vislength(center) / 2);
	let rightOffset = width - vislength(right) - 1;
	
	let offsetL = centerOffset - vislength(left);
	let offsetR = rightOffset - offsetL - vislength(left) - vislength(center) + 1;
	if(offsetR < 0) {
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
	return final.replace(/[\n\r]/g, "");
}


async function statusbar() {
	//Hides the terminal caret and enables mouse input.
	process.stdout.write("\x1B[?25l\x1B[?1000h");
	display(await status());
	setInterval(async ()=>{
		display(await status());
		// handleEvents();
	}, 250);
}

let clickEventMap = new Map();
clickEventMap.set(0x20, "mouseLeft");
clickEventMap.set(0x21, "mouseMiddle");
clickEventMap.set(0x22, "mouseRight");
clickEventMap.set(0x23, "mouseUp");
clickEventMap.set(0x60, "scrollUp");
clickEventMap.set(0x61, "scrollDown");

// process.stdin.setRawMode(true);
// process.stdin.on("data", chunk => {
// 	// process.stderr.write("I love refrigerators")
// 	//\x1b [ <FLAG>;<X>;<Y>
// 	// let flag = chunk[2];
// 	process.stderr.write(Array.from(chunk).map(byte=>byte.toString(16)).join(" ")+"\n");
// 	// let flag = chunk[3];
// 	
// 	let col = chunk[4] - 0x21;
// 	let event = clickEventMap.get(chunk[3]);
// 	console.error(`${chunk[3].toString(16)} ${chunk[3]} ${event} @ ${col}`);
// 	pendingEvent = [event, col];
// });

;(async ()=>{

	if(process.argv.length < 3) {
		process.stdout.write("Missing argv");
		process.exit(1);
	} else if(process.argv[2] == "status") {
		statusbar();
	} else {
		process.stdout.write(`Unknown argv: ${process.argv.join("\t")}`);
	}
})()
