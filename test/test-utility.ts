export async function kvClear(kv: KVNamespace) {
  const list = await kv.list();
  list.keys.forEach(async (key) => kv.delete(key.name));
}

export async function kvKeyCount(kv: KVNamespace): Promise<number> {
  const list = await kv.list();
  return list.keys.length;
}

export async function kvContainsKey(kv: KVNamespace, targetKey: string): Promise<boolean> {
  const list = await kv.list();
  return list.keys.find((key) => key.name === targetKey) !== undefined;
}
