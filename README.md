# Tab Sync backend

This folder contains the Tab Sync API.

## Requirements

Install [Bun](https://bun.sh/) version 1.2 or newer.

## Run locally


```sh
bun install
bun run dev
```

The API starts at http://127.0.0.1:3000.

The server creates `tabsync.sqlite` in this folder.

The backend does not serve the web app.

Press Ctrl+C to stop the server.

## Run tests

From the `backend` folder, run:

```sh
bun test
```

## Configuration

You can set these variables before starting the server.

| Variable | Default | Use |
| --- | --- | --- |
| `PORT` | `3000` | Changes the API port. |
| `DATABASE_PATH` | `tabsync.sqlite` | Changes the SQLite database file. |

Example:

```sh
PORT=3001 DATABASE_PATH=./local.sqlite bun run dev
```

## More docs

Read [api.md](api.md) for the API reference.

Read [deploy.md](deploy.md) for deployment notes.
