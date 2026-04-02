#!/bin/bash

# Test script to simulate project creation from frontend
# This tests the exact flow

TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@feleti.com","password":"admin123"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo "=== Creating project with equipmentTypeId: eq-cutter ==="

RESPONSE=$(curl -s -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "TEST-WEB-FLOW-001",
    "name": "Тест веб-流程",
    "ownerId": "c8416656-6eb2-46f3-9dc4-187b6e7fc35c",
    "stage": "IDEA",
    "equipmentTypeId": "eq-cutter"
  }')

echo "Response: $RESPONSE"

PROJECT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Project ID: $PROJECT_ID"

echo ""
echo "=== Checking database ==="

docker exec feleti-postgres psql -U postgres -d feleti_rnd -c "
SELECT id, code, name, \"equipmentTypeId\" FROM \"Project\" WHERE id = '$PROJECT_ID';
SELECT COUNT(*) as block_count FROM project_blocks WHERE \"projectId\" = '$PROJECT_ID';
SELECT pb.id, pb.status, tb.name 
FROM project_blocks pb 
LEFT JOIN template_blocks tb ON pb.\"templateBlockId\" = tb.id 
WHERE pb.\"projectId\" = '$PROJECT_ID';
"

echo ""
echo "=== Done ==="
