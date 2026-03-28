#!/usr/bin/env python3
"""
LiveAction Media Scanner
media/ klasörünü tara, dosyaları kategorize et, metadata çıkart
"""

import os
import json
from pathlib import Path
from hashlib import md5

class MediaScanner:
    """Media klasörünü tarar ve dosyaları organize eder"""
    
    # Desteklenen dosya türleri
    EXTENSIONS = {
        'video': {'.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv', '.webm', '.m3u8'},
        'audio': {'.mp3', '.flac', '.aac', '.ogg', '.wav', '.m4a', '.opus'},
        'image': {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    }
    
    def __init__(self, media_path='./media'):
        """Initialize scanner"""
        self.media_path = Path(media_path)
        self.files = {}  # {file_id: file_path}
        self.scan()
    
    def scan(self):
        """media/ klasörünü tara"""
        if not self.media_path.exists():
            self.media_path.mkdir(parents=True)
            return
        
        self.files = {}
        
        # Tüm dosyaları bul
        for file_path in self.media_path.rglob('*'):
            if file_path.is_file():
                # File ID oluştur (path hash'i)
                file_id = self._get_file_id(file_path)
                self.files[file_id] = str(file_path)
    
    def _get_file_id(self, file_path):
        """Dosya için unique ID oluştur"""
        return md5(str(file_path).encode()).hexdigest()[:12]
    
    def _get_file_type(self, file_path):
        """Dosya türünü belirle"""
        ext = Path(file_path).suffix.lower()
        
        for type_name, extensions in self.EXTENSIONS.items():
            if ext in extensions:
                return type_name
        
        return 'unknown'
    
    def _get_file_info(self, file_path):
        """Dosya bilgisini çıkart"""
        path = Path(file_path)
        
        return {
            'name': path.stem,  # Dosya adı (extension olmadan)
            'filename': path.name,
            'size': path.stat().st_size,
            'type': self._get_file_type(file_path),
            'ext': path.suffix.lower()
        }
    
    def get_files(self):
        """Tüm dosyaları döndür"""
        result = []
        
        for file_id, file_path in self.files.items():
            info = self._get_file_info(file_path)
            info['id'] = file_id
            info['path'] = file_path
            result.append(info)
        
        return result
    
    def get_all_media(self):
        """Tüm medyayı kategorize ederek döndür"""
        files = self.get_files()
        
        result = {
            'videos': [],
            'audios': [],
            'images': [],
            'total': len(files)
        }
        
        for file_info in files:
            file_type = file_info['type']
            
            if file_type == 'video':
                result['videos'].append(file_info)
            elif file_type == 'audio':
                result['audios'].append(file_info)
            elif file_type == 'image':
                result['images'].append(file_info)
        
        # Dosyaları ada göre sırala
        result['videos'].sort(key=lambda x: x['name'])
        result['audios'].sort(key=lambda x: x['name'])
        result['images'].sort(key=lambda x: x['name'])
        
        return result
    
    def get_file_path(self, file_id):
        """File ID'den dosya path'ini al"""
        return self.files.get(file_id)
    
    def get_file_by_id(self, file_id):
        """File ID'den dosya bilgisini al"""
        file_path = self.get_file_path(file_id)
        
        if not file_path:
            return None
        
        info = self._get_file_info(file_path)
        info['id'] = file_id
        info['path'] = file_path
        
        return info
