import { getCmd } from "../utils";
import { WindowingSystemBackend } from "./backend";

interface CardinalXProperty { type: "integer", value: number|number[] };
interface StringXProperty   { type: "string",  value: string|string[] };
interface WindowXProperty   { type: "window", id: string };
type XProperty = CardinalXProperty | StringXProperty | WindowXProperty;

function readXProperty(type: string, name: string, value: string|string[]): XProperty|undefined {
	switch(type) {
		case "CARDINAL":
			return <CardinalXProperty>{
				type: "integer",
				value: Array.isArray(value) ? value.map(n=>parseInt(n)) : parseInt(value)
			}
		case "STRING":
		case "UTF8_STRING":
			return <StringXProperty>{
				type: "string",
				value: Array.isArray(value) ? value.map(v=>v.replace(/^\s*"(.*?)"$\s*/, "$1")) : value.replace(/^"(.*?)"$/, "$1"),
			}
		case "WINDOW":
			if(Array.isArray(value))return undefined;
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

function xprop(target:string="-root"): Map<string, XProperty> {
	let properties = new Map();

	getCmd(`xprop ${target}`).split("\n").forEach((ln: string) =>{
		let nameMatch = ln.match(/^(.+?)\(/);
		let typeMatch = ln.match(/\((.+?)\)/);
		let valueMatch = ln.match(/=\s*(.*)$/);
		
		if(!nameMatch || !typeMatch || !valueMatch || !nameMatch[1] || !typeMatch[1] || !valueMatch[1])return;
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

export default <WindowingSystemBackend> {
	name: "X11",
	listWorkspaces() {
		// console.error(xprop());
		let props = xprop();
		let desktops = props.get("_NET_DESKTOP_NAMES");

		if(!desktops) throw new TypeError("Xproperty _NET_DESKTOP_NAMES is undefined (needed for X11 listWorkspaces)");
		if(desktops.type !== "string") throw new TypeError("Xproperty _NET_DESKTOP_NAMES does not hold string values (needed for X11 listWorkspaces)");
		if(!Array.isArray(desktops.value)) throw new TypeError("Xproperty _NET_DESKTOP_NAMES is not an array (needed for X11 listWorkspaces)");
		
		let output: string[] = [];
		for(let desk of desktops.value) {
			output.push(desk);
		}

		return output;
	},
	getActiveWorkspace() {
		let props = xprop();
		let current = props.get("_NET_CURRENT_DESKTOP");

		if(!current) throw new TypeError("Xproperty _NET_CURRENT_DESKTOP is undefined (needed for X11 getActiveWorkspace)");
		if(current.type !== "integer") throw new TypeError("Xproperty _NET_CURRENT_DESKTOP is not an integer (needed for X11 getActiveWorkspace)");

		return current.value;
	},
	setWorkspace() {
		return false;
	},
}