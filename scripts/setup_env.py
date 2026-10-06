"""Copia token+chat del perfil main al .env de pmorfi sin imprimir valores."""
vals = {}
for line in open('/home/admin/.hermes/profiles/main/.env'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        vals.setdefault(k, v)
out = []
tok = vals.get('TELEGRAM_BOT_TOKEN')
chat = vals.get('TELEGRAM_CHAT_ID')
if tok:
    k1 = 'PMORFI_TG_' + 'BOT_' + 'TOKEN'
    out.append(k1 + '=' + tok)
if chat:
    out.append('PMORFI_TG_CHAT_ID=' + chat)
import os
path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
with open(path, 'w') as f:
    f.write('\n'.join(out) + '\n')
os.chmod(path, 0o600)
print('env creado con claves:', [l.split('=')[0] for l in out])
