import { text, WMState, conditional, renderEnv, group, select, color } from "./src/module"

import powerline from "./src/modules/powerline";

import time from "./src/modules/time";
import ram from "./src/modules/ram";
import audio from "./src/modules/audio";

import workspaces from "./src/modules/workspaces";
import window from "./src/modules/window";

import { collapse } from "./src/utils";

import loudness from "./src/backend/loudness";
import x11 from "./src/backend/x11";

export default async () => ({
	display_left: [
		powerline("", "", "21", [
			workspaces(()=>select([
				[ //Left of selected
					powerline("", "32", "left"),
					renderEnv("{thisWorkspaceName}"),
					powerline("", "21", "left"),
				], [ //Selected
					powerline("", "39", "left"),
					renderEnv("{thisWorkspaceName}"),
					powerline("", "21", "right"),
				], [ //Right of selected
					powerline("", "32", "right"),
					renderEnv("{thisWorkspaceName}"),
					powerline("", "21", "right"),
				],
			],
			({env})=>{
				if(typeof env["currentWorkspaceID"] === "number" && typeof env["thisWorkspaceID"] === "number") {
					if(env["thisWorkspaceID"] <  env["currentWorkspaceID"]) return 0;
					if(env["thisWorkspaceID"] == env["currentWorkspaceID"]) return 1;
					if(env["thisWorkspaceID"] >  env["currentWorkspaceID"]) return 2;
				}
				return 2;
			}), x11),
		]),

		text(" "),

		powerline("", "", "22", [
			color("34 bold"),
			window("{title}", x11),
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
			}, loudness),
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

group([
	conditional([ //IS current
		powerline("", "39", "left"),
		renderEnv("{thisWorkspaceName}"),
		// powerline("", "21", "right"),
	], ({env})=>{
		let e = collapse(env);
		return e["currentWorkspace"] == e["thisWorkspace"];
	}),
	conditional([ //NON current
		// powerline("", "21", "right"),
		powerline("", "32", "right"),
		renderEnv("{thisWorkspaceName}"),
	], ({env})=>{
		let e = collapse(env);
		return e["currentWorkspace"] != e["thisWorkspace"];
	}),
])