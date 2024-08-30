import { text, time, ram, powerline, i3state } from "./modules"

export default {
	display_left: [
		powerline("", "", "red", [
			text("Hello PowerLine!"),
			powerline("", "blue", "right"),
			text("Goodbye PowerLine!"),
		])
	],
	display_center: [
		// i3state(async info=>info.state != "default" ? await render([
		// 	powerline("", "", "202", [
		// 		text(info.state)
		// 	])
		// ]) : "")
	],
	display_right: [
		powerline("", "", "blue", [
			ram("RAM {ramUsagePercent} ({used}/{total})")
		]),
		text(" "),

		powerline("", "", "red", [
			time(" {shortMonthName} {dayOfMonth}{dayOfMonthSuffix}, {year}"),
			powerline("", "bright-red", "right"),
			time(" {twelveHour}:{minute}:{second}"),
		]),
	],
}