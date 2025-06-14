declare module "@nartix/tiptap-inline-code-highlight" {
	import { Extension } from "@tiptap/core";
	export interface CodeInlineLowlightOptions {
		lowlight: any;
	}
	export class CodeInlineLowlight extends Extension {
		constructor(options: CodeInlineLowlightOptions);
		static readonly name: string;
		static configure(
			options: Partial<CodeInlineLowlightOptions>
		): CodeInlineLowlight;
	}
	export default CodeInlineLowlight;
}
