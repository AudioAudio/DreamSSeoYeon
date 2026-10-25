// 로컬 시험용: worker.js를 메모리 KV로 띄움 (cd worker && node local-server.mjs → http://localhost:8787)
import http from 'node:http';
import w from './worker.js';
const store = {};
const env = { RANK: { get: async (k, t) => store[k] ? (t === 'json' ? JSON.parse(store[k]) : store[k]) : null, put: async (k, v) => { store[k] = v; } } };
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const r = await w.fetch(new Request('http://localhost:8787' + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8787, () => console.log('listening 8787'));
