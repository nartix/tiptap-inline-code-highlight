declare module 'tiptap-inline-code-highlight' {
    import { Extension } from '@tiptap/core';
    export interface CodeInlineLowlightOptions {
        lowlight: any; 
    }
    export class CodeInlineLowlight extends Extension {
      constructor(options: CodeInlineLowlightOptions);
      static readonly name: string;
    }
    export default CodeInlineLowlight;
  }
  