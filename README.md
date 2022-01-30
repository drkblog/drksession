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
- Add **Update session** feature to refresh tokes provided by authentications authorities.
- Refactor to make it more OOP (It was a set of functions originally)

## Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.