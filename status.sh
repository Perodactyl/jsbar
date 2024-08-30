#!/bin/bash
echo "Starting jsbar..." >> /home/peter/kittybar/status.log
bun /home/peter/kittybar/src/entry.ts status 2>> /home/peter/kittybar/status.log
