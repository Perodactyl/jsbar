import { WindowingSystemBackend } from "../backend/backend";
import { MetaModule, Module, ModuleProvider, setRenderEnv } from "../module";
import { naturalSort } from "../utils";

/** 
 * ### Experimental
 * Displays a module for each workspace which is present.
 * Provides the following RenderEnvironment properties:
 * - thisWorkspaceName: (`string|undefined`) Workspace name for the currently rendering module. Undefined behavior when not a child of `workspaces`.
 * - thisWorkspaceIndex: (`number|undefined`) Workspace name for the currently rendering module. Undefined behavior when not a child of `workspaces`.
 * - currentWorkspace: (`string`) Name of currently active workspaces.
 * 
 * ### (EXPERIMENTAL)
 * The difference between an ID and an Index is that index is from left-to-right, while ID is based on the ordering the backend provides.
 * State may-or-may not be kept when the length of `currentWorkspaces` changes.
 * Recommended, but not necessarily implented behavior says that state is kept unless a workspace is destroyed (in which case that module is destroyed and its state is lost.)
 */
export default function workspaces(provider: ModuleProvider, backend: WindowingSystemBackend): MetaModule {
	let workspaceModules: [number, string, Module][] = [];
	if(!backend.listWorkspaces)throw new Error(`Workspaces: Backend "${backend.name}" does not provide listWorkspaces functionality.`);
	return {
		type: "meta",
		async children() { //TODO fix ID vs Index.
			if(!backend.listWorkspaces)throw new Error(`Workspaces: Backend "${backend.name}" does not provide listWorkspaces functionality.`);
			let workspaces = await backend.listWorkspaces();

			let output: Module[] = [];

			let currentID: number|null = null;

			if(backend.getActiveWorkspace) {
				let current = await backend.getActiveWorkspace();
				output.push(setRenderEnv("currentWorkspaceName", workspaces[current]));
				output.push(setRenderEnv("currentWorkspaceID", current));
				currentID = current;
			}

			workspaces.sort(naturalSort);

			let outputBlocks: [number,string,Module[]][] = [];
			for(let i = 0; i < workspaces.length; i++) {
				let workspace = workspaces[i];
				let module = workspaceModules.find(([id, name, mod])=>name === workspace);
				if(!module) {
					module = [i, workspace, provider()];
					workspaceModules.push(module);
				}
				outputBlocks.push([i, module[1], [
					setRenderEnv("thisWorkspaceName", workspace),
					setRenderEnv("thisWorkspaceID", module[0]),
					setRenderEnv("thisWorkspaceIndex", i),
					module[2],
				]]);
			}

			
			let sortedOutputBlocks = outputBlocks.sort((a,b)=>naturalSort(a[0], b[0]));
			if(currentID)output.push(setRenderEnv("currentWorkspaceIndex", sortedOutputBlocks.find(b=>b[0] === currentID)));

			return [
				...output,
				...sortedOutputBlocks.map(b=>b[2]).flat(),
			];
		},
	}
}