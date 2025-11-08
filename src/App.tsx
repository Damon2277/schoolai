import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { requestDeepseekCompletion } from './services/deepseek'

type TemplateSource = 'public' | 'custom'

type TemplateCategory = 'public' | 'custom'

type Template = {
  id: string
  name: string
  description: string
  content: string
  placeholders: string[]
  source: TemplateSource
  updatedAt: string
  tags?: string[]
}

type TemplateForm = {
  id?: string
  name: string
  description: string
  content: string
  placeholdersText: string
}

type QuickTemplate = Template

type Conversation = {
  id: string
  title: string
  updatedAt: string
  lastInput: string
  lastOutput: string
}

type ToastState = {
  message: string
  top: number
  left: number
} | null

type NavigationItem = {
  id: string
  label: string
  abbreviation: string
}

const NAV_ITEMS: NavigationItem[] = [
  { id: 'ai-creation', label: 'AI创作中心', abbreviation: 'AI' },
  { id: 'template-library', label: '模板库', abbreviation: '模' },
  { id: 'smart-paper', label: '智能出题', abbreviation: '题' },
  { id: 'smart-review', label: '智能批改', abbreviation: '改' },
]

const createId = () => Math.random().toString(36).slice(2, 10)

const cloneTemplate = (template: Template): Template => ({
  ...template,
  placeholders: [...template.placeholders],
})

const pad = (value: number) => value.toString().padStart(2, '0')

