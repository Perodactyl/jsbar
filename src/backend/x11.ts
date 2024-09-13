import { getCmd } from "../utils";
import { WindowingSystemBackend } from "./backend";

interface CardinalXProperty { type: "integer", value: number };
interface StringXProperty   { type: "string",  value: string };
interface WindowXProperty   { type: "window", id: string };
type XProperty = CardinalXProperty | StringXProperty | WindowXProperty;

function readSingleXProperty(type: string, name: string, value: string): XProperty|undefined {
	switch(type) {
		case "CARDINAL":
			return <CardinalXProperty>{
				type: "integer",
				value: parseInt(value),
			}
		case "STRING":
		case "UTF8_STRING":
			return <StringXProperty>{ //TODO commas in strings cause an array to be created and malforms the whole property.
				type: "string",
				value: value.replace(/^"(.*?)"$/, "$1"),
			}
		case "WINDOW":
			let match = value.match(/(0x[0-9a-f]+)$/i);
			if(!match)throw "WINDOW type has no ID.";
			let id = match[1];
			return <WindowXProperty>{
				type: "window",
				id,
			}
		// TODO implement this more.
	}
}

function readXProperty(type: string, name: string, value: string|string[]): XProperty|XProperty[]|undefined {
	if(Array.isArray(value)) {
		let output: XProperty[] = [];
		let consistentType: string|undefined = undefined;
		for(let item of value) {
			let prop = readSingleXProperty(type, name, item.trim());
			if(!prop) continue;
			output.push(prop);
		}
		return output;
	} else return readSingleXProperty(type, name, value);
}

function xprop(target:string="-root"): Map<string, XProperty|XProperty[]> {
	let properties = new Map();

	getCmd(`xprop ${target}`).split("\n").forEach((ln: string) =>{
		let nameMatch = ln.match(/^(.+?)\(/);
		let typeMatch = ln.match(/\((.+?)\)/);
		let valueMatch = ln.match(/[=:]\s*(.*)$/);
		
		if(!nameMatch || !typeMatch || !valueMatch || !nameMatch[1] || !typeMatch[1] || !valueMatch[1]) {
			// console.error(`Malformed XProp: ${ln}\nName: ${nameMatch}\nType: ${typeMatch}\nValue: ${valueMatch}`);
			return;
		};
		let name = nameMatch[1];
		let type = typeMatch[1];

		let isPlural = valueMatch[1].includes(",");
		let value = isPlural ? valueMatch[1].split(",") : valueMatch[1];

		let result = readXProperty(type, name, value);
		if(result)properties.set(name, result);
	});
	// console.error();
	return properties;
}

const windowTitleProperties = [
	"_WM_NAME", "WM_NAME", "_NET_WM_NAME",
	"_NET_WM_ICON_NAME", "_NET_ICON_NAME",
]

export default <WindowingSystemBackend> {
	name: "X11",
	listWorkspaces() {
		// console.error(xprop());
		let props = xprop();
		let desktops = props.get("_NET_DESKTOP_NAMES");

		if(!desktops) throw new TypeError("Xproperty _NET_DESKTOP_NAMES is undefined (needed for X11 listWorkspaces)");
		if(!Array.isArray(desktops)) throw new TypeError("Xproperty _NET_DESKTOP_NAMES is not an array (needed for X11 listWorkspaces)");
		
		let output: string[] = [];
		for(let desk of desktops) {
			if(desk.type !== "string") throw new TypeError("Xproperty _NET_DESKTOP_NAMES does not hold string values (needed for X11 listWorkspaces)");
			output.push(desk.value);
		}

		return output;
	},
	getActiveWorkspace() {
		let props = xprop();
		let current = props.get("_NET_CURRENT_DESKTOP");

		if(!current) throw new TypeError("Xproperty _NET_CURRENT_DESKTOP is undefined (needed for X11 getActiveWorkspace)");
		if(Array.isArray(current)) throw new TypeError("Xproperty _NET_CURRENT_DESKTOP is an array (needed for X11 getActiveWorkspace)");
		if(current.type !== "integer") throw new TypeError("Xproperty _NET_CURRENT_DESKTOP is not an integer (needed for X11 getActiveWorkspace)");

		return current.value;
	},
	setWorkspace() {
		return false;
	},
	getWindowTitle() {
		let root = xprop();
		// console.error(root);
		let active = root.get("_NET_ACTIVE_WINDOW");
		if(!active) {
			let wmName = root.get("_NET_WM_NAME");
			if(wmName && !Array.isArray(wmName) && wmName.type === "string") return wmName.value;
			return "Desktop";
		}
		if(Array.isArray(active)) throw new TypeError("Xproperty _NET_ACTIVE_WINDOW exists but is an array (needed for X11 getWindowTitle)");
		if(active.type !== "window") throw new TypeError("Xproperty _NET_ACTIVE_WINDOW exists but is not a window (needed for X11 getWindowTitle)");

		let windowInfo = xprop(`-id ${active.id}`);
		let status = "ok";
		for(let propName of windowTitleProperties) {
			let title = windowInfo.get(propName);
	
			if(!title) { status = `Window has no Xproperty which could be a name.`; continue; }
			if(Array.isArray(title)) { status = `Window (${active.id})'s name Xproperty is an array.`; continue;}
			if(title.type !== "string") { status = `Window's name Xproperty is of type "${title.type}," not "string."`; continue; }
			
			return title.value;
		}
		return status;
	},
}