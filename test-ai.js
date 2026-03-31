const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjODQxNjY1Ni02ZWIyLTQ2ZjMtOWRjNC0xODdiNmU3ZmMzNWMiLCJlbWFpbCI6ImFkbWluQGZlbGV0aS5jb20iLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE3NzQ3MjI2NzIsImV4cCI6MTc3NDcyMzU3Mn0.Dr60m53pIzS3tCEaycIz7AegcNpdMcxFutJNHs-4Tt8";

const PROJECT_ID = "ec0c9a4a-d5d0-4468-b15b-e4146a23438b";
const BLOCK_ID = "c3e7a231-ec55-4f5f-abb6-8b682e43367f";

async function testAI() {
  const response = await fetch(`http://localhost:3001/api/projects/${PROJECT_ID}/blocks/${BLOCK_ID}/ai-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TOKEN}`
    },
    body: JSON.stringify({
      message: "Привет, помоги заполнить блок",
      history: [],
      blockContext: {}
    })
  });
  
  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Result:", JSON.stringify(data, null, 2));
}

testAI();
