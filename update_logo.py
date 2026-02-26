import os
import glob
import re

base = r'c:\Users\Huawei\OneDrive\Documentos\wayra'
html_files = glob.glob(os.path.join(base, '**', '*.html'), recursive=True)

for f in html_files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()

    # Only revert unicologo.png -> icono.png in favicon/apple-touch-icon lines
    # NOT in img#site-logo tags
    def revert_favicon(match):
        line = match.group(0)
        if 'rel="icon"' in line or 'rel="apple-touch-icon"' in line:
            line = line.replace('assets/img/unicologo.png', 'assets/img/icono.png')
            line = line.replace('../assets/img/unicologo.png', '../assets/img/icono.png')
        return line

    new_content = re.sub(r'<link [^>]+(unicologo|icono)\.png[^>]*>', revert_favicon, content)

    if new_content != content:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(new_content)
        print(f'Revertido favicon: {os.path.basename(f)}')

print('Listo.')
