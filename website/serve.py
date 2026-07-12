#!/usr/bin/env python3
"""Static file server for the Noteora website preview.

Avoids `python3 -m http.server`'s CLI path entirely: that module computes
argparse's --directory default via os.getcwd() at import time, which fails
under sandboxes that block cwd resolution. This script never calls
os.getcwd() (SITE_DIR is a hardcoded absolute path, not derived via
os.path.abspath which itself falls back to cwd for relative inputs) and
passes `directory` straight to the handler (stdlib feature since Python 3.7).
Honors $PORT for tools that assign a port dynamically.
"""
import os
import functools
import http.server

SITE_DIR = "/Users/anilsimsek/Desktop/projects/noteora/website"
PORT = int(os.environ.get("PORT", "8743"))

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=SITE_DIR)
httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), handler)
print(f"Serving {SITE_DIR} on port {PORT}")
httpd.serve_forever()
