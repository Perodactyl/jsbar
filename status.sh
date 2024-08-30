#!/bin/bash
echo "Starting jsbar..." >> /home/peter/kittybar/status.log
node /home/peter/kittybar/bar.js status 2>> /home/peter/kittybar/status.log
