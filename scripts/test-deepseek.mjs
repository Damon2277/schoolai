const apiKey = process.env.VITE_DEEPSEEK_API_KEY || 'sk-9b7ceaf2502a4bf6951f0a87ae7330a0'
console.log('Testing with key prefix:', apiKey.slice(0, 10))

const controller = new AbortController()
setTimeout(() => controller.abort(), 15000)

fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: '你是一名中文助手。' },
      { role: 'user', content: '测试：请说一句你好。' },
    ],
  }),
  signal: controller.signal,
})
  .then(async (res) => {
    console.log('status', res.status)
    const text = await res.text()
    console.log('body snippet:', text.slice(0, 300))
  })
  .catch((err) => {
    console.error('deepseek error', err)
  })
