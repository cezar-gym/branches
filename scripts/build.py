"""يحقن مسارات الشعار (SVG متتبّع بـpotrace) في الصفحات.
أي <path data-em="lime|helm" d="..."> بيتملى من scripts/emblem-paths.json.
الاستخدام:  python scripts/build.py
"""
import json, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
paths = json.loads((root / 'scripts' / 'emblem-paths.json').read_text())
for page in ['index.html', 'member.html']:
    f = root / page
    if not f.exists():
        continue
    s = f.read_text(encoding='utf-8')
    s2 = re.sub(r'(<path[^>]*data-em="(lime|helm)"[^>]*\bd=")[^"]*(")', lambda m: m.group(1) + paths[m.group(2)] + m.group(3), s)
    f.write_text(s2, encoding='utf-8')
    print(page, 'ok', len(s2))
