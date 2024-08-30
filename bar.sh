#!/bin/bash

if [ -z "$JSBAR_HOME" ]; then
	echo "Please set JSBAR_HOME."
	exit
fi

if ! [ -r "$JSBAR_HOME/status.sh" ]; then
	echo "status.sh is missing. Is JSBAR_HOME set correctly?"
	exit
fi

if ! [ -x "$(command -v kitty)" ]; then
	echo "KiTTY could not be found."
	exit
fi

echo "JSBar's debug log is in status.log. Use tail -f to view it live."

kitty +kitten panel -c "$JSBAR_HOME/kittybar/panel.conf" "$JSBAR_HOME/status.sh"
