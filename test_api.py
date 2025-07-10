#!/usr/bin/env python3
"""
CADAgent PRO API Test Script
Tests Google Apps Script endpoints without CORS issues
"""

import requests
import json
import time
from datetime import datetime

# Configuration
SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeHGQCWYXVgdrzScNzem4PWtVHyJ53qRPDtjLZmsn4I0MQ6xKHlDvj76k4lNIXiH8XfA/exec"

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*50}")
    print(f" {title}")
    print(f"{'='*50}")

def print_result(test_name, success, details):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"   {details}")

def test_health_check():
    """Test GET health endpoint"""
    print_header("Health Check Test")
    
    try:
        start_time = time.time()
        response = requests.get(SCRIPT_URL, timeout=30)
        end_time = time.time()
        
        response_time = round((end_time - start_time) * 1000)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {response_time}ms")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response Data: {json.dumps(data, indent=2)}")
                
                # Check if it's a valid health response
                is_healthy = (
                    data.get('status') == 'healthy' and
                    'message' in data and
                    'timestamp' in data
                )
            except json.JSONDecodeError:
                print(f"Raw Response (not JSON): {response.text[:500]}...")
                is_healthy = False
            
            if is_healthy:
                print_result("Health Check", is_healthy, f"API is healthy: {data.get('message', 'N/A')}")
            else:
                print_result("Health Check", is_healthy, "Invalid response format")
            return is_healthy
        else:
            print_result("Health Check", False, f"HTTP {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print_result("Health Check", False, "Request timed out")
        return False
    except requests.exceptions.RequestException as e:
        print_result("Health Check", False, f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_result("Health Check", False, f"Invalid JSON response: {str(e)}")
        return False

def test_generate_model(prompt="Create a 20mm cube"):
    """Test POST generate model endpoint"""
    print_header("Generate Model Test")
    
    payload = {
        "action": "generate",
        "prompt": prompt
    }
    
    print(f"Testing prompt: '{prompt}'")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        start_time = time.time()
        response = requests.post(
            SCRIPT_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=60  # Longer timeout for AI generation
        )
        end_time = time.time()
        
        response_time = round((end_time - start_time) * 1000)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {response_time}ms")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Data: {json.dumps(data, indent=2)}")
            
            # Check if generation was successful
            is_successful = (
                data.get('success') == True and
                'intention' in data and
                'code' in data and
                'geometry' in data
            )
            
            if is_successful:
                print_result("Generate Model", True, f"Generated {data['intention'].get('primary_shape', 'unknown')} successfully")
                
                # Print some interesting details
                intention = data.get('intention', {})
                print(f"   Primary Shape: {intention.get('primary_shape', 'N/A')}")
                print(f"   Complexity: {intention.get('complexity', 'N/A')}")
                print(f"   Dimensions: {intention.get('dimensions', 'N/A')}")
                
                geometry = data.get('geometry', {})
                objects = geometry.get('objects', [])
                print(f"   Generated Objects: {len(objects)}")
                
            else:
                error_msg = data.get('error', 'Unknown error')
                print_result("Generate Model", False, f"Generation failed: {error_msg}")
            
            return is_successful
        else:
            print_result("Generate Model", False, f"HTTP {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print_result("Generate Model", False, "Request timed out")
        return False
    except requests.exceptions.RequestException as e:
        print_result("Generate Model", False, f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_result("Generate Model", False, f"Invalid JSON response: {str(e)}")
        return False

def test_signup(email="test@example.com"):
    """Test signup endpoint"""
    print_header("Signup Test")
    
    payload = {
        "action": "signup",
        "email": email
    }
    
    print(f"Testing email: {email}")
    
    try:
        start_time = time.time()
        response = requests.post(
            SCRIPT_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        end_time = time.time()
        
        response_time = round((end_time - start_time) * 1000)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {response_time}ms")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Data: {json.dumps(data, indent=2)}")
            
            is_successful = data.get('status') == 'success'
            print_result("Signup", is_successful, data.get('message', 'No message'))
            return is_successful
        else:
            print_result("Signup", False, f"HTTP {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result("Signup", False, f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_result("Signup", False, f"Invalid JSON response: {str(e)}")
        return False

def run_all_tests():
    """Run all API tests"""
    print_header("CADAgent PRO API Test Suite")
    print(f"Testing URL: {SCRIPT_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Test 1: Health Check
    results.append(("Health Check", test_health_check()))
    
    # Test 2: Generate Model
    results.append(("Generate Model", test_generate_model("Create a 20mm cube")))
    
    # Test 3: Generate Complex Model
    results.append(("Complex Generation", test_generate_model("Create a cylinder with a 5mm hole through the center")))
    
    # Test 4: Signup
    results.append(("Signup", test_signup("test@example.com")))
    
    # Summary
    print_header("Test Summary")
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\nResults: {passed}/{total} tests passed ({round(passed/total*100)}%)")
    
    if passed == total:
        print("🎉 All tests passed! API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the Google Apps Script deployment.")
        print("\nTroubleshooting:")
        print("1. Make sure you deployed the google-apps-script-simple.js code")
        print("2. Verify permissions are set to 'Anyone'")
        print("3. Check that the script URL is correct")

if __name__ == "__main__":
    run_all_tests()