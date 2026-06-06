# @syncframe/redis

Redis-backed [`SyncStore`](https://www.npmjs.com/package/@syncframe/core) and `SyncTransport` adapters for [`@syncframe/core`](https://www.npmjs.com/package/@syncframe/core), so a `SyncServer` can persist anchors and fan out snapshots across processes and serverless instances.

The adapters are **connection-injected** — you pass in your own [`ioredis`](https://www.npmjs.com/package/ioredis) clients, so connection, auth, and pooling stay in your app. The dependency on core is type-only, so this package adds no runtime coupling.

## Install

```bash
npm install @syncframe/redis @syncframe/core ioredis
```

`ioredis` is a peer dependency.

## Usage

```ts
import Redis from 'ioredis';
import { SyncServer } from '@syncframe/core/server';
import { RedisStore, RedisTransport } from '@syncframe/redis';

const redis = new Redis(process.env.REDIS_URL!);

const server = new SyncServer({
  store: new RedisStore({ redis }),
  // A subscriber connection can't issue other commands, so the transport
  // creates a fresh one per subscription.
  transport: new RedisTransport({ redis, createSubscriber: () => new Redis(process.env.REDIS_URL!) }),
});
```

Both adapters accept a `prefix` option (default `"syncframe"`) to namespace keys and channels.

## License

MIT
