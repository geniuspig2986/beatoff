(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/judge/freestyle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'Test Theme', player1Sequence: [], player2Sequence: [] }),
    });
    console.log('Judge status:', res.status);
    const text = await res.text();
    console.log('Judge body:', text);
  } catch (e) {
    console.error('Judge request failed:', e);
  }

  try {
    const formData = new FormData();
    formData.append('score', '10');
    formData.append('roast', 'You did great');
    // No video file for demo

    const res2 = await fetch('http://localhost:3000/api/social/twitter', {
      method: 'POST',
      body: formData,
    });
    console.log('Social status:', res2.status);
    console.log('Social body:', await res2.text());
  } catch (e) {
    console.error('Social request failed:', e);
  }
})();