const formatConversationTime = (iso: string) => {
  const date = new Date(iso)
  const now = new Date()
  const todayKey = now.toDateString()
  const targetKey = date.toDateString()

  if (todayKey === targetKey) {
    return `今天 ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (yesterday.toDateString() === targetKey) {
    return `昨天 ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  return `${date.getMonth() + 1}月${pad(date.getDate())}日 ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`
}

const now = Date.now()

const publicTemplates: Template[] = [
  {
    id: 'lesson-design-pro',
    name: '课程设计与备课助手',
    description: '几步生成教案、导入案例与教学流程',
    content:
      '请以初中【学科，如：物理】老师的身份，为我设计一节关于【具体知识点，如：光的折射】的课程。请按以下结构提供内容：\n1. **课程标题**：一个能吸引初中生注意力的标题。\n2. **教学目标**：列出2-3条具体、可衡量的知识、技能与情感目标。\n3. **课堂导入**：提供一个有趣的生活实例或小实验，用于课堂开场，激发学生兴趣。\n4. **教学流程**：简要说明讲授核心概念的步骤，并建议一个可供学生小组讨论的问题。\n5. **随堂练习**：设计2-3道难度递进的填空题或选择题，用于检验当堂学习效果。\n\n使用示例：\n> 请以初中物理老师的身份，为我设计一节关于“杠杆原理”的课程。请提供课程标题、教学目标、课堂导入、教学流程和随堂练习。',
    placeholders: [],
    source: 'public',
    updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exercise-generator',
    name: '例题与习题生成器',
    description: '快速生成多题型练习并附解析',
    content:
      '请为初中【学科，如：数学】的【具体章节或知识点，如：一元二次方程】生成【题目数量，如：5道】练习题。\n要求如下：\n- **题目类型**：包含选择题、填空题和一道应用题。\n- **难度梯度**：由易到难排列。\n- **参考答案与解析**：请为每一道题提供清晰的解题步骤和思路点拨。\n\n使用示例：\n> 请为初中数学的“全等三角形判定”生成5道练习题。要求包含选择题、填空题和一道应用题，难度由易到难，并附上参考答案与解析。',
    placeholders: [],
    source: 'public',
    updatedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'feedback-generator',
    name: '作业评估与反馈生成器',
    description: '按维度点评学生答案并给建议',
    content:
      '请扮演一名初中【学科，如：语文】老师，对以下学生的【作业类型，如：作文】进行评价。请从【评价维度1，如：中心思想】、【评价维度2，如：结构布局】和【评价维度3，如：语言表达】三个维度进行分析。\n【此处粘贴学生的作文内容或作业答案】\n请先给出总体评语，然后分别指出优点和具体的改进建议。\n\n使用示例：\n> 请扮演一名初中语文老师，对以下学生的作文进行评价。请从“立意新颖度”、“情节结构”和“语言生动性”三个维度进行分析。[作文内容...] 请先给出总体评语，然后分别指出优点和具体的改进建议。',
    placeholders: [],
    source: 'public',
    updatedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'concept-explainer',
    name: '复杂概念解释器',
    description: '用生活比喻解释抽象概念',
    content:
      '请向一位初中【年级，如：二年级】学生解释【复杂概念或名词，如：光合作用】。请遵循以下要求：\n- 使用一个他/她熟悉的**生活比喻**来解释。\n- 语言要**口语化、亲切**，避免使用过于专业的术语。\n- 最后提一个相关的问题，引导他/她思考这个概念在生活中的应用。\n\n使用示例：\n> 请向一位初中二年级学生解释“化学反应中的质量守恒定律”。使用一个他/她熟悉的生活比喻来解释，语言要口语化、亲切，最后提一个相关的问题引导思考。',
    placeholders: [],
    source: 'public',
    updatedAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'activity-creator',
    name: '课堂活动与素材创意师',
    description: '15分钟搞定互动活动与素材清单',
    content:
      '我需要在初中【学科，如：历史】课上讲授【知识点，如：丝绸之路】。请为我设计一个时长约【时间，如：15分钟】的课堂小组活动。\n活动要求：\n- **活动名称**：一个有趣的活动名称。\n- **活动目标**：明确学生通过活动要掌握什么。\n- **具体流程**：分步骤说明学生和老师分别要做什么。\n- 所需材料清单。\n\n使用示例：\n> 我需要在初中历史课上讲授“百家争鸣”。请为我设计一个时长约15分钟的课堂小组活动。活动要求包括：活动名称、活动目标、具体流程和所需材料清单。',
    placeholders: [],
    source: 'public',
    updatedAt: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
  },
]

const defaultCustomTemplates: Template[] = [
  {
    id: 'custom-1',
    name: '周测讲解模板',
    description: '适用于周测讲解，包含错题分析与策略建议',
    content:
      '请为${年级}${科目}周测（主题：${主题}）生成讲解稿，需包含整体点评、错题分析、改进建议。',
    placeholders: ['年级', '科目', '主题'],
    source: 'custom',
    updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
  },
]

const quickTemplateDefaultsBase = publicTemplates.slice(0, 3)

const defaultQuickTemplates: QuickTemplate[] = quickTemplateDefaultsBase.map((item) =>
  cloneTemplate(item),
)

const MAX_QUICK_TEMPLATES = 8

const initialConversations: Conversation[] = []

const sortConversations = (items: Conversation[]) =>
  [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

const formatTemplateUpdatedTime = (iso: string) => {
  const date = new Date(iso)
  return `${date.getMonth() + 1}月${pad(date.getDate())}日 ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`
}

const shortenText = (text: string, limit: number) => {
  if (!text) return ''
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, limit)}…`
}

const getChipSubtitle = (text: string) => shortenText(text, 12)

const emptyTemplateForm: TemplateForm = {
  name: '',
  description: '',
  content: '',
  placeholdersText: '',
}

function App() {
  const [activeNav, setActiveNav] = useState<string>(NAV_ITEMS[0].id)
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isCompactLayout, setIsCompactLayout] = useState(false)
  const [isMobileLayout, setIsMobileLayout] = useState(false)
  const [isHistoryOpen, setHistoryOpen] = useState(true)

  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>(() =>
    defaultQuickTemplates.slice(0, MAX_QUICK_TEMPLATES).map((item) => cloneTemplate(item)),
  )
  const [templateDialog, setTemplateDialog] = useState<Template | null>(null)
  const [templateFormValues, setTemplateFormValues] = useState<Record<string, string>>({})
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  const [composerValue, setComposerValue] = useState('')

  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  )

  const [templateTab, setTemplateTab] = useState<TemplateCategory>('public')
  const [customTemplates, setCustomTemplates] = useState<Template[]>(defaultCustomTemplates)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [templateForm, setTemplateForm] = useState<TemplateForm>(emptyTemplateForm)
  const [templateFormVisible, setTemplateFormVisible] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [generationResult, setGenerationResult] = useState('')
  const [generationError, setGenerationError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const composerInputRef = useRef<HTMLTextAreaElement | null>(null)
  const primaryAreaRef = useRef<HTMLDivElement | null>(null)

  const showToast = (message: string) => {
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0
    let top = viewportHeight / 2
    let left = viewportWidth / 2

    const targetRect =
      composerInputRef.current?.getBoundingClientRect() ??
      primaryAreaRef.current?.getBoundingClientRect()

    if (targetRect) {
      top = targetRect.top + targetRect.height / 2
      left = targetRect.left + targetRect.width / 2
    }
    setToast({ message, top, left })
    setTimeout(() => setToast(null), 2400)
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)')

    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompactLayout(event.matches)
    }

    setIsCompactLayout(mediaQuery.matches)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileLayout(event.matches)
    }

    setIsMobileLayout(mediaQuery.matches)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  useEffect(() => {
    if (isMobileLayout) {
      setSidebarCollapsed(true)
      setHistoryOpen(false)
    } else {
      setSidebarCollapsed(false)
      setHistoryOpen(true)
    }
  }, [isMobileLayout])

  const activeNavItem = useMemo(
    () => NAV_ITEMS.find((item) => item.id === activeNav),
    [activeNav],
  )

  const templateLibrary = useMemo(
    () => ({
      public: publicTemplates,
      custom: [...customTemplates].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    }),
    [customTemplates],
  )

  const handleNavChange = (navId: string) => {
    setActiveNav(navId)
    if (navId !== 'ai-creation') {
      setHistoryOpen(false)
    } else if (!isMobileLayout) {
      setHistoryOpen(true)
    }
  }

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev)
  const toggleHistory = () => setHistoryOpen((prev) => !prev)

  const handleTemplateSelect = (template: Template) => {
    if (template.placeholders.length === 0) {
      setComposerValue(template.content)
      setActiveTemplate(cloneTemplate(template))
      if (activeNav !== 'ai-creation') {
        setActiveNav('ai-creation')
      }
      showToast('内容已填入创作中心')
      return
    }

    setTemplateDialog(cloneTemplate(template))
    setTemplateFormValues(
      Object.fromEntries(template.placeholders.map((field) => [field, ''])),
    )
  }

  const handleTemplateValueChange = (field: string, value: string) => {
    setTemplateFormValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTemplateDialogClose = () => {
    setTemplateDialog(null)
    setTemplateFormValues({})
  }

  const handleTemplateApply = () => {
    if (!templateDialog) return

    let filled = templateDialog.content

    templateDialog.placeholders.forEach((field) => {
      const inputValue = templateFormValues[field]?.trim()
      const pattern = new RegExp(`\\$\\{${field}\\}`, 'g')
      const placeholderToken = `__${field}__`
      const replacement = inputValue && inputValue.length > 0 ? inputValue : placeholderToken
      filled = filled.replace(pattern, replacement)
    })

    templateDialog.placeholders.forEach((field) => {
      const placeholderToken = `__${field}__`
      const originalPlaceholder = '${' + field + '}'
      filled = filled.replace(new RegExp(placeholderToken, 'g'), originalPlaceholder)
    })

    setComposerValue(filled)
    setActiveTemplate(cloneTemplate(templateDialog))
    setTemplateDialog(null)
    setTemplateFormValues({})
    setActiveNav('ai-creation')
    showToast('模板已填入创作中心')
  }

  const handleTemplateFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleTemplateApply()
  }

  const handleClearTemplate = () => {
    setActiveTemplate(null)
  }

  const handleRemoveQuickTemplate = (templateId: string) => {
    setQuickTemplates((prev) => prev.filter((item) => item.id !== templateId))
    if (activeTemplate?.id === templateId) {
      setActiveTemplate(null)
    }
  }

  const addTemplateToQuickSlots = (template: Template) => {
    let added = false
    setQuickTemplates((prev) => {
      const exists = prev.find((item) => item.id === template.id)
      if (exists) {
        return prev
      }
      added = true
      const next = [cloneTemplate(template), ...prev]
      if (next.length > MAX_QUICK_TEMPLATES) {
        next.pop()
      }
      return next
    })
    if (added) {
      showToast('已添加到快捷模板')
    } else {
      showToast('该模板已在快捷模板中')
    }
  }

  const handleCreateConversation = () => {
    const timestamp = new Date().toISOString()
    const trimmed = composerValue.trim()
    const outputSnapshot = generationResult
    const shouldPersist = trimmed.length > 0 || outputSnapshot.trim().length > 0 || !!activeTemplate

    if (shouldPersist) {
      setConversations((prev) => {
        const fallbackTitle = `会话 ${prev.length + 1}`
        const derivedTitle = activeTemplate?.name ?? shortenText(trimmed, 16)

        const historyConversation: Conversation = {
          id: createId(),
          title: derivedTitle || fallbackTitle,
          updatedAt: timestamp,
          lastInput: trimmed,
          lastOutput: outputSnapshot,
        }

        return sortConversations([historyConversation, ...prev])
      })
    }

    setComposerValue('')
    setActiveTemplate(null)
    setGenerationResult('')
    setGenerationError('')
    setActiveConversationId(null)
    showToast('已开始新会话')
  }

  const handleSelectConversation = (conversationId: string) => {
    const conversation = conversations.find((item) => item.id === conversationId)
    if (conversation) {
      setComposerValue(conversation.lastInput)
      setGenerationResult(conversation.lastOutput)
      setGenerationError('')
      setActiveTemplate(null)
    }

    setActiveConversationId(conversationId)
    if (isCompactLayout || isMobileLayout) {
      setHistoryOpen(false)
    }
  }

  const handleRenameConversation = (conversationId: string) => {
    const conversation = conversations.find((item) => item.id === conversationId)
    if (!conversation) return

    const nextTitle = window.prompt('重命名会话', conversation.title)
    if (!nextTitle) return

    const normalized = nextTitle.trim()
    if (!normalized) return

    setConversations((prev) =>
      prev.map((item) =>
        item.id === conversationId
          ? {
              ...item,
              title: normalized,
            }
          : item,
      ),
    )
  }

  const handleDeleteConversation = (conversationId: string) => {
    if (!window.confirm('确定要删除该会话吗？')) {
      return
    }

    setConversations((prev) => {
      const filtered = prev.filter((item) => item.id !== conversationId)
      if (activeConversationId === conversationId) {
        setActiveConversationId(filtered[0]?.id ?? null)
      }
      return filtered
    })
  }

  const handleSendMessage = async () => {
    const trimmed = composerValue.trim()
    if (!trimmed || isGenerating) return
    setComposerValue('')

    const timestamp = new Date().toISOString()
    let conversationId = activeConversationId

    setConversations((prev) => {
      if (!conversationId) {
        conversationId = createId()
        const newConversation: Conversation = {
          id: conversationId,
          title: `会话 ${prev.length + 1}`,
          updatedAt: timestamp,
          lastInput: trimmed,
          lastOutput: '',
        }
        return sortConversations([newConversation, ...prev])
      }

      return sortConversations(
        prev.map((item) =>
          item.id === conversationId
            ? { ...item, updatedAt: timestamp, lastInput: trimmed }
            : item,
        ),
      )
    })

    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversationId(conversationId)
    }

    setIsGenerating(true)
    setGenerationError('')
    try {
      const output = await requestDeepseekCompletion(trimmed, activeTemplate?.name)
      setGenerationResult(output)
      if (conversationId) {
        setConversations((prev) =>
          sortConversations(
            prev.map((item) =>
              item.id === conversationId ? { ...item, lastOutput: output, updatedAt: timestamp } : item,
            ),
          ),
        )
      }
      showToast('创作完成')
    } catch (error) {
      const message = error instanceof Error ? error.message : '创作失败'
      setGenerationError(message)
      showToast('创作失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const openTemplateForm = (template?: Template) => {
    if (template) {
      setEditingTemplate(template)
      setTemplateForm({
        id: template.id,
        name: template.name,
        description: template.description,
        content: template.content,
        placeholdersText: template.placeholders.join(', '),
      })
    } else {
      setEditingTemplate(null)
      setTemplateForm(emptyTemplateForm)
    }
    setTemplateFormVisible(true)
  }

  const closeTemplateForm = () => {
    setTemplateFormVisible(false)
    setEditingTemplate(null)
    setTemplateForm(emptyTemplateForm)
  }

  const handleTemplateFormChange = (field: keyof TemplateForm, value: string) => {
    setTemplateForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTemplateEditorSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const placeholders = templateForm.placeholdersText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (editingTemplate) {
      const updatedTemplate: Template = {
        ...editingTemplate,
        name: templateForm.name,
        description: templateForm.description,
        content: templateForm.content,
        placeholders,
        updatedAt: new Date().toISOString(),
      }

      setCustomTemplates((prev) =>
        prev.map((item) => (item.id === editingTemplate.id ? updatedTemplate : item)),
      )

      setQuickTemplates((prev) =>
        prev.map((item) => (item.id === editingTemplate.id ? cloneTemplate(updatedTemplate) : item)),
      )

      if (activeTemplate?.id === editingTemplate.id) {
        setActiveTemplate(cloneTemplate(updatedTemplate))
      }

      showToast('模板已更新')
    } else {
      const newTemplate: Template = {
        id: createId(),
        name: templateForm.name,
        description: templateForm.description,
        content: templateForm.content,
        placeholders,
        source: 'custom',
        updatedAt: new Date().toISOString(),
      }
      setCustomTemplates((prev) => [newTemplate, ...prev])
      showToast('模板已创建')
    }

    closeTemplateForm()
  }

  const handleTemplateDelete = (templateId: string) => {
    if (!window.confirm('确定要删除该模板吗？')) return
    setCustomTemplates((prev) => prev.filter((item) => item.id !== templateId))
    setQuickTemplates((prev) => prev.filter((item) => item.id !== templateId))
    if (activeTemplate?.id === templateId) {
      setActiveTemplate(null)
    }
    showToast('模板已删除')
  }

  const renderCreationCenter = () => (
    <>
      <section className="primary-area__section composer-card">
          <div className="composer-card__header">
            <h3 className="composer-card__title">授课内容输入</h3>
            <button
              type="button"
              className="button button--ghost composer-card__new-session"
              onClick={handleCreateConversation}
            >
              + 新建会话
            </button>
          </div>

        <div className="composer">
          <div className="composer__input-area">
            <textarea
              id="composer-input"
              className="composer__textarea"
              rows={8}
              placeholder="授课内容输入"
              value={composerValue}
              ref={composerInputRef}
              onChange={(event) => setComposerValue(event.target.value)}
            />
            <div className="composer__chips">
              {quickTemplates.slice(0, MAX_QUICK_TEMPLATES).map((template) => {
                const subtitle = getChipSubtitle(template.description)
                return (
                  <div key={template.id} className="composer__chip-wrapper">
                    <button
                      type="button"
                      className="composer__chip"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <span className="composer__chip-name">{template.name}</span>
                      {subtitle && <span className="composer__chip-subtitle">{subtitle}</span>}
                    </button>
                    <button
                      type="button"
                      className="composer__chip-remove"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleRemoveQuickTemplate(template.id)
                      }}
                      aria-label="取消快捷模板"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="composer__footer">
            {activeTemplate && (
              <div className="composer__template-tag">
                使用模板：{activeTemplate.name}
                <button
                  type="button"
                  className="composer__clear-template"
                  onClick={handleClearTemplate}
                >
                  取消关联
                </button>
              </div>
            )}
            <div className="composer__actions">
              <button
                type="button"
                className="button button--primary composer__submit"
                onClick={handleSendMessage}
                disabled={isGenerating || composerValue.trim().length === 0}
              >
                {isGenerating ? '创作中…' : '创作'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {(generationResult || generationError) && (
        <section className="primary-area__section generation-card">
          <div className="generation-card__header">
            <h3 className="generation-card__title">AI 创作结果</h3>
            {!isGenerating && generationResult && (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => navigator.clipboard.writeText(generationResult)}
              >
                复制内容
              </button>
            )}
          </div>
          {generationError ? (
            <div className="generation-card__error">{generationError}</div>
          ) : (
            <div className="generation-card__content">{generationResult}</div>
          )}
        </section>
      )}
    </>
  )

  const renderTemplateLibrary = () => {
    const templates = templateLibrary[templateTab]

    const isCustomTab = templateTab === 'custom'

    return (
      <div className="template-library">
        <div className="template-library__header primary-area__section primary-area__section--header">
          <div className="template-library__title-inline">
            <h2>模板库</h2>
            <p className="template-library__intro">
              切换查看公共模板与自定义模板，快速应用到创作中心。
            </p>
          </div>
          <div className="template-library__tabs">
            <button
              type="button"
              className={`pill ${templateTab === 'public' ? 'pill--active' : ''}`}
              onClick={() => setTemplateTab('public')}
            >
              公共模板
            </button>
            <button
              type="button"
              className={`pill ${templateTab === 'custom' ? 'pill--active' : ''}`}
              onClick={() => setTemplateTab('custom')}
            >
              自定义模板
            </button>
          </div>
        </div>

        <div className="template-library__grid">
          {isCustomTab && (
            <button
              type="button"
              className="template-card template-card--dashed"
              onClick={() => openTemplateForm()}
            >
              <div className="template-card__body template-card__body--center">
                <h3 className="template-card__title">+ 新建模板</h3>
                <p className="template-card__description">
                  自定义模板可快速复用你的授课套路并同步到快捷模板
                </p>
              </div>
            </button>
          )}

          {templates.length === 0 ? (
            <div className="template-library__empty">暂无模板</div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-card__body">
                  <h3 className="template-card__title">
                    {template.name}
                    {template.source === 'custom' && (
                      <span className="template-card__title-actions">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="编辑模板"
                          onClick={() => openTemplateForm(template)}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="删除模板"
                          onClick={() => handleTemplateDelete(template.id)}
                        >
                          🗑
                        </button>
                      </span>
                    )}
                  </h3>
                  <p className="template-card__description">{template.description}</p>
                  <span className="template-card__updated">
                    更新于 {formatTemplateUpdatedTime(template.updatedAt)}
                  </span>
                </div>
                <div className="template-card__actions">
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    应用到创作
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => addTemplateToQuickSlots(template)}
                  >
                    设为快捷
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  const renderContent = (): ReactNode => {
    if (activeNav === 'template-library') {
      return renderTemplateLibrary()
    }

    if (activeNav === 'ai-creation') {
      return renderCreationCenter()
    }

    return (
      <section className="primary-area__section">
        <h2>{activeNavItem?.label}模块</h2>
        <p>该模块将在后续集成现有 PC 界面。</p>
      </section>
    )
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isSidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar__header">
          <span className="sidebar__logo" aria-label="诺塔AI教学工作台">
            诺塔AI
          </span>
          <button
            type="button"
            className="sidebar__collapse"
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? '展开导航栏' : '折叠导航栏'}
          >
            {isSidebarCollapsed ? '⟩' : '⟨'}
          </button>
        </div>
        <nav className="sidebar__nav" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar__nav-button ${
                activeNav === item.id ? 'sidebar__nav-button--active' : ''
              }`}
              onClick={() => handleNavChange(item.id)}
            >
              <span className="sidebar__nav-abbr" aria-hidden="true">
                {item.abbreviation}
              </span>
              <span className="sidebar__nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="content-wrapper">
        <header className="app-header">
          <div className="app-header__brand">
            {isMobileLayout && (
              <button
                type="button"
                className="app-header__menu"
                onClick={toggleSidebar}
                aria-label="切换导航栏"
              >
                {isSidebarCollapsed ? '菜单' : '收起'}
              </button>
            )}
            <div className="app-header__titles">
              <div className="app-header__title">诺塔AI教学工作台</div>
            </div>
          </div>
          <div className="app-header__actions">
            {isCompactLayout && activeNav === 'ai-creation' && (
              <button
                type="button"
                className="app-header__action"
                onClick={toggleHistory}
              >
                {isHistoryOpen ? '隐藏历史' : '历史会话'}
              </button>
            )}
            <button type="button" className="app-header__avatar" aria-label="用户菜单">
              用户名
            </button>
          </div>
        </header>

        <div className={`workspace ${activeNav !== 'ai-creation' ? 'workspace--single' : ''}`}>
          <main
            className="primary-area"
            aria-labelledby="main-content-title"
            ref={primaryAreaRef}
          >
            {renderContent()}
          </main>

          {activeNav === 'ai-creation' && isCompactLayout && isHistoryOpen && (
            <button
              type="button"
              className="history-panel__backdrop"
              aria-label="关闭历史会话栏"
              onClick={toggleHistory}
            />
          )}

          {isMobileLayout && !isSidebarCollapsed && (
            <button
              type="button"
              className="sidebar__backdrop"
              aria-label="关闭导航栏"
              onClick={toggleSidebar}
            />
          )}

          {activeNav === 'ai-creation' && (
            <aside className="history-panel" data-open={isHistoryOpen} aria-label="历史会话">
              <div className="history-panel__header">
                <h3>历史会话</h3>
              </div>
              <div className="history-panel__list" role="list">
                {conversations.length === 0 ? (
                  <div className="history-panel__empty">暂无历史记录</div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      role="listitem"
                      className={`history-panel__item ${
                        conversation.id === activeConversationId
                          ? 'history-panel__item--active'
                          : ''
                      }`}
                    >
                    <button
                      type="button"
                      className="history-panel__item-button"
                      onClick={() => handleSelectConversation(conversation.id)}
                    >
                      <span className="history-panel__item-title">{conversation.title}</span>
                      <span className="history-panel__item-time">
                        {formatConversationTime(conversation.updatedAt)}
                      </span>
                      {conversation.lastInput && (
                        <span className="history-panel__item-input">{conversation.lastInput}</span>
                      )}
                    </button>
                      <div className="history-panel__item-actions">
                        <button type="button" onClick={() => handleRenameConversation(conversation.id)}>
                          重命名
                        </button>
                        <button type="button" onClick={() => handleDeleteConversation(conversation.id)}>
                          删除
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {templateDialog && (
        <div className="template-dialog" role="dialog" aria-modal="true">
          <button
            type="button"
            className="template-dialog__backdrop"
            aria-label="关闭模板填写"
            onClick={handleTemplateDialogClose}
          />
          <div className="template-dialog__panel">
            <header className="template-dialog__header">
              <h3 className="template-dialog__title">{templateDialog.name}</h3>
              <p className="template-dialog__description">{templateDialog.description}</p>
            </header>
            <form className="template-dialog__form" onSubmit={handleTemplateFormSubmit}>
              {templateDialog.placeholders.length > 0 ? (
                templateDialog.placeholders.map((field) => (
                  <div key={field} className="template-dialog__field">
                    <label htmlFor={`placeholder-${field}`}>{field}</label>
                    <input
                      id={`placeholder-${field}`}
                      type="text"
                      value={templateFormValues[field] ?? ''}
                      onChange={(event) => handleTemplateValueChange(field, event.target.value)}
                      placeholder={`请输入${field}`}
                    />
                  </div>
                ))
              ) : (
                <div className="template-dialog__field template-dialog__field--empty">
                  该模板无需填写占位符，将直接填入。
                </div>
              )}

              <div className="template-dialog__preview">
                <span className="template-dialog__preview-label">模板原文：</span>
                <p className="template-dialog__preview-content">{templateDialog.content}</p>
              </div>

              <div className="template-dialog__actions">
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={handleTemplateDialogClose}
                >
                  取消
                </button>
                <button type="submit" className="button button--primary">
                  应用到创作
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {templateFormVisible && (
        <div className="template-dialog" role="dialog" aria-modal="true">
          <button
            type="button"
            className="template-dialog__backdrop"
            aria-label="关闭模板编辑"
            onClick={closeTemplateForm}
          />
          <div className="template-dialog__panel template-dialog__panel--form">
            <header className="template-dialog__header">
              <h3 className="template-dialog__title">
                {editingTemplate ? '编辑模板' : '新建模板'}
              </h3>
              <p className="template-dialog__description">
                模板内容支持插入 ${'{变量'} 形式占位符。多个占位符使用逗号分隔。
              </p>
            </header>
            <form className="template-dialog__form" onSubmit={handleTemplateEditorSubmit}>
              <div className="template-dialog__field">
                <label htmlFor="template-name">模板名称</label>
                <input
                  id="template-name"
                  type="text"
                  value={templateForm.name}
                  onChange={(event) => handleTemplateFormChange('name', event.target.value)}
                  placeholder="如：课堂导入模板"
                  required
                />
              </div>
              <div className="template-dialog__field">
                <label htmlFor="template-desc">模板简介</label>
                <input
                  id="template-desc"
                  type="text"
                  value={templateForm.description}
                  onChange={(event) => handleTemplateFormChange('description', event.target.value)}
                  placeholder="如：用于快速生成课堂导入语"
                  required
                />
              </div>
              <div className="template-dialog__field">
                <label htmlFor="template-content">模板内容</label>
                <textarea
                  id="template-content"
                  rows={6}
                  value={templateForm.content}
                  onChange={(event) => handleTemplateFormChange('content', event.target.value)}
                  placeholder="示例：请为${年级}${学科}主题“${主题}”生成课堂导入语..."
                  required
                />
              </div>
              <div className="template-dialog__field">
                <label htmlFor="template-placeholders">占位符（用逗号分隔）</label>
                <input
                  id="template-placeholders"
                  type="text"
                  value={templateForm.placeholdersText}
                  onChange={(event) => handleTemplateFormChange('placeholdersText', event.target.value)}
                  placeholder="如：年级, 学科, 主题"
                />
              </div>

              <div className="template-dialog__actions">
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={closeTemplateForm}
                >
                  取消
                </button>
                <button type="submit" className="button button--primary">
                  保存模板
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" style={{ top: toast.top, left: toast.left }}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default App
