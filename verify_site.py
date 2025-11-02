import os
import re

ROOT = os.path.dirname(__file__)
INDEX = os.path.join(ROOT, 'index.html')

with open(INDEX, 'r', encoding='utf-8') as f:
    content = f.read()

anchors = re.findall(r'href=["\']#([^"\']+)["\']', content)
imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', content)

anchor_results = []
for a in anchors:
    # skip bare '#'
    if not a or a.strip() == '':
        continue
    exists = bool(re.search(r'id=["\']%s["\']' % re.escape(a), content))
    anchor_results.append((f"#{a}", exists))

image_results = []
for src in imgs:
    # normalize path
    path = os.path.join(ROOT, src.replace('/', os.sep))
    exists = os.path.exists(path)
    image_results.append((src, exists))

print('Anchor checks:')
for href, ok in anchor_results:
    print(f'  {href} -> {"OK" if ok else "MISSING"}')

print('\nImage checks:')
for src, ok in image_results:
    print(f'  {src} -> {"FOUND" if ok else "MISSING"}')

bad = any(not ok for (_, ok) in anchor_results) or any(not ok for (_, ok) in image_results)
if bad:
    print('\nVerification: FAIL')
    raise SystemExit(1)
else:
    print('\nVerification: PASS')
