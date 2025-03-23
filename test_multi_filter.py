import requests

# This is a simple test script to verify the PSV multi-filter fix
# It sends requests with multiple filter values to verify the backend correctly handles them

API_URL = "http://localhost:8000"  # Change this if your API runs on a different port/host

def test_multi_filter():
    """Test filtering PSVs with multiple values for the same filter"""
    print("Testing PSV multi-value filtering...")
    
    # Test with multiple train values
    url = f"{API_URL}/api/psv?train=Train+A&train=Train+B"
    print(f"Testing: {url}")
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success! Received {len(data)} PSVs with Train A or Train B")
    else:
        print(f"✗ Failed: {response.status_code}")
    
    # Test with multiple type values
    url = f"{API_URL}/api/psv?type=Gate&type=Globe"
    print(f"Testing: {url}")
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success! Received {len(data)} PSVs with Type Gate or Globe")
    else:
        print(f"✗ Failed: {response.status_code}")
    
    # Test with multiple unit values
    url = f"{API_URL}/api/psv?unit=Unit+100&unit=Unit+200"
    print(f"Testing: {url}")
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success! Received {len(data)} PSVs with Unit 100 or Unit 200")
    else:
        print(f"✗ Failed: {response.status_code}")
    
    # Test with combinations of different filters
    url = f"{API_URL}/api/psv?unit=Unit+100&train=Train+A"
    print(f"Testing: {url}")
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success! Received {len(data)} PSVs with Unit 100 AND Train A")
    else:
        print(f"✗ Failed: {response.status_code}")
    
    print("Testing complete!")

if __name__ == "__main__":
    test_multi_filter()