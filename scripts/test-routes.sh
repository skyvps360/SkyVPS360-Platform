#!/bin/bash

BASE_URL=${1:-"http://localhost:8080"}
echo "Testing routes on $BASE_URL"

# Function to test a route
test_route() {
    local route=$1
    local expected_status=${2:-200}
    
    echo -n "Testing $route... "
    status=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL$route)
    
    if [ $status -eq $expected_status ]; then
        echo "✅ OK ($status)"
    else
        echo "❌ Failed! Expected $expected_status but got $status"
    fi
}

# Test API routes
echo -e "\n==== API Routes ===="
test_route "/api/user" 401  # Should be 401 if not authenticated

# Test SPA routes
echo -e "\n==== SPA Routes ===="
test_route "/"
test_route "/dashboard"
test_route "/github-guide"
test_route "/github-setup"
test_route "/auth"

# Test static assets
echo -e "\n==== Static Assets ===="
test_route "/assets/index.css" 200

echo -e "\nRoute testing complete!"
