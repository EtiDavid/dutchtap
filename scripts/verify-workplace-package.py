#!/usr/bin/env python3
"""Exercise the real download installer in temporary local clones, never the working checkout.
Usage from the repository: python3 scripts/verify-workplace-package.py /path/to/extracted/package
"""
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = Path(sys.argv[1]).resolve(strict=True)
MANIFEST = json.loads((PACKAGE / 'MANIFEST.json').read_text())


def git(target, *args):
    return subprocess.check_output(['git', '-C', str(target), *args], stderr=subprocess.PIPE)


def install(target, apply=False, expected=0):
    result = subprocess.run([sys.executable, str(PACKAGE / 'install.py'), str(target), *(['--apply'] if apply else [])], capture_output=True, text=True)
    assert result.returncode == expected, result.stdout + result.stderr
    return result.stdout + result.stderr


results = {}
with tempfile.TemporaryDirectory(prefix='dutchtap-installer-') as directory:
    target = Path(directory) / 'matching-base'
    subprocess.run(['git', 'clone', '--shared', '--no-checkout', str(ROOT), str(target)], check=True, capture_output=True)
    git(target, 'checkout', '--detach', MANIFEST['base'])
    sentinel = target / 'local-learner-notes.txt'
    sentinel.write_text('Unrelated local notes must survive.\n')
    assert 'Check only; nothing changed' in install(target)
    assert not git(target, 'diff', '--binary')
    assert all(not (target / f['path']).exists() for f in MANIFEST['files'] if f['added'])
    results['dryRunLeavesFilesUnchanged'] = True
    tracked = target / 'package.json'
    original = tracked.read_bytes()
    tracked.write_bytes(original + b'\n')
    before = git(target, 'diff', '--binary')
    assert 'Tracked changes' in install(target, apply=True, expected=1)
    assert git(target, 'diff', '--binary') == before
    tracked.write_bytes(original)
    results['trackedDirtyRefusedWithoutEdits'] = True
    collision = target / 'data/workplace-cards.json'
    collision.write_text('Untracked user data\n')
    assert 'untracked destination' in install(target, apply=True, expected=1)
    assert collision.read_text() == 'Untracked user data\n'
    assert not git(target, 'diff', '--binary')
    collision.unlink()
    results['untrackedDestinationRefusedWithoutEdits'] = True
    other = Path(directory) / 'unrelated-data'
    other.write_text('Keep this intact\n')
    collision.symlink_to(other)
    assert 'symlink' in install(target, apply=True, expected=1)
    assert other.read_text() == 'Keep this intact\n'
    collision.unlink()
    results['symlinkDestinationRefusedWithoutEdits'] = True
    assert 'Installed and verified' in install(target, apply=True)
    for entry in MANIFEST['files']:
        assert hashlib.sha256((target / entry['path']).read_bytes()).hexdigest() == entry['sha256'], entry['path']
    assert sentinel.read_text() == 'Unrelated local notes must survive.\n'
    assert git(target, 'rev-parse', 'HEAD').decode().strip() == MANIFEST['base']
    results['matchingBasePatchAndAllFileHashes'] = True
    results['unrelatedUntrackedFilePreserved'] = True
    results['noCommitOrHeadChange'] = True
    wrong = Path(directory) / 'different-head'
    wrong.mkdir()
    git(wrong, 'init')
    git(wrong, '-c', 'user.name=Installer Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-m', 'Different baseline fixture')
    assert 'Incompatible HEAD' in install(wrong, apply=True, expected=1)
    assert not git(wrong, 'status', '--porcelain')
    results['differentHeadRefusedWithoutEdits'] = True
print(json.dumps({'base': MANIFEST['base'], 'revision': MANIFEST['revision'], 'changedFiles': len(MANIFEST['files']), 'checks': results}, indent=2))
