/**
 * Test script to verify charter blocks creation via API
 * Run: npx tsx test-charter-flow.ts
 */

const API_URL = 'http://localhost:3001';

async function getToken(): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@feleti.com', password: 'admin123' }),
  });
  const data = await response.json() as { accessToken: string };
  return data.accessToken;
}

async function createProject(token: string, equipmentTypeId?: string) {
  const payload = {
    code: `TEST-${Date.now()}`,
    name: 'Тест блоков устава',
    ownerId: 'c8416656-6eb2-46f3-9dc4-187b6e7fc35c',
    stage: 'IDEA',
    ...(equipmentTypeId && { equipmentTypeId }),
  };

  console.log('Creating project with payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${API_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  console.log('Response status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  return data;
}

async function checkBlocks(projectId: string) {
  // This would query the database - simplified version
  console.log(`Checking blocks for project: ${projectId}`);
}

async function main() {
  console.log('=== Test 1: Create project WITHOUT equipmentTypeId ===');
  const token1 = await getToken();
  await createProject(token1);
  
  console.log('\n=== Test 2: Create project WITH equipmentTypeId: eq-cutter ===');
  const token2 = await getToken();
  await createProject(token2, 'eq-cutter');
  
  console.log('\n=== Test 3: Create project WITH equipmentTypeId: eq-vacuum ===');
  const token3 = await getToken();
  await createProject(token3, 'eq-vacuum');
}

main().catch(console.error);
