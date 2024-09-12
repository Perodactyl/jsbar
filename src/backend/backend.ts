/** Used when there are multiple ways of getting information. Examples include "pulseAudio" or "alsa" and "X11" or "Wayland" */
export interface Backend {
	name: string,
}

export interface WindowingSystemBackend extends Backend {
	/**
	 * This function may or may not be implemented.
	 * @returns List of workspaces, by name. Not sorted.
	 */
	listWorkspaces?: ()=>string[],
	/**
	 * This function may or may not be implemented. Generally if listWorkspaces is implemented this should be too.
	 * @returns Index of the current workspace.
	 */
	getActiveWorkspace?: ()=>number,
	/**
	 * This function may or may not be implemented. Generally if listWorkspaces is implemented this should be too.
	 * @param target Should be a return-value of `listWorkspaces()`.
	 * @returns true on success.
	 */
	setWorkspace?: (target: string)=>boolean,
}