#!/bin/bash
if [ -r "$JSBAR_HOME/jsbar.js" ]; then
	if ! [ -x "$(command -v node)" ]; then
		if ! [ -x "$(command -v bun)" ]; then
			echo "Starting JSbar (bun live)..." >> "$JSBAR_HOME/status.log"
			echo "If you meant to start the indev version, delete jsbar.js" >> "$JSBAR_HOME/status.log"
			bun "$JSBAR_HOME/jsbar.js" status 2>> "$JSBAR_HOME/status.log"
		else
			echo "Attempting to run JSBar with nodejs, but node is missing." >> "$JSBAR_HOME/status.log"
			exit
		fi
	fi
	echo "Starting JSbar (njs)..." >> "$JSBAR_HOME/status.log"
	echo "If you meant to start the indev version, delete jsbar.js" >> "$JSBAR_HOME/status.log"
	node "$JSBAR_HOME/jsbar.js" status 2>> "$JSBAR_HOME/status.log"
else
	if ! [ -x "$(command -v bun)" ]; then
		echo "Attempting to run JSBar with bun, but bun is missing." >> "$JSBAR_HOME/status.log"
		exit
	fi
	echo "Starting JSbar (bun indev)..." >> "$JSBAR_HOME/status.log"
	bun "$JSBAR_HOME/src/entry.ts" status 2>> "$JSBAR_HOME/status.log"
fi
