#!/usr/bin/env python3
"""Resume el contrato público de Skydropx para envíos/recolecciones (campos, sin ejemplos)."""
import json, sys
# Uso: curl -sA Mozilla/5.0 https://app.skydropx.com/es-MX/api-docs.json | python3 ops/skydropx-contrato.py --body --resp
doc = json.load(sys.stdin)
def walk(s, depth=0, name='', out=None, req=()):
    out = out if out is not None else []
    if not isinstance(s, dict): return out
    for alt in ('oneOf', 'anyOf', 'allOf'):
        if alt in s:
            walk(s[alt][0], depth, name, out, req); return out
    t = s.get('type')
    if t == 'object' or 'properties' in s:
        if name: out.append('  ' * depth + name + ('*' if name in req else '') + ':{}')
        r = set(s.get('required', []))
        for k, v in s.get('properties', {}).items(): walk(v, depth + 1, k, out, r)
    elif t == 'array':
        out.append('  ' * depth + name + ('*' if name in req else '') + ':[]')
        walk(s.get('items', {}), depth + 1, '-', out, ())
    else:
        enum = s.get('enum')
        out.append('  ' * depth + name + ('*' if name in req else '') + ':' + str(t) + (' ' + '|'.join(map(str, enum)) if enum else ''))
    return out
for path, ops in doc['paths'].items():
    if not any(w in path for w in ('shipment', 'pickup', 'tracking')) or 'external' in path: continue
    for method, op in ops.items():
        print('##', method.upper(), path, '-', op.get('summary', ''))
        body = op.get('requestBody', {}).get('content', {}).get('application/json', {}).get('schema')
        if body and ('--body' in sys.argv): print('\n'.join(walk(body)))
        if '--resp' in sys.argv:
            for code, r in op.get('responses', {}).items():
                sch = r.get('content', {}).get('application/json', {}).get('schema')
                if sch and code.startswith('2'): print('  resp', code); print('\n'.join(walk(sch, 2)))
