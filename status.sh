#!/bin/bash
if [ -r "$JSBAR_HOME/jsbar.js" ]; then
	echo "Starting JSbar (njs)..." >> "$JSBAR_HOME/status.log"
	echo "If you meant to start the indev version, delete jsbar.js" >> "$JSBAR_HOME/status.log"
	node "$JSBAR_HOME/jsbar.js" status 2>> "$JSBAR_HOME/status.log"
else
	echo "Starting JSbar (bun indev)..." >> "$JSBAR_HOME/status.log"
	bun "$JSBAR_HOME/src/entry.ts" status 2>> "$JSBAR_HOME/status.log"
fi