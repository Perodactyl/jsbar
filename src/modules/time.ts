import { RenderModuleTyped } from "../module";
import { applyFormat, FormatString } from "../utils";

/**
 * Outputs the date and/or time.
 * 
 * Format values:
 * - `year`: Current year. Example: 2024
 * - `month`: Current month as a number. Example: 7
 * - `monthName`: Current month name. Example: August
 * - `shortMonthName`: Shortened month name. Example: Aug
 * - `dayOfMonth`: Numerical day of the current month. Example: 21
 * - `dayOfMonthSuffix`: **Suffix** to `dayOfMonth`. Example for dayOfMonth=21: "st". Combines to form "21st"
 * - `dayOfWeek`: Current day. Example: Wednesday.
 * - `dayOfWeekNumber`: Number of days since Sunday. Example: 3.
 * - `shortDayOfWeek`: Abbreviated day. Example: Wed.
 * - `hour`: Current numerical hour out of 24. Example: 23
 * - `twelveHour`: Current numerical hour out of 12. Example: 11
 * - `amPm`: Equal to "pm" if it is after noon. Example: pm
 * - `minute`: Current minute. Example: 59
 * - `second`: Current second. Example: 59
 * 
 * No further precision is given since the bar doesn't update very fast.
 * 
 * If `format2` is defined, it will toggle between both formats when clicked.
 * @todo Add Day of Week
*/
export default function time(format1: FormatString, format2: FormatString): RenderModuleTyped<{isState2:boolean}>
export default function time(format1: FormatString): RenderModuleTyped<{isState2:boolean}>
export default function time(format1: FormatString, format2?: FormatString): RenderModuleTyped<{isState2:boolean}> {
	return {
		type: "render",
		render() {
			let d = new Date();
			let twelveHour = ((d.getHours() - 1) % 12) + 1;
			if(twelveHour == 0)twelveHour = 12;
			let env = {
				year: d.getFullYear(),
				month: d.getMonth(),
				monthName: [
					"January", "February",
					"March", "April", "May",
					"June", "July", "August",
					"September", "October",
					"November", "December",
				][d.getMonth()],
				shortMonthName: [
					"Jan", "Feb", "Mar",
					"Apr", "May", "Jun",
					"Jul", "Aug", "Sep",
					"Oct", "Nov", "Dec",
				][d.getMonth()],
				dayOfMonth: d.getDate(),
				dayOfMonthSuffix: (()=>{
					let day = d.getDate();
					if(day >= 10 && day < 20)return "th";
					else switch(day.toString().slice(-1)) {
						case "0": return "th";
						case "1": return "st";
						case "2": return "nd";
						case "3": return "rd";
						default:  return "th";
					}
				})(),
				dayOfWeek: [
					"Monday", "Tuesday",
					"Wednesday", "Thursday",
					"Friday", "Saturday",
					"Sunday",
				][d.getDay()-1],
				dayOfWeekNumber: d.getDay(),
				shortDayOfWeek: [
					"Mon", "Tue", "Wed",
					"Thu", "Fri", "Sat",
					"Sun",
				][d.getDay()-1],
				hour: d.getHours(),
				twelveHour,
				amPm: d.getHours() >= 12 ? "pm" : "am",
				minute: d.getMinutes().toString().padStart(2,"0"),
				second: d.getSeconds().toString().padStart(2,"0"),
			};
			if(format2 && this.data.isState2)
				return applyFormat(format2, env);
			else
				return applyFormat(format1, env);
		},
		input(event) {
			if(event.type == "mouseLeft")
				this.data.isState2 = !this.data.isState2;
		},
		data: {isState2:false},
	};
}