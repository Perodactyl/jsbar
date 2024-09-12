import { WindowingSystemBackend } from "../backend/backend";
import { MetaModule, Module, ModuleProvider, setRenderEnv } from "../module";
import { naturalSort } from "../utils";

/** 
 * ### Experimental
 * Displays a module for each workspace which is present.
 * Provides the following RenderEnvironment properties:
 * - thisWorkspace: (`string|undefined`) Workspace name for the currently rendering module. Undefined behavior when not a child of `workspaces`.
 * - currentWorkspace: (`string`) Name of currently active workspaces.
 * 
 * State may-or-may not be kept when the length of `currentWorkspaces` changes.
 * Recommended, but not necessarily implented behavior says that state is kept unless a workspace is destroyed (in which case that module is destroyed and its state is lost.)
 */
export default function workspaces(provider: ModuleProvider, backend: WindowingSystemBackend): MetaModule {
	let workspaceModules: [string, Module][] = [];
	if(!backend.listWorkspaces)throw new Error(`Workspaces: Backend "${backend.name}" does not provide listWorkspaces functionality.`);
	return {
		type: "meta",
		children() {
			if(!backend.listWorkspaces)throw new Error(`Workspaces: Backend "${backend.name}" does not provide listWorkspaces functionality.`);
			let workspaces = backend.listWorkspaces();

			let output: Module[] = [];

			if(backend.getActiveWorkspace) {
				let current = backend.getActiveWorkspace();
				output.push(setRenderEnv("currentWorkspace", workspaces[current]));
			}
			naturalSort(workspaces);

			for(let workspace of workspaces) {
				let module = workspaceModules.find(([name, mod])=>name === workspace);
				if(!module) {
					module = [workspace, provider()];
					workspaceModules.push(module);
				}
				output.push(setRenderEnv("thisWorkspace", workspace));
				output.push(module[1]);
			}

			return output;
		},
	}
}