#!/usr/bin/env python3
"""Safe installer copied next to update.patch and MANIFEST.json in the download.
Default: compatibility check only. --apply: apply one atomic Git patch after every check.
Never resets, stashes, commits, installs dependencies, pushes or changes unrelated files.
"""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(target, *args):
    result = subprocess.run(['git', '-C', str(target), *args], capture_output=True, text=True)
    if result.returncode:
        raise ValueError(result.stderr.strip() or 'Git check failed: ' + ' '.join(args))
    return result.stdout.strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('repository', type=Path)
    parser.add_argument('--apply', action='store_true', help='Apply after all compatibility checks pass')
    args = parser.parse_args()
    package = Path(__file__).resolve().parent
    manifest = json.loads((package / 'MANIFEST.json').read_text())
    patch = package / 'update.patch'
    if digest(patch) != manifest['patchSha256']:
        raise ValueError('The patch checksum does not match the manifest.')
    target = args.repository.resolve(strict=True)
    if Path(run(target, 'rev-parse', '--show-toplevel')).resolve() != target:
        raise ValueError('Pass the repository root, not a subdirectory.')
    if run(target, 'rev-parse', 'HEAD') != manifest['base']:
        raise ValueError('Incompatible HEAD. This package requires ' + manifest['base'] + '. No files changed.')
    if run(target, 'status', '--porcelain', '--untracked-files=no'):
        raise ValueError('Tracked changes or conflicts are present. Commit or otherwise resolve them yourself first. No files changed.')
    for entry in manifest['files']:
        relative = Path(entry['path'])
        if relative.is_absolute() or '..' in relative.parts or '.git' in relative.parts:
            raise ValueError('Unsafe package path: ' + str(relative))
        for part in [relative, *relative.parents]:
            if (target / part).is_symlink():
                raise ValueError('A destination or parent is a symlink: ' + str(relative))
        bundled = package / 'files' / relative
        if digest(bundled) != entry['sha256']:
            raise ValueError('Bundled file checksum mismatch: ' + str(relative))
        if entry['added'] and (target / relative).exists():
            raise ValueError('An untracked destination already exists: ' + str(relative))
    run(target, 'apply', '--check', '--binary', str(patch))
    print(f"Compatible: {len(manifest['files'])} files checked against {manifest['base']}.")
    if not args.apply:
        print('Check only; nothing changed. Add --apply to install.')
        return
    run(target, 'apply', '--binary', str(patch))
    for entry in manifest['files']:
        if digest(target / entry['path']) != entry['sha256']:
            raise ValueError('Installed checksum mismatch: ' + entry['path'])
    print('Installed and verified. Changes are uncommitted for your review. Nothing pushed or deployed.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, json.JSONDecodeError) as error:
        print('REFUSED: ' + str(error), file=sys.stderr)
        sys.exit(1)
