let clickEventMap = new Map();
clickEventMap.set(0x20, "mouseLeft");
clickEventMap.set(0x21, "mouseMiddle");
clickEventMap.set(0x22, "mouseRight");
clickEventMap.set(0x23, "mouseUp");
clickEventMap.set(0x60, "scrollUp");
clickEventMap.set(0x61, "scrollDown");

// process.stdin.setRawMode(true);
// process.stdin.on("data", chunk => {
// 	// process.stderr.write("I love refrigerators")
// 	//\x1b [ <FLAG>;<X>;<Y>
// 	// let flag = chunk[2];
// 	process.stderr.write(Array.from(chunk).map(byte=>byte.toString(16)).join(" ")+"\n");
// 	// let flag = chunk[3];
// 	
// 	let col = chunk[4] - 0x21;
// 	let event = clickEventMap.get(chunk[3]);
// 	console.error(`${chunk[3].toString(16)} ${chunk[3]} ${event} @ ${col}`);
// 	pendingEvent = [event, col];
// });