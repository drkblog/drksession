export class DefaultKvAdapter {
    constructor(kv) {
        this.kv = kv;
    }
    put(key, value, options) {
        return this.kv.put(key, value, options);
    }
    get(key, options) {
        return this.kv.get(key, options);
    }
    delete(name) {
        return this.kv.delete(name);
    }
}
/* eslint-disable @typescript-eslint/no-unused-vars */
export class MockKvAdapter {
    put(key, value, options) {
        return new Promise(() => {
            return;
        });
    }
    get(key, options) {
        return new Promise(() => {
            return null;
        });
    }
    delete(name) {
        return new Promise(() => {
            return;
        });
    }
}
/* eslint-enable @typescript-eslint/no-unused-vars */
