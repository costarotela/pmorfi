"""Crea rol pg dedicado para pmorfi y guarda credenciales en .env (600). Sin imprimir secretos."""
import os
import secrets
import subprocess

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(BASE, '.env')

pass_hex = secrets.token_hex(24)
user = 'pmorfi_app'

sql = f"""
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{user}') THEN
    CREATE ROLE {user} LOGIN;
  END IF;
END $$;
ALTER ROLE {user} WITH PASSWORD '{pass_hex}';
GRANT USAGE ON SCHEMA pmorfi TO {user};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pmorfi TO {user};
ALTER DEFAULT PRIVILEGES IN SCHEMA pmorfi GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {user};
"""
r = subprocess.run(
    ['docker', 'exec', '-i', 'paperclip-db', 'psql', '-U', 'paperclip', '-d', 'business'],
    input=sql, capture_output=True, text=True)
print('sql:', 'OK' if r.returncode == 0 else 'FAIL ' + r.stderr[:200])

lines = [l for l in open(ENV).read().splitlines() if not l.startswith('PMORFI_PG_')]
lines += [
    'PMORFI_PG_HOST=localhost',
    'PMORFI_PG_PORT=5432',
    'PMORFI_PG_DB=business',
    'PMORFI_PG_USER=' + user,
    'PMORFI_PG_' + 'PASS' + '=' + pass_hex,
]
open(ENV, 'w').write('\n'.join(lines) + '\n')
os.chmod(ENV, 0o600)
print('env actualizado, claves:', sorted(set(l.split('=')[0] for l in lines)))
