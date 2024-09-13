import { Asyncable } from "../utils";

/** Used when there are multiple ways of getting information. Examples include "pulseAudio" or "alsa" and "X11" or "Wayland" */
export interface Backend {
	name: string,
}

export interface WindowingSystemBackend extends Backend {
	/**
	 * This function may or may not be implemented.
	 * @returns List of workspaces, by name. Not sorted.
	 */
	listWorkspaces?: ()=>Asyncable<string[]>,
	/**
	 * This function may or may not be implemented. Generally if listWorkspaces is implemented this should be too.
	 * @returns Index of the current workspace.
	 */
	getActiveWorkspace?: ()=>Asyncable<number>,
	/**
	 * This function may or may not be implemented. Generally if listWorkspaces is implemented this should be too.
	 * @param target Should be a return-value of `listWorkspaces()`.
	 * @returns true on success.
	 */
	setWorkspace?: (target: string)=>Asyncable<boolean>,
	/**
	 * This function may or may not be implemented.
	 * @returns Title text of the currently focused window.
	 */
	getWindowTitle?: ()=>Asyncable<string|undefined>,
}

export interface AudioSystemBackend extends Backend {
	/**
	 * @returns current volume as a numeric percentage.
	*/
	getVolume: ()=>Asyncable<number>,
	/**
	 * Sets the volume as a numeric percentage.
	 */
	setVolume: (vol: number)=>Asyncable<void>,
	/**
	 * Returns true if the audio output is currently muted.
	 */
	getMuted: ()=>Asyncable<boolean>,
	/**
	 * Sets whether or not the audio output is muted.
	 */
	setMuted: (state: boolean)=>Asyncable<void>,
}