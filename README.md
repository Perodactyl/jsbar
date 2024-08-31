# JSBar
KiTTY-based statusbar for linux.

## Building
JSBar can be run in the following ways:
- njs: Requires `dev-dependencies`. Run `npm run build`. This creates "jsbar.js"
- indev (live): Requires [bun](https://bun.sh). Run `npm start` without building. Run `npm run unbuild` if you have built in the past.

You can run it in a shell using `JSBAR_HOME="(install directory)" (install directory)/bar.sh`.

## Configuration
I recommend that you use a code editor like VSCode to configure this. Edit the file `src/config.ts` to your liking. Have a look at `src/modules.ts` if you need a list of what's available.

# Help Wanted:
- If you know any other programs that would work well with this, please submit an issue or even a pull request!
- I am currently unaware of how to switch what monitor KiTTY's panel kitten displays on.
- ...and by extension this panel only displays on ONE workspace. Uhm.... this isn't very good as a panel but it was neat coding exercise.