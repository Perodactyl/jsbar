import { freemem, totalmem } from "node:os";
import { applyFormat, FormatString, humanBytes, percent } from "../utils";
import { RenderModuleTyped } from "../module";

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
export default function ram(format: FormatString, format2: FormatString): RenderModuleTyped<{isState2: boolean}>
export default function ram(format: FormatString): RenderModuleTyped<{isState2: boolean}>
export default function ram(format: FormatString, format2?: FormatString): RenderModuleTyped<{isState2: boolean}> {
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