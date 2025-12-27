import os

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Indices are 0-based, Lines are 1-based.
# Line 8 (<style>) -> index 7
# Line 2391 (</style>) -> index 2390
# Content: 8 to 2390
css_lines = lines[8:2390]

# Line 3338 (<script>) -> index 3337
# Line 3819 (const londonVenues) -> index 3818
# Line 5922 (];) -> index 5921
# Line 8174 (</script>) -> index 8173

# JS Part 1: 3338 to 3818 (Pre-data)
js_part1 = lines[3338:3818]

# Data: 3818 to 5922
data_lines = lines[3818:5922]

# JS Part 2: 5922 to 8173 (Post-data)
js_part2 = lines[5922:8173]

print(f"Extracting {len(css_lines)} lines of CSS")
print(f"Extracting {len(data_lines)} lines of Data")
print(f"Extracting {len(js_part1) + len(js_part2)} lines of App JS")

# Write CSS
with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.writelines(css_lines)

# Write Data
with open('js/data.js', 'w', encoding='utf-8') as f:
    f.writelines(data_lines)

# Write App
with open('js/app.js', 'w', encoding='utf-8') as f:
    f.writelines(js_part1)
    f.write('\n')
    f.writelines(js_part2)

# Reconstruct HTML
new_html_lines = []
new_html_lines.extend(lines[:7]) # Keep up to line 7. Index 7 is <style> (skipped)
new_html_lines.append('    <link rel="stylesheet" href="css/styles.css">\n')
new_html_lines.extend(lines[2391:3337]) # Skip index 2390 (</style>). Take lines after. Skip 3337 start (<script>)
new_html_lines.append('    <script src="js/data.js"></script>\n')
new_html_lines.append('    <script src="js/app.js"></script>\n')
new_html_lines.extend(lines[8174:]) # Skip index 8173 (</script>).

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(new_html_lines)

print("Refactoring complete.")
