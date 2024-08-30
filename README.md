# JSBar
KiTTY-based panel for linux.

## Building
JSBar can be run in the following ways:
- njs: Requires `dev-dependencies`. Run `npm run build`. This creates "jsbar.js"
- indev (live): Requires [bun](https://bun.sh). Run `npm start` without building. Run `npm run unbuild` if you have built in the past.

You can run it in a shell using `JSBAR_HOME="(install directory)" (install directory)/bar.sh`.

## Configuration
I recommend that you use a code editor like VSCode to configure this. Edit the file `src/config.ts` to your liking. Have a look at `src/modules.ts` if you need a list of what's available.