import { useState } from 'react';

export function TestReactPage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test React Events</h1>
      <p>Count: {count}</p>
      <button
        onClick={() => {
          setCount((c) => c + 1);
        }}
        style={{ padding: '10px 20px', fontSize: '16px' }}
      >
        Increment
      </button>
      <button
        onClick={() => alert('Alert works!')}
        style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}
      >
        Test Alert
      </button>
    </div>
  );
}
