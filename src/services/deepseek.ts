type DeepseekChoice = {
  message?: {
    content?: string
  }
}

type DeepseekResponse = {
  choices?: DeepseekChoice[]
  error?: {
    code?: string
    message?: string
  }
}

const API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions'
const DEFAULT_MODEL = 'deepseek-chat'
const REQUEST_TIMEOUT_MS = 40000

const getApiKey = () => import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined

export async function requestDeepseekCompletion(prompt: string, templateName?: string) {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw new Error('未配置 DeepSeek API Key，请在 .env.local 中设置 VITE_DEEPSEEK_API_KEY')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: '你是一名资深教研员，请基于教师输入的授课需求输出结构化的教学内容。',
          },
          {
            role: 'user',
            content: templateName
              ? `模板：${templateName}\n需求：${prompt}`
              : `请生成授课方案，需求：${prompt}`,
          },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      let errorMessage = 'DeepSeek 接口请求失败'
      try {
        const data: DeepseekResponse = await response.json()
        errorMessage = data.error?.message ?? errorMessage
      } catch {
        // ignore
      }
      throw new Error(errorMessage)
    }

    const data = (await response.json()) as DeepseekResponse
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('DeepSeek 返回内容为空')
    }

    return content
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试（网络可能受限或 DeepSeek 响应较慢）')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
