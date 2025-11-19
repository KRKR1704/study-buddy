#!/usr/bin/env python3
import urllib.request
import urllib.error
import sys, os
# Ensure package root is on sys.path so we can import the app's modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from utils.auth_utils import create_access_token

URL = "http://127.0.0.1:8000/api/history"


def try_req(req):
    try:
        r = urllib.request.urlopen(req)
        print("STATUS", r.getcode())
        data = r.read().decode(errors="ignore")
        print(data[:2000])
    except urllib.error.HTTPError as e:
        print("HTTPERR", e.code)
        try:
            print(e.read().decode(errors="ignore")[:2000])
        except Exception:
            pass
    except Exception as e:
        print("ERR", e)


if __name__ == '__main__':
    print("== No-token request ==")
    req = urllib.request.Request(URL)
    try_req(req)

    print("\n== Generating token ==")
    tok = create_access_token({"user_id": "test-user-1"})
    print(tok[:120] + '...')

    print("\n== Token request ==")
    req2 = urllib.request.Request(URL, headers={"Authorization": f"Bearer {tok}"})
    try_req(req2)
