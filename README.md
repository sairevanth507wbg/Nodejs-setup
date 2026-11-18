# hello-nodejs — Node.js test app for Posit Connect

A minimal Node.js web app used to prove that Node.js content runs on our Posit Connect
servers. Standard library only (`node:http`), no npm dependencies, so the package install
on the server can't fail on a missing package or registry access.

## What it serves

| Path | Returns |
| --- | --- |
| `/` | HTML page: "Hello from Node vX.Y.Z" + runtime details |
| `api/info` | Same details as JSON |
| `health` | `ok` |

**Pass:** the page shows `Hello from Node v24.11.1` — the version of the
`docker.io/library/node:24.11.1` execution environment on the server.

## Files

```
Nodejs-setup/
├── server.js           the app — listens on $PORT, which Connect sets
├── package.json        entry point + engines.node ">=24.11.0 <25"
├── package-lock.json   required by Connect (it installs with npm)
├── manifest.json       for Git-backed publishing
└── rsconnect-win.py    Windows workaround for rsconnect (not deployed)
```

## Run locally

```bash
npm start          # http://localhost:3000
```

## Deploy — option 1: Git-backed

In Connect: **Publish** → **Import from Git**

- Repository URL: `https://github.com/sairevanth507wbg/Nodejs-setup.git`
- Branch: `main`
- Directory: `/`

Connect polls the branch and redeploys when new commits land. If the repository is
private, Connect needs Git credentials for github.com configured by an administrator.

## Deploy — option 2: from your machine with rsconnect

Needs rsconnect-python ≥ 1.29.0 and an API key (Connect → your name → **API Keys**).

```powershell
rsconnect add --server https://posit-connect-qa.worldbank.org --name qa --api-key <API_KEY>
python rsconnect-win.py deploy nodejs -n qa -x "rsconnect-win.py" -x "README.md" .
```

On macOS/Linux use `rsconnect` directly instead of `python rsconnect-win.py`.

## After changing files

Regenerate the manifest so its checksums match, then commit it:

```powershell
python rsconnect-win.py write-manifest nodejs --overwrite -x "rsconnect-win.py" -x "README.md" .
```

## Why rsconnect-win.py

rsconnect-python 1.30.0 runs `npm --version` without a shell. On Windows npm is `npm.cmd`,
which that call can't find, so `write-manifest nodejs` / `deploy nodejs` fail with
*"Could not find 'npm' on PATH"* even though npm is installed. The wrapper resolves the
full path first and otherwise runs the normal rsconnect CLI.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| "Node.js is not enabled" / no matching environment | `NodeJs.Enabled` or the Node execution environment isn't on that server — check **System → Environments** |
| No Node.js installation matches | `engines.node` in package.json doesn't include the server's Node version |
| Content pod stuck in `ImagePullBackOff` | the cluster can't pull `docker.io/library/node:24.11.1` |
| Error about `package-lock.json` | run `npm install` and commit the lockfile |
| Links 404 on Connect | use relative links (`api/info`), not `/api/info` — Connect serves the app under a path prefix |
