import type { AiFixResult, AppProject, CodeIssue, EditorTab } from "../types";

const JAVA_KEYWORDS = new Set([
  "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
  "class", "const", "continue", "default", "do", "double", "else", "enum",
  "extends", "final", "finally", "float", "for", "goto", "if", "implements",
  "import", "instanceof", "int", "interface", "long", "native", "new",
  "package", "private", "protected", "public", "return", "short", "static",
  "strictfp", "super", "switch", "synchronized", "this", "throw", "throws",
  "transient", "try", "void", "volatile", "while",
]);

export function validatePackageName(pkg: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = pkg.trim();
  if (!trimmed) {
    return { valid: false, error: "Package name is required (e.g. com.example.myapp)." };
  }
  const regex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
  if (!regex.test(trimmed)) {
    return {
      valid: false,
      error:
        "Invalid Android package format. Must have at least two lowercase dot-separated segments starting with a letter (e.g. com.example.myapp).",
    };
  }
  const segments = trimmed.split(".");
  for (const seg of segments) {
    if (JAVA_KEYWORDS.has(seg)) {
      return {
        valid: false,
        error: `Segment "${seg}" is a reserved Java keyword and cannot be used in an Android package name.`,
      };
    }
  }
  return { valid: true };
}

export function validateExternalUrl(rawUrl: string): {
  valid: boolean;
  isHttpWarning: boolean;
  error?: string;
} {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, isHttpWarning: false, error: "URL cannot be empty." };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return {
        valid: false,
        isHttpWarning: false,
        error: "Only HTTP and HTTPS URLs are allowed.",
      };
    }
    return {
      valid: true,
      isHttpWarning: parsed.protocol === "http:",
    };
  } catch {
    return {
      valid: false,
      isHttpWarning: false,
      error: "Invalid URL format. Include https:// (e.g. https://example.com).",
    };
  }
}

export function parseGoogleDriveVideoUrl(url: string): {
  isSharePage: boolean;
  suggestedDirectUrl?: string;
} {
  const trimmed = url.trim();
  const match = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return {
      isSharePage: true,
      suggestedDirectUrl: `https://drive.google.com/uc?export=download&id=${match[1]}`,
    };
  }
  return { isSharePage: false };
}

export function sanitizeFilename(name: string): string {
  return (
    name
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "appforge_file"
  );
}

export function runStaticCodeCheck(project: AppProject): CodeIssue[] {
  const issues: CodeIssue[] = [];
  const add = (
    severity: CodeIssue["severity"],
    file: EditorTab,
    fileName: string,
    line: number,
    message: string,
    codeText: string
  ) => {
    const lines = codeText.split("\n");
    const snippet = lines[Math.max(0, line - 1)]?.trim() || "";
    issues.push({
      id: `${file}_${line}_${issues.length}`,
      severity,
      file,
      fileName,
      line: Math.max(1, line),
      message,
      snippet,
    });
  };

  // 1. HTML Checks
  const html = project.code.html;
  const htmlLines = html.split("\n");
  const voidTags = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
  ]);
  const stack: Array<{ tag: string; line: number }> = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g;

  htmlLines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    let m: RegExpExecArray | null;
    tagRegex.lastIndex = 0;
    while ((m = tagRegex.exec(lineText)) !== null) {
      const full = m[0];
      const tag = m[1].toLowerCase();
      if (full.startsWith("<!") || voidTags.has(tag) || full.endsWith("/>")) {
        continue;
      }
      if (full.startsWith("</")) {
        const top = stack[stack.length - 1];
        if (!top) {
          add("ERROR", "html", "index.html", lineNum, `Unexpected closing tag </${tag}>`, html);
        } else if (top.tag !== tag) {
          add(
            "ERROR",
            "html",
            "index.html",
            lineNum,
            `Mismatched closing tag </${tag}> (expected </${top.tag}> opened on line ${top.line})`,
            html
          );
          stack.pop();
        } else {
          stack.pop();
        }
      } else {
        stack.push({ tag, line: lineNum });
      }
    }

    // Check missing files in src="..." or href="..."
    const refRegex = /(?:src|href)=["']([^"']+)["']/gi;
    let rm: RegExpExecArray | null;
    while ((rm = refRegex.exec(lineText)) !== null) {
      const target = rm[1].trim();
      if (
        !target ||
        target.startsWith("http://") ||
        target.startsWith("https://") ||
        target.startsWith("data:") ||
        target.startsWith("#") ||
        target.startsWith("mailto:") ||
        target.startsWith("tel:") ||
        target.startsWith("javascript:")
      ) {
        if (target.startsWith("http://")) {
          add(
            "WARNING",
            "html",
            "index.html",
            lineNum,
            `Insecure HTTP link "${target}". Prefer HTTPS for Android WebView compatibility.`,
            html
          );
        }
        continue;
      }
      const cleanRef = target.replace(/^\.\//, "");
      const knownBuiltins = new Set(["style.css", "script.js", "index.html", "manifest.json"]);
      const existsInFiles = project.files.some(
        (f) =>
          f.name === cleanRef ||
          f.path === cleanRef ||
          f.path === `www/${cleanRef}` ||
          f.path === `www/assets/${cleanRef}`
      );
      if (!knownBuiltins.has(cleanRef) && !existsInFiles) {
        add(
          "WARNING",
          "html",
          "index.html",
          lineNum,
          `Referenced file "${target}" was not found in Project Files.`,
          html
        );
      }
    }

    if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(lineText)) {
      add("INFO", "html", "index.html", lineNum, "<img> element is missing an alt attribute.", html);
    }
  });

  for (const unclosed of stack) {
    add(
      "ERROR",
      "html",
      "index.html",
      unclosed.line,
      `Unclosed HTML tag <${unclosed.tag}>`,
      html
    );
  }

  // 2. CSS Checks
  const css = project.code.css;
  let braceDepth = 0;
  let lastOpenLine = 1;
  const cssLines = css.split("\n");
  cssLines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    for (const ch of lineText) {
      if (ch === "{") {
        if (braceDepth === 0) lastOpenLine = lineNum;
        braceDepth++;
      } else if (ch === "}") {
        braceDepth--;
        if (braceDepth < 0) {
          add("ERROR", "css", "style.css", lineNum, "Unexpected closing brace '}' in CSS.", css);
          braceDepth = 0;
        }
      }
    }
  });
  if (braceDepth > 0) {
    add("ERROR", "css", "style.css", lastOpenLine, "Unclosed CSS rule block '{'.", css);
  }

  // 3. JavaScript Syntax Check
  const js = project.code.js;
  if (js.trim()) {
    try {
      // Parse without executing
      new Function(js);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "JavaScript syntax error";
      add("ERROR", "js", "script.js", 1, `JS Syntax Error: ${msg}`, js);
    }
    const jsLines = js.split("\n");
    jsLines.forEach((lineText, idx) => {
      if (/\beval\s*\(/.test(lineText)) {
        add(
          "WARNING",
          "js",
          "script.js",
          idx + 1,
          "Avoid eval() for security and Android WebView CSP compliance.",
          js
        );
      }
    });
  }

  // 4. JSON Validation
  const json = project.code.json;
  if (json.trim()) {
    try {
      JSON.parse(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid JSON";
      add("ERROR", "json", "capacitor.config.json", 1, `JSON Parse Error: ${msg}`, json);
    }
  }

  // 5. Python Basic Check
  const py = project.code.python;
  py.split("\n").forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    if (
      (trimmed.startsWith("def ") ||
        trimmed.startsWith("if ") ||
        trimmed.startsWith("for ") ||
        trimmed.startsWith("while ") ||
        trimmed.startsWith("class ")) &&
      !trimmed.endsWith(":") &&
      !trimmed.includes("#")
    ) {
      add(
        "WARNING",
        "python",
        "app.py",
        idx + 1,
        "Python block statement appears to be missing a trailing colon ':'.",
        py
      );
    }
  });

  // 6. External Links & Package Check
  const pkgCheck = validatePackageName(project.appSettings.packageName);
  if (!pkgCheck.valid) {
    add("ERROR", "json", "capacitor.config.json", 2, pkgCheck.error || "Invalid package name", json);
  }

  return issues;
}

