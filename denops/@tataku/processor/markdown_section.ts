import type { ProcessorFactory } from "jsr:@omochice/tataku-vim@1.1.0";
import { unified } from "npm:unified@11.0.5";
import remarkParse from "npm:remark-parse@11.0.0";
import { extract } from "jsr:@std/front-matter@1.0.5/any";
import { test } from "jsr:@std/front-matter@1.0.5/test";
import { toTransformStream } from "jsr:@std/streams@1.0.8/to-transform-stream";

const processor: ProcessorFactory = () => {
  return toTransformStream(async function* (src: ReadableStream<string[]>) {
    for await (const chunk of src) {
      const text = chunk.join("");
      yield getSections(text);
    }
  });
};

const parser = unified()
  .use(remarkParse);

function getSections(txt: string) {
  const body = test(txt) ? extract(txt).body : txt;
  const file = parser.parse(body);
  const results: [string, ...string[]] = [""];

  for (const node of file.children) {
    if (node.type === "thematicBreak") {
      results.push("");
      continue;
    }
    const t = body.substring(
      node.position?.start.offset!,
      node.position?.end.offset!,
    );
    results.push(results.pop() + t);
  }
  return results;
}

export default processor;
