let handleEvent; //Lazily settings this using an argument solves a circular dependency.

type ClickEventType = "mouseLeft" | "mouseMiddle" | "mouseRight" | "mouseUp" | "scrollUp" | "scrollDown";
export interface ClickEvent {
	type: ClickEventType,
	position: number,
}

let clickEventMap: Map<number, ClickEventType> = new Map();
	clickEventMap.set(0x20, "mouseLeft"); //standard
	clickEventMap.set(0x21, "mouseMiddle");
	clickEventMap.set(0x22, "mouseRight");
	clickEventMap.set(0x23, "mouseUp");

	clickEventMap.set(0x30, "mouseLeft"); //ctrl
	clickEventMap.set(0x31, "mouseMiddle");
	clickEventMap.set(0x32, "mouseRight");
	clickEventMap.set(0x33, "mouseUp");

	clickEventMap.set(0x28, "mouseLeft"); //alt
	clickEventMap.set(0x29, "mouseMiddle");
	clickEventMap.set(0x2a, "mouseRight");
	clickEventMap.set(0x2b, "mouseUp");

	clickEventMap.set(0x60, "scrollUp");
	clickEventMap.set(0x61, "scrollDown");

export function beginInput(eventHandler: (event:ClickEvent)=>void) {
	handleEvent = eventHandler;
	process.stdin.setRawMode(true);
	process.stdin.on("data", chunk => {
		// process.stderr.write("I love refrigerators")
		//\x1b [ <FLAG>;<X>;<Y>
		// let flag = chunk[2];
		// let flag = chunk[3];
		
		let col = chunk[4] - 0x21;
		let event = clickEventMap.get(chunk[3]);
		if(!event) {
			console.error(`Unknown event type ($${chunk[3].toString(16)} #${chunk[3]}).`);
			process.stderr.write(Array.from(chunk).map(byte=>byte.toString(16)).join(" ")+"\n");
			return;
		}
		// console.error(`$${chunk[3].toString(16)} #${chunk[3]} | ${event} @ ${col}`);
		handleEvent({
			position: col,
			type: event,
		});
	});
}