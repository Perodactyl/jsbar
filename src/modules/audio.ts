
import { getVolume, getMuted, setVolume, setMuted } from "loudness";
import { ClickEventType } from "../input";
import { RenderModule } from "../module";
import { applyFormat, FormatString } from "../utils";
import { AudioSystemBackend } from "../backend/backend";

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
export default function audio(format: FormatString, actions: AudioActions, backend: AudioSystemBackend): RenderModule
export default function audio(format: FormatString, muteFormat: FormatString, actions: AudioActions, backend: AudioSystemBackend): RenderModule
export default function audio(a: FormatString, b: FormatString|AudioActions, c: AudioActions|AudioSystemBackend, d?: AudioSystemBackend): RenderModule {
	let format = a;
	let actions = b;
	let muteFormat: FormatString;
	let backend = c as AudioSystemBackend;
	
	if(typeof (c as any).name === "undefined") {
		muteFormat = <FormatString>b;
		actions = c as AudioActions;
		backend = d as AudioSystemBackend;
	}
	
	return {
		type: "render",
		async render() {
			let env = {
				volume: await backend.getVolume(),
				mute: await backend.getMuted(),
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
					await backend.setVolume((await backend.getVolume()) + value);
				} else if(op == "-") {
					await backend.setVolume((await backend.getVolume()) - value);
				} else {
					await backend.setVolume(value);
				}
			} else if(action == "mute") {
				await backend.setMuted(true);
			} else if(action == "unmute") {
				await backend.setMuted(false);
			} else if(action == "!mute") {
				await backend.setMuted(!(await backend.getMuted()));
			} else {
				console.error(`audio: Invalid action "${action}"`)
			}
		},
	};
}