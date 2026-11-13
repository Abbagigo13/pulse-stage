
require('dotenv').config();

async function testQwen() {
  const { QWEN_API_KEY, QWEN_BASE_URL, QWEN_MODEL } = process.env;

  if (!QWEN_API_KEY || !QWEN_BASE_URL || !QWEN_MODEL) {
    throw new Error('Missing Qwen environment variables.');
  }

  console.log('Testing Qwen connection...');
  console.log('Model:', QWEN_MODEL);
  console.log('Endpoint:', QWEN_BASE_URL);

  const response = await fetch(
    `${QWEN_BASE_URL}/chat/completions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are PulseStage AI, a health and performance insights assistant.'
          },
          {
            role: 'user',
            content: 'Introduce yourself in one sentence.'
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Qwen API error ${response.status}: ${
        data.error?.message || JSON.stringify(data)
      }`
    );
  }

  console.log('\nQWEN CONNECTION SUCCESSFUL');
  console.log(data.choices?.[0]?.message?.content);
}

testQwen().catch(error => {
  console.error('\nQWEN TEST FAILED:', error.message);
  process.exitCode = 1;
});
