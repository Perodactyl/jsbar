import { text, WMState, conditional, renderEnv, group } from "./src/module"

import time from "./src/modules/time";
import powerline from "./src/modules/powerline";
import ram from "./src/modules/ram";
import audio from "./src/modules/audio";
import workspaces from "./src/modules/workspaces";
import x11 from "./src/backend/x11";
import { collapse } from "./src/utils";

export default async () => ({
	display_left: [
		powerline("", "", "21", [
			//This config looks crazy: Arrows point to the right, but they point away from the active workspace if they are next to it.
			workspaces(()=>group([ //Makes the active workspace a different color from the rest.
				conditional([ //IS current
					powerline("", "21", "left"),
					powerline("", "39", "left"),
					renderEnv("{thisWorkspace}"),
					// powerline("", "21", "right"),
				], ({env})=>{
					let e = collapse(env);
					return e["currentWorkspace"] == e["thisWorkspace"];
				}),
				conditional([ //NON current
					powerline("", "21", "right"),
					powerline("", "32", "right"),
					renderEnv("{thisWorkspace}"),
				], ({env})=>{
					let e = collapse(env);
					return e["currentWorkspace"] != e["thisWorkspace"];
				}),
			]), x11),
			text(" "),
		]),
	],
	display_center: [
		conditional([
			WMState("{state}")
		], ({outputs, modules})=>{
			return outputs.filter(o=>!o.includes("default")).length == modules.length;
		})
	],
	display_right: [
		powerline("", "", "bright-blue", [
			audio("{volume}%", "󰝟 ", {
				mouseLeft: "!mute",
				scrollDown: "-5",
				scrollUp: "+5",
			}),
		]),
		text(" "),
		powerline("", "", "blue", [
			ram("RAM {ramUsagePercent}", "RAM {used}/{total}"),
		]),
		text(" "),

		powerline("", "", "red", [
			time(" {twelveHour}:{minute}:{second}", " {shortDayOfWeek} {shortMonthName} {dayOfMonth}{dayOfMonthSuffix}, {year}"),
			// powerline("", "bright-red", "right"),
		]),
	],
});