import React from 'react';

export function TestFormPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Form submitted!');
  };

  // Debug: log button click
  React.useEffect(() => {
    const button = document.getElementById('test-submit-button');
    if (button) {
      button.addEventListener('click', (_e) => {
        alert('Button clicked!');
      });
    }
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Form Submit</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Test" style={{ padding: '10px' }} />
        <button id="test-submit-button" type="submit" style={{ padding: '10px 20px' }}>
          Submit
        </button>
      </form>
    </div>
  );
}
