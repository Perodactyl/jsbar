import { WindowingSystemBackend } from "../backend/backend";
import { RenderModule } from "../module";
import { applyFormat, FormatString } from "../utils";

export default function window(format: FormatString, backend: WindowingSystemBackend): RenderModule {
	return {
		type: "render",
		render() {
			return applyFormat(format, {
				title: backend.getWindowTitle ? backend.getWindowTitle() : undefined,
			});
		}
	}
}