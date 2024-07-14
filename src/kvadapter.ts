export interface KvAdapter {
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: KVNamespacePutOptions
  ): Promise<void>;
  get<ExpectedValue = unknown>(
    key: string,
    options: KVNamespaceGetOptions<"json">
  ): Promise<ExpectedValue | null>;
  delete(name: string): Promise<void>;
}

export class DefaultKvAdapter implements KvAdapter {
  kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: KVNamespacePutOptions
  ): Promise<void> {
    return this.kv.put(key, value, options);
  }

  get<ExpectedValue = unknown>(
    key: string,
    options: KVNamespaceGetOptions<"json">
  ): Promise<ExpectedValue | null> {
    return this.kv.get(key, options);
  }

  delete(name: string): Promise<void> {
    return this.kv.delete(name);
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export class MockKvAdapter implements KvAdapter {
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: KVNamespacePutOptions
  ): Promise<void> {
    return new Promise(() => {
      return;
    });
  }

  get<ExpectedValue = unknown>(
    key: string,
    options: KVNamespaceGetOptions<"json">
  ): Promise<ExpectedValue | null> {
    return new Promise(() => {
      return null;
    });
  }

  delete(name: string): Promise<void> {
    return new Promise(() => {
      return;
    });
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
