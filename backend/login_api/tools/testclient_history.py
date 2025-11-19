#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from fastapi.testclient import TestClient
from main import app
from utils.auth_utils import create_access_token

client = TestClient(app)
print('== TestClient No-token request ==')
r = client.get('/api/history')
print('status:', r.status_code)
print('body:', r.text[:1000])

print('\n== TestClient with token ==')
tok = create_access_token({'user_id': 'test-user-1'})
r2 = client.get('/api/history', headers={'Authorization': f'Bearer {tok}'})
print('status:', r2.status_code)
print('body:', r2.text[:1000])
