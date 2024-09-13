import { getVolume, setVolume, getMuted, setMuted } from "loudness";
import { AudioSystemBackend } from "./backend";

export default <AudioSystemBackend> {
	name: "Loudness",
	getVolume() {
		return getVolume();
	},
	async setVolume(vol) {
		await setVolume(vol);
	},
	getMuted() {
		return getMuted();
	},
	async setMuted(state) {
		await setMuted(state);
	},
}