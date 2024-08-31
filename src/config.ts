import { text, time, ram, powerline, i3state, audio } from "./modules"

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
		powerline("", "", "bright-blue", [
			audio("{volume}%", "󰝟 ", {
				mouseLeft: "!mute",
				scrollDown: "-5",
				scrollUp: "+5",
			}),
		]),
		text(" "),
		powerline("", "", "blue", [
			ram("RAM {ramUsagePercent}", "RAM {used}/{total}"),
		]),
		text(" "),

		powerline("", "", "red", [
			time(" {twelveHour}:{minute}:{second}", " {shortDayOfWeek} {shortMonthName} {dayOfMonth}{dayOfMonthSuffix}, {year}"),
			// powerline("", "bright-red", "right"),
		]),
	],
}