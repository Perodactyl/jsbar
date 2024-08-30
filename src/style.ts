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

export default function style(text: string, opts: string) {
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
				out = `\x1B[${mode == "fg" ? 38 : 48};2;${parseInt(option.slice(4,6), 16)};${parseInt(option.slice(6,8), 16)};${parseInt(option.slice(8,11), 16)}m` + out;
			} else if(colorType == "256") {
				out = `\x1B[${mode == "fg" ? 38 : 48};5;${parseInt(option.slice(3))}m` + out;
			} else {
				out = `\x1B[${(mode == "fg" ? fg_map : bg_map).get(option.slice(3))}m` + out;
			}
		}
	}

	return out;
}