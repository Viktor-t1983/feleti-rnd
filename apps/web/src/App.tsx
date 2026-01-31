import React from 'react'

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1> FELETI R&D Assistant 2.0</h1>
      <p>Welcome to the R&D Management System!</p>
      <p style={{ color: '#666' }}>Frontend is running on Vite + React</p>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <h3>Quick Status:</h3>
        <ul>
          <li> Frontend: Running</li>
          <li> API: Check http://localhost:3001/health</li>
          <li> Calc Engine: Check http://localhost:8000</li>
        </ul>
      </div>
    </div>
  )
}

export default App