import { text, time, ram, powerline, WMState, audio, conditional } from "./modules"

export default {
	display_left: [
		powerline("", "", "red", [
			text("Hello PowerLine!"),
			powerline("", "blue", "right"),
			text("Goodbye PowerLine!"),
		])
	],
	display_center: [
		conditional([
			WMState("{state}")
		], ({outputs, modules})=>{
			return outputs.filter(o=>!o.includes("default")).length == modules.length;
		})
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