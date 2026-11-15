import { request as httpRequest } from 'node:http';
import { once } from 'node:events';

// Raw http.request keeps encoded and dot segments exactly as written; fetch would normalize them away.
export async function request(port, method, path, { body, headers = {} } = {}) {
  let outgoing = httpRequest({
    host: '127.0.0.1',
    port,
    method,
    path,
    headers,
  });
  outgoing.end(body);

  let [response] = await once(outgoing, 'response');
  let text = '';

  for await (let chunk of response) {
    text += chunk;
  }

  return { status: response.statusCode, headers: response.headers, text };
}
