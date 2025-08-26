#!/bin/bash

# MVP Learning Loop Integration Test
# Tests all 4 integrations to ensure voice feedback improves subsequent analysis

API_BASE="http://localhost:3001/api"
# Generate valid UUIDs for testing
TEST_USER_ID="550e8400-e29b-41d4-a716-446655440000"  
TEST_SESSION_ID="550e8400-e29b-41d4-a716-$(date +%s | tail -c 12)"

echo "🚀 Starting MVP Learning Loop Integration Test"
echo "Session ID: $TEST_SESSION_ID"
echo "User ID: $TEST_USER_ID"
echo ""

# Step 1: Research Profile A (baseline analysis)
echo "📊 Step 1: Analyzing Profile A (baseline)"
PROFILE_A=$(curl -s -X POST "$API_BASE/dev/profile-research" \
  -H "Content-Type: application/json" \
  -d "{
    \"profileUrl\": \"https://linkedin.com/in/test-profile-a\",
    \"sessionId\": \"$TEST_SESSION_ID\",
    \"userId\": \"$TEST_USER_ID\"
  }")

echo "Profile A Response: $PROFILE_A"
echo ""

# Step 2: Submit positive voice feedback for Profile A
echo "🎤 Step 2: Submitting voice feedback for Profile A"
VOICE_FEEDBACK=$(curl -s -X POST "$API_BASE/voice-processing" \
  -H "Content-Type: application/json" \
  -d "{
    \"transcription\": \"This profile looks really good. Perfect fit for our tech startup. Great experience in software engineering and the company size matches what we're looking for. Definitely want to contact this person.\",
    \"userId\": \"$TEST_USER_ID\",
    \"sessionId\": \"$TEST_SESSION_ID\",
    \"profileUrl\": \"https://linkedin.com/in/test-profile-a\",
    \"profileData\": {
      \"industry\": \"Technology\",
      \"current_role\": \"Software Engineer\",
      \"company_size\": \"startup\",
      \"years_experience\": 5
    }
  }")

echo "Voice Feedback Response: $VOICE_FEEDBACK"
echo ""

# Step 3: Research Profile B (should show improved analysis)
echo "📈 Step 3: Analyzing Profile B (should show learning impact)"
PROFILE_B=$(curl -s -X POST "$API_BASE/dev/profile-research" \
  -H "Content-Type: application/json" \
  -d "{
    \"profileUrl\": \"https://linkedin.com/in/test-profile-b\",
    \"sessionId\": \"$TEST_SESSION_ID\",
    \"userId\": \"$TEST_USER_ID\"
  }")

echo "Profile B Response: $PROFILE_B"
echo ""

# Extract key metrics for validation
echo "✅ Validation Results:"
echo "Voice Feedback Success: $(echo $VOICE_FEEDBACK | grep -o '\"success\":true' | wc -l)"
echo "Patterns Extracted: $(echo $VOICE_FEEDBACK | grep -o '\"patternsExtracted\":[0-9]*' | grep -o '[0-9]*')"
echo "Profile B Patterns Applied: $(echo $PROFILE_B | grep -o '\"patterns_applied\":[0-9]*' | grep -o '[0-9]*')"

echo ""
echo "🎯 MVP Learning Loop Integration Test Complete"
echo "Check the responses above to verify:"
echo "1. Voice feedback extracted patterns"
echo "2. Profile B analysis applied learned patterns"  
echo "3. Confidence improvements were detected"
echo "4. Learning system was enabled throughout"