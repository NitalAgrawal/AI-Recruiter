import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, ChevronDown } from 'lucide-react'

const SUGGESTED_PROMPTS = [
  "Recommend the top 3 candidates for this job.",
  "Compare the highest ranked candidate with the second.",
  "Which candidate has the best React skills?",
  "Generate interview questions for the top candidate.",
  "Explain Candidate 1's weaknesses."
]

export default function CopilotChat({ jobId, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I am TalentAI Copilot. Ask me to compare candidates, generate interview questions, or explain AI rankings.' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim() || isTyping) return
    
    const userMessage = textToSend
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setIsTyping(true)

    // Add empty AI message to stream into
    setMessages(prev => [...prev, { role: 'ai', text: '' }])

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/copilot/job/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      })

      if (!response.ok) throw new Error('Failed to connect to Copilot')

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        
        // Parse SSE chunk format
        const lines = buffer.split('\n\n')
        // Keep the last partial chunk in the buffer
        buffer = lines.pop()

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6)
            if (dataStr === '[DONE]') continue
            try {
              const data = JSON.parse(dataStr)
              if (data.error) {
                setMessages(prev => {
                  const newArr = [...prev]; newArr[newArr.length - 1].text += `\n**Error**: ${data.error}`; return newArr;
                })
              } else if (data.text) {
                setMessages(prev => {
                  const newArr = [...prev]; newArr[newArr.length - 1].text += data.text; return newArr;
                })
              } else if (data.done) {
                // Done
              }
            } catch (err) {
              console.error('Failed to parse SSE data', dataStr)
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const newArr = [...prev]
        newArr[newArr.length - 1].text = 'Sorry, an error occurred while connecting to the AI Copilot.'
        return newArr
      })
    } finally {
      setIsTyping(false)
    }
  }

  // Very basic Markdown parser for bold and bullet points
  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      // Bold **text**
      let formattedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        parts.push(line.substring(lastIndex, match.index));
        parts.push(<strong key={`${i}-${match.index}`} className="text-white font-bold">{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }
      parts.push(line.substring(lastIndex));

      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return <li key={i} className="ml-4 mb-1 list-disc text-sm">{parts.length > 1 ? parts : line.substring(2)}</li>
      }
      if (line.trim() === '') return <br key={i} />
      
      return <p key={i} className="mb-2 text-sm leading-relaxed">{parts.length > 1 ? parts : line}</p>
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-24 bottom-6 right-6 w-96 bg-surface border border-white/[0.05] shadow-2xl shadow-black/50 rounded-2xl flex flex-col overflow-hidden z-40"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.05] bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Sparkles size={16} className="text-black" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">TalentAI Copilot</h3>
                <p className="text-[10px] text-text-muted">Job-aware intelligent assistant</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-text-muted transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-white/10' : 'bg-primary/20 text-primary'}`}>
                    {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-white/10 text-white rounded-tr-sm' : 'bg-black/30 border border-white/[0.04] text-text-secondary rounded-tl-sm'}`}>
                    {msg.text ? formatText(msg.text) : <span className="animate-pulse flex items-center gap-1"><span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"/> <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce delay-75"/> <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce delay-150"/></span>}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts (only show if no user messages yet) */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-white/[0.05] bg-black/20 overflow-x-auto whitespace-nowrap no-scrollbar space-x-2 flex">
              {SUGGESTED_PROMPTS.map((sp, i) => (
                <button 
                  key={i} onClick={() => handleSend(sp)}
                  className="px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs hover:bg-primary/10 transition-colors inline-block"
                >
                  {sp}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-white/[0.05] bg-white/[0.02]">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about these candidates..."
                disabled={isTyping}
                className="w-full bg-black/40 border border-white/[0.08] rounded-full py-2.5 pl-4 pr-12 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="absolute right-1.5 top-1.5 bottom-1.5 w-8 flex items-center justify-center rounded-full bg-primary text-black disabled:bg-white/10 disabled:text-text-muted transition-colors"
              >
                {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
