# drksession

Lightweight session manager using Cloudflare KV storage

## Usage

Create a `SessionManager` object providing a `KvAdapter` encapsulating a `KVNamespace` bound to your worker.
You need to provide the cookie name and an array of valid domains for setting and receiving cookies.
The first domain in the array will be used as return URL if no referrer is provided when the user hits the worker.

## Maturity

This library is really new and it is the very first project I write in TypeScript for Cloudflare workers.
Using it for managing session with potential access to sensitive information is discouraged.

## TODO

- Add tests
- Add **Update session** feature to refresh tokens provided by authentications authorities.
- Refactor to make it more OOP (It was a set of functions originally)

## Tooling setup

Install **wrangler**
```
npm install wrangler --save-dev
```

Update **wrangler**
```
npm install wrangler@latest
```

Add **vitest**
```
npm install --save-dev --save-exact vitest@1.5.3
npm install --save-dev @cloudflare/vitest-pool-workers
```

In the `tsconfig.json` add:
```
  {
    "compilerOptions": {
      ...,
      "types": [
        "@cloudflare/workers-types/experimental"
+       "@cloudflare/vitest-pool-workers"
      ]
    },
  }
```

Use with import:
```
import { env } from "cloudflare:test";
```

Add **ESlint**
```
npm init @eslint/config@1.1.0
```

Add **prettier**
```
npm install --save-dev --save-exact prettier
```

Add coverage to **vitest** with **istanbul**
```
npm i -D @vitest/coverage-istanbul@1.5.3
```

And change `vitest.config.ts`:
```
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul'
    },
  },
})
```

## Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.