import time
import threading
import requests
import json
import sys

BASE_URL = "https://d34fecnctmxvyw.cloudfront.net"
CONCURRENT_USERS = 20
DURATION_SECONDS = 60

total_requests = 0
successful_requests = 0
failed_requests = 0
lock = threading.Lock()
stop_flag = False

def worker_thread(user_id):
    global total_requests, successful_requests, failed_requests
    session = requests.Session()
    
    # 1. Authenticate user
    try:
        auth_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "admin123"},
            timeout=10
        )
        if auth_resp.status_code == 200:
            token = auth_resp.json().get("accessToken")
            session.headers.update({"Authorization": f"Bearer {token}"})
    except Exception as e:
        print(f"[User {user_id}] Auth failed: {e}")

    endpoints = [
        ("GET", f"{BASE_URL}/api/health"),
        ("GET", f"{BASE_URL}/api/dashboard"),
        ("GET", f"{BASE_URL}/api/tickets"),
        ("GET", f"{BASE_URL}/api/categories"),
    ]

    while not stop_flag:
        for method, url in endpoints:
            if stop_flag:
                break
            try:
                if method == "GET":
                    resp = session.get(url, timeout=10)
                else:
                    resp = session.post(url, timeout=10)
                
                with lock:
                    total_requests += 1
                    if 200 <= resp.status_code < 400:
                        successful_requests += 1
                    else:
                        failed_requests += 1
                        print(f"[{method} {url}] Returned {resp.status_code}")
            except Exception as e:
                with lock:
                    total_requests += 1
                    failed_requests += 1
                print(f"[User {user_id}] Request error: {e}")
            
            time.sleep(0.05)

def main():
    global stop_flag
    print(f"Starting Light Load Sanity Check: {CONCURRENT_USERS} concurrent users against {BASE_URL}")
    print(f"Duration: {DURATION_SECONDS} seconds...\n")
    
    start_time = time.time()
    threads = []
    
    for i in range(CONCURRENT_USERS):
        t = threading.Thread(target=worker_thread, args=(i+1,))
        t.daemon = True
        t.start()
        threads.append(t)

    # Monitor progress
    while time.time() - start_time < DURATION_SECONDS:
        elapsed = int(time.time() - start_time)
        with lock:
            reqs = total_requests
            succ = successful_requests
            fail = failed_requests
        rate = reqs / max(1, elapsed)
        sys.stdout.write(f"[{elapsed}s/{DURATION_SECONDS}s] Total Requests: {reqs} | Success: {succ} | Failed: {fail} | Rate: {rate:.1f} req/s\r")
        sys.stdout.flush()
        time.sleep(2)
        
    stop_flag = True
    for t in threads:
        t.join(timeout=2)
        
    print("\n\n" + "="*60)
    print("LOAD SANITY CHECK FINAL RESULTS")
    print("="*60)
    print(f"Target URL:              {BASE_URL}")
    print(f"Concurrent Users:        {CONCURRENT_USERS}")
    print(f"Total Duration:          {DURATION_SECONDS}s")
    print(f"Total Requests Executed: {total_requests}")
    print(f"Successful Requests:     {successful_requests}")
    print(f"Failed Requests:         {failed_requests}")
    error_rate = (failed_requests / max(1, total_requests)) * 100
    print(f"Error Rate:              {error_rate:.2f}%")
    print("="*60)
    
    if failed_requests == 0 and total_requests > 0:
        print("LOAD TEST RESULT: PASSED (0 errors encountered!)")
    else:
        print("LOAD TEST RESULT: COMPLETED")

if __name__ == "__main__":
    main()