export function localFallbackFixCode(
  code: string,
  fileType: EditorTab,
  issueMessage: string
): AiFixResult {
  let fixed = code;
  const changes: string[] = [];

  if (fileType === "css") {
    const opens = (fixed.match(/\{/g) || []).length;
    const closes = (fixed.match(/\}/g) || []).length;
    if (opens > closes) {
      fixed += "\n" + "}".repeat(opens - closes);
      changes.push(`Appended ${opens - closes} missing closing brace(s) '}'`);
    }
  } else if (fileType === "json") {
    try {
      fixed = JSON.stringify(JSON.parse(fixed), null, 2);
      changes.push("Formatted valid JSON");
    } catch {
      // Remove trailing commas before } or ]
      const cleaned = fixed.replace(/,\s*([}\]])/g, "$1");
      try {
        fixed = JSON.stringify(JSON.parse(cleaned), null, 2);
        changes.push("Removed trailing comma(s) and reformatted JSON");
      } catch {
        fixed = cleaned;
        changes.push("Cleaned common trailing comma syntax");
      }
    }
  } else if (fileType === "html") {
    const unclosedMatch = issueMessage.match(/Unclosed HTML tag <([a-zA-Z0-9-]+)>/);
    if (unclosedMatch) {
      fixed += `\n</${unclosedMatch[1]}>`;
      changes.push(`Closed unclosed <${unclosedMatch[1]}> tag at end of document`);
    }
    if (/missing an alt attribute/i.test(issueMessage)) {
      fixed = fixed.replace(/<img\b(?![^>]*\balt=)([^>]*)>/gi, '<img alt="App image"$1>');
      changes.push('Added descriptive alt="App image" attribute to <img> tag');
    }
    if (/Insecure HTTP link/i.test(issueMessage)) {
      fixed = fixed.replace(/http:\/\//g, "https://");
      changes.push("Upgraded insecure http:// links to https://");
    }
  } else if (fileType === "js") {
    const opens = (fixed.match(/\{/g) || []).length;
    const closes = (fixed.match(/\}/g) || []).length;
    if (opens > closes) {
      fixed += "\n" + "}".repeat(opens - closes);
      changes.push(`Balanced ${opens - closes} unclosed block brace(s)`);
    }
  }

  return {
    explanation:
      changes.length > 0
        ? `Local analyzer applied an automatic structural repair for: ${issueMessage}`
        : `Could not auto-resolve "${issueMessage}" offline. Review syntax around the highlighted line.`,
    fixedCode: fixed,
    whatChanged: changes.join("; ") || "No automated offline structural patch applicable.",
    usedFallback: true,
  };
}
