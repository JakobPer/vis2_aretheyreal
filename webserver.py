# https://stackoverflow.com/questions/59908927/failed-to-load-module-script-the-server-responded-with-a-non-javascript-mime-ty
#Use to create local host
import http.server
import socketserver

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
      ".js": "application/javascript"
})

print("Webserver starting on port {0}".format(PORT))

httpd = socketserver.TCPServer(("", PORT), Handler)
httpd.serve_forever()