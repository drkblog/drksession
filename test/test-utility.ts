export async function clearKv(kv: KVNamespace) {
  const list = await kv.list();
  list.keys.forEach(async (key) => kv.delete(key.name));
}
