
import { getVolume, getMuted, setVolume, setMuted } from "loudness";
import { ClickEventType } from "../input";
import { RenderModule } from "../module";
import { applyFormat, FormatString } from "../utils";

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
export default function audio(format: FormatString, actions: AudioActions): RenderModule
export default function audio(format: FormatString, muteFormat: FormatString, actions: AudioActions): RenderModule
export default function audio(a: FormatString, b: FormatString|AudioActions, c?: AudioActions): RenderModule {
	let format = a;
	let actions = b;
	let muteFormat: FormatString;
	
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