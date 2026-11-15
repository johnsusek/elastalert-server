import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Browsers do not apply the same-origin policy to websockets, so a browser handshake must come from the page's own host.
export function isOriginAllowed(headers) {
  if (headers.origin === undefined) {
    return true;
  }

  let originHost;

  try {
    originHost = new URL(headers.origin).host;
  } catch {
    return false;
  }

  if (!originHost) {
    return false;
  }

  return [headers.host, headers['x-forwarded-host']].some(host => typeof host === 'string' && host.toLowerCase() === originHost);
}

function rejectHandshake(socket, status) {
  socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
}

export function listen(port) {
  let server = createServer();
  let wss = new WebSocketServer({ noServer: true, path: '/test' });

  server.on('upgrade', (request, socket, head) => {
    if (!wss.shouldHandle(request)) {
      return rejectHandshake(socket, '400 Bad Request');
    }

    if (!isOriginAllowed(request.headers)) {
      return rejectHandshake(socket, '403 Forbidden');
    }

    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws, request));
  });

  wss.on('connection', ws => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });

  // Keepalive in case clients lose connection during a long rule test.
  // If client doesn't respond in 10s this will close the socket and
  // therefore stop the elastalert test from continuing to run detached.
  let keepalive = setInterval(() => {
    wss.clients.forEach(ws => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping(() => {});
    });
  }, 10000);

  wss.on('close', () => {
    clearInterval(keepalive);
    server.close();
  });

  server.listen(port);

  return { wss, server };
}
