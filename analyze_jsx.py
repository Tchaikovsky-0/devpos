#!/usr/bin/env python3
import re

def analyze_jsx_structure(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    stack = []  # (line_num, tag_name, indent)
    errors = []

    for i, line in enumerate(lines):
        line_num = i + 1
        # Calculate indent
        indent = len(line) - len(line.lstrip())
        stripped = line.strip()

        # Skip empty lines and comments
        if not stripped or stripped.startswith('//'):
            continue

        # Remove strings to avoid false matches
        # Simplified: just look for JSX tags
        matches = list(re.finditer(r'</?[\w.]+(?:\s[^>]*)?>', stripped))

        for match in matches:
            tag_full = match.group(0)
            tag_name_match = re.search(r'</?([\w.]+)', tag_full)
            if not tag_name_match:
                continue
            tag_name = tag_name_match.group(1)

            is_closing = tag_full.startswith('</')

            if is_closing:
                # Find matching opening tag
                for j in range(len(stack) - 1, -1, -1):
                    if stack[j][1] == tag_name:
                        # Found match
                        opened_line, _, _ = stack[j]
                        # Remove from stack
                        stack.pop(j)
                        print(f"Line {line_num}: </{tag_name}> closes line {opened_line}")
                        break
                else:
                    # No matching opening tag
                    errors.append(f"Line {line_num}: EXTRA </{tag_name}> - no matching opening")
            else:
                # Opening tag (but not self-closing)
                if not tag_full.endswith('/>'):
                    stack.append((line_num, tag_name, indent))
                    print(f"Line {line_num}: <{tag_name}> opens (stack depth: {len(stack)})")

    print("\n=== SUMMARY ===")
    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  {e}")

    if stack:
        print(f"\nUnclosed tags ({len(stack)}):")
        for line_num, tag_name, indent in stack:
            print(f"  Line {line_num}: <{tag_name}> (indent: {indent})")
    else:
        print("\nAll tags properly closed!")

if __name__ == "__main__":
    analyze_jsx_structure("/Volumes/KINGSTON/xunjianbao/frontend/src/routes/Media.tsx")
