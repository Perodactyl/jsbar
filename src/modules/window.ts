import { WindowingSystemBackend } from "../backend/backend";
import { RenderModule } from "../module";
import { applyFormat, FormatString } from "../utils";

export default function window(format: FormatString, backend: WindowingSystemBackend): RenderModule {
	return {
		type: "render",
		async render() {
			return applyFormat(format, {
				title: backend.getWindowTitle ? await backend.getWindowTitle() : undefined,
			});
		}
	}
}