declare module "gsap/SplitText" {
  interface SplitTextVars {
    type?: string;
    linesClass?: string;
    wordsClass?: string;
    charsClass?: string;
    position?: string;
  }
  
  class SplitText {
    constructor(target: string | Element | null, vars?: SplitTextVars);
    chars: Element[];
    lines: Element[];
    words: Element[];
    revert(): void;
  }
  
  export { SplitText };
}
