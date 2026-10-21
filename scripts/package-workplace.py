#!/usr/bin/env python3
"""Package committed Dutch at Work changes against the recorded exact baseline.
Usage: python3 scripts/package-workplace.py /outside/repository/output-directory
The output directory must not exist. It contains the ready-to-zip installer package.
"""
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '1f353b78e6db247011ed383d4544c1d6a5c84761'


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def main():
    destination = Path(sys.argv[1]).resolve()
    if destination == ROOT or ROOT in destination.parents:
        raise ValueError('Output must be outside the repository.')
    if destination.exists():
        raise ValueError('Output already exists; choose a fresh directory.')
    if git('status', '--porcelain', '--untracked-files=no').strip():
        raise ValueError('Commit tracked changes before packaging.')
    names = git('diff', '--name-only', '-z', BASE, 'HEAD').decode().strip('\0').split('\0')
    files = []
    for name in names:
        path = Path(name)
        if any(part in {'.git', '.next', 'node_modules', 'audio', 'test-results', 'playwright-report'} for part in path.parts) or any(part.startswith('.env') for part in path.parts):
            raise ValueError('Excluded data in patch: ' + name)
        source = ROOT / name
        if not source.is_file() or source.is_symlink():
            raise ValueError('Only ordinary changed files supported: ' + name)
        target = destination / 'files' / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        exists = subprocess.run(['git', '-C', str(ROOT), 'cat-file', '-e', BASE + ':' + name], capture_output=True).returncode == 0
        files.append({'path': name, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'added': not exists})
    patch = git('diff', '--binary', '--full-index', BASE, 'HEAD')
    (destination / 'update.patch').write_bytes(patch)
    manifest = {'base': BASE, 'revision': git('rev-parse', 'HEAD').decode().strip(), 'patchSha256': hashlib.sha256(patch).hexdigest(), 'files': files}
    (destination / 'MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n')
    shutil.copy2(ROOT / 'scripts/workplace-install.py', destination / 'install.py')
    shutil.copy2(ROOT / 'docs/workplace/INSTALL.md', destination / 'README.md')
    print(json.dumps({'directory': str(destination), 'files': len(files), 'revision': manifest['revision']}, indent=2))


if __name__ == '__main__':
    main()
