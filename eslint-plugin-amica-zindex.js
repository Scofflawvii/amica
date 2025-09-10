// Custom ESLint plugin to enforce semantic Tailwind z-index utilities.
// Replaces raw numeric classes (e.g., z-10, z-20, z-[50]) with semantic tokens (z-base, z-floating, etc.).

const DISALLOWED_REGEX = /\bz-(?:\[(\d+)\]|(\d+))\b/g; // matches z-10 or z-[10]

// Mapping from numeric values to semantic class names
const MAPPING = {
  0: "z-background",
  1: "z-background", // treat 1 same as background (rare)
  2: "z-vrm",
  10: "z-base",
  11: "z-floating", // previously used around webcam; promote to floating
  20: "z-floating",
  30: "z-floating", // legacy elevated controls now floating
  40: "z-overlay",
  50: "z-modal",
  60: "z-modal",
  100: "z-toast",
  1000: "z-max",
};

// Allowlist of semantic classes that are always fine
const ALLOWED = new Set([
  "z-background",
  "z-vrm",
  "z-base",
  "z-floating",
  "z-overlay",
  "z-modal",
  "z-toast",
  "z-max",
]);

export default {
  rules: {
    "no-raw-z-index": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Disallow raw numeric Tailwind z-index utilities in favor of semantic tokens",
        },
        hasSuggestions: true,
        fixable: "code",
        schema: [],
        messages: {
          rawZ: 'Use semantic z-index class instead of raw "{{raw}}" (suggested: {{replacement}}).',
          rawZUnknown:
            'Raw z-index class "{{raw}}" not allowed. Add semantic mapping before use.',
        },
      },
      create(context) {
        function processLiteral(node, rawValue) {
          if (typeof rawValue !== "string") return;
          if (!rawValue.includes("z-")) return;

          let hasIssue = false;
          const replacements = [];
          let newValue = rawValue;
          const seen = new Set();
          rawValue.replace(DISALLOWED_REGEX, (match, bracketNum, plainNum) => {
            const num = Number(bracketNum || plainNum);
            if (ALLOWED.has(match)) return match;
            if (seen.has(match)) return match;
            seen.add(match);
            const replacement = MAPPING[num];
            if (replacement) {
              hasIssue = true;
              replacements.push({ match, replacement });
            } else {
              hasIssue = true;
              replacements.push({ match, replacement: null });
            }
            return match;
          });

          if (!hasIssue) return;

          for (const { match, replacement } of replacements) {
            if (replacement) {
              newValue = newValue.replace(
                new RegExp(`(?<![A-Za-z0-9_-])${match}(?![A-Za-z0-9_-])`, "g"),
                replacement,
              );
            }
          }

          // Report each occurrence separately for clarity
          for (const { match, replacement } of replacements) {
            context.report({
              node,
              messageId: replacement ? "rawZ" : "rawZUnknown",
              data: { raw: match, replacement: replacement || "ADD_MAPPING" },
              fix: replacement
                ? (fixer) =>
                    fixer.replaceText(
                      node,
                      node.raw.startsWith('"')
                        ? `"${newValue}"`
                        : `'${newValue}'`,
                    )
                : null,
            });
          }
        }

        return {
          JSXAttribute(node) {
            if (node.name && node.name.name === "className" && node.value) {
              if (node.value.type === "Literal") {
                processLiteral(node.value, node.value.value);
              } else if (
                node.value.type === "JSXExpressionContainer" &&
                node.value.expression.type === "Literal"
              ) {
                processLiteral(
                  node.value.expression,
                  node.value.expression.value,
                );
              }
            }
          },
        };
      },
    },
  },
};
