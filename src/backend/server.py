#!/usr/bin/env python3
"""
LiveAction Media Server
Ana sunucu - HTTP requests'i handle et, API routes'ı yönet
"""

import os
import sys
import json
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from media import MediaScanner

class LiveActionHandler(SimpleHTTPRequestHandler):
    """Custom HTTP handler - API + static files"""
    
    # Media scanner instance
    scanner = None
    
    def do_GET(self):
        """GET requests handle et"""
        parsed = urlparse(self.path)
        path = parsed.path
        
        # API endpoints
        if path == '/api/media':
            self.send_api_response(self.scanner.get_all_media())
        elif path == '/api/files':
            # Raw dosya listesi (filter için)
            self.send_api_response(self.scanner.get_files())
        elif path.startswith('/stream/'):
            # Video/audio stream
            file_id = path.replace('/stream/', '')
            self.stream_file(file_id)
        else:
            # Static files (index.html, style.css, app.js, vb.)
            super().do_GET()
    
    def send_api_response(self, data):
        """JSON API response gönder"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def stream_file(self, file_id):
        """Dosya stream et (video/audio)"""
        file_path = self.scanner.get_file_path(file_id)
        
        if not file_path:
            self.send_error(404)
            return
        
        # Absolute path'e çevir
        abs_path = os.path.abspath(file_path)
        
        if not os.path.exists(abs_path):
            print(f"❌ File not found: {abs_path}")
            self.send_error(404)
            return
        
        # MIME type belirle
        mime_type, _ = mimetypes.guess_type(abs_path)
        mime_type = mime_type or 'application/octet-stream'
        
        # Dosya boyutu
        file_size = os.path.getsize(abs_path)
        
        self.send_response(200)
        self.send_header('Content-type', mime_type)
        self.send_header('Content-Length', str(file_size))
        self.send_header('Accept-Ranges', 'bytes')
        self.end_headers()
        
        # Dosyayı stream et
        with open(abs_path, 'rb') as f:
            self.wfile.write(f.read())
    
    def end_headers(self):
        """CORS headers ekle"""
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()


def run_server(port=8000, media_path=None):
    """Server'ı başlat"""
    
    # Çalışma dizinini değiştir (src/ klasörü olmalı)
    script_dir = Path(__file__).parent.parent
    os.chdir(script_dir)
    
    # Media path default (liveaction/media)
    # __file__ = /home/erdem/liveaction/src/backend/server.py
    # .parent.parent.parent = /home/erdem/liveaction
    if media_path is None:
        media_path = Path(__file__).parent.parent.parent / 'media'
    
    # Media scanner'ı initialize et
    LiveActionHandler.scanner = MediaScanner(str(media_path))
    
    # Server başlat
    server = HTTPServer(('0.0.0.0', port), LiveActionHandler)
    print(f"🎬 LiveAction started on http://localhost:{port}")
    print(f"   Media path: {os.path.abspath(media_path)}")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n⏹️  Server stopped")
        sys.exit(0)


if __name__ == '__main__':
    run_server()