"""Run rsconnect with a Windows fix for Node.js content.

rsconnect-python 1.30.0 calls subprocess.run(["npm", ...]) without a shell. On Windows npm
is installed as npm.cmd, which that call cannot find, so `write-manifest nodejs` and
`deploy nodejs` fail with "Could not find 'npm' on PATH". This wrapper resolves the full
path (npm.cmd) first, then runs the normal rsconnect CLI with whatever arguments you pass.

Usage (same arguments as rsconnect):
    python rsconnect-win.py write-manifest nodejs --overwrite .
    python rsconnect-win.py deploy nodejs -n qa .

Not needed on macOS/Linux, or once rsconnect fixes this upstream.
"""

import shutil

import rsconnect.environment_node as node_env

_original = node_env._detect_version


def _detect_version(executable, flag, label):
    return _original(shutil.which(executable) or executable, flag, label)


node_env._detect_version = _detect_version

from rsconnect.main import cli  # noqa: E402

cli()
