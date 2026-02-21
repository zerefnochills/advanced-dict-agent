import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Paper,
  TextField,
  Typography,
  Avatar,
  Fade,
  Slide,
  Zoom,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { chatAPI, dictionariesAPI, ChatMessage as APIChatMessage } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const FloatingAIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI assistant. I can help you explore your database schema, generate queries, and answer questions. How can I help?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dictionaryId, setDictionaryId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-select the most recent dictionary when the chatbot opens
  useEffect(() => {
    if (isOpen && !dictionaryId) {
      loadDictionary();
    }
  }, [isOpen]);

  const loadDictionary = async () => {
    try {
      const res = await dictionariesAPI.list();
      if (res.data.length > 0) {
        setDictionaryId(res.data[0].id);
      }
    } catch {
      // No dictionaries available
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = inputValue;
    setInputValue('');
    setIsLoading(true);

    if (!dictionaryId) {
      // No dictionary → give a helpful message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            "I don't have a data dictionary to work with yet. Please go to the Explorer page to generate one first, then I can answer questions about your database!",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const history: APIChatMessage[] = messages
        .filter((m) => m.id !== '1')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await chatAPI.query({
        dictionary_id: dictionaryId,
        question,
        conversation_history: history,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.data.answer,
          timestamp: new Date(),
        },
      ]);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail ||
        'Sorry, something went wrong. Please check your API key in Settings.';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Window */}
      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Paper
          elevation={0}
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 24,
            width: 380,
            height: 550,
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
            zIndex: 1300,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2.5,
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(249, 249, 249, 1) 100%)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)',
                  boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                }}
              >
                <BotIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#1d1d1f' }}>
                  AI Assistant
                </Typography>
                <Typography variant="caption" sx={{ color: '#86868b', fontSize: '0.75rem' }}>
                  {dictionaryId ? 'Connected to your database' : 'No dictionary loaded'}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setIsOpen(false)}
              size="small"
              sx={{
                color: '#86868b',
                '&:hover': { background: 'rgba(0, 0, 0, 0.04)' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2.5,
              background: '#fafafa',
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 0, 0, 0.15)',
                borderRadius: 3,
                '&:hover': { background: 'rgba(0, 0, 0, 0.25)' },
              },
            }}
          >
            {messages.map((message, index) => (
              <Fade in key={message.id} timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    mb: 2.5,
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      background:
                        message.role === 'user'
                          ? 'linear-gradient(135deg, #86868b 0%, #5e5e63 100%)'
                          : 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)',
                      boxShadow:
                        message.role === 'user'
                          ? '0 2px 8px rgba(0, 0, 0, 0.15)'
                          : '0 2px 8px rgba(0, 122, 255, 0.3)',
                    }}
                  >
                    {message.role === 'user' ? (
                      <PersonIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <BotIcon sx={{ fontSize: 16 }} />
                    )}
                  </Avatar>

                  <Box sx={{ maxWidth: '75%' }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        background:
                          message.role === 'user'
                            ? '#007AFF'
                            : 'rgba(255, 255, 255, 0.95)',
                        color: message.role === 'user' ? '#ffffff' : '#1d1d1f',
                        border: message.role === 'user' ? 'none' : '1px solid rgba(0, 0, 0, 0.06)',
                        boxShadow:
                          message.role === 'user'
                            ? '0 4px 12px rgba(0, 122, 255, 0.25)'
                            : '0 2px 8px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          fontWeight: message.role === 'user' ? 500 : 400,
                        }}
                      >
                        {message.content}
                      </Typography>
                    </Paper>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        ml: message.role === 'user' ? 0 : 1,
                        mr: message.role === 'user' ? 1 : 0,
                        textAlign: message.role === 'user' ? 'right' : 'left',
                        color: '#86868b',
                        fontSize: '0.7rem',
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Fade>
            ))}

            {isLoading && (
              <Fade in>
                <Box display="flex" gap={1.5} mb={2.5}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      background: 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)',
                    }}
                  >
                    <BotIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    <CircularProgress size={20} sx={{ color: '#007AFF' }} />
                  </Paper>
                </Box>
              </Fade>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              background: 'rgba(255, 255, 255, 0.98)',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                background: '#f5f5f7',
                borderRadius: 3,
                p: 0.5,
                border: '1px solid rgba(0, 0, 0, 0.06)',
              }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    px: 1.5,
                    py: 1,
                    fontSize: '0.9rem',
                    fontWeight: 400,
                    color: '#1d1d1f',
                    '&::placeholder': { color: '#86868b' },
                  },
                }}
              />
              <IconButton
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                sx={{
                  width: 36,
                  height: 36,
                  background: inputValue.trim() ? '#007AFF' : 'rgba(0, 0, 0, 0.05)',
                  color: 'white',
                  '&:hover': {
                    background: inputValue.trim() ? '#0051D5' : 'rgba(0, 0, 0, 0.08)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.05)',
                    color: 'rgba(0, 0, 0, 0.2)',
                  },
                  transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                }}
              >
                <SendIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Slide>

      {/* Floating Button */}
      <Zoom in={!isOpen}>
        <IconButton
          onClick={() => setIsOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)',
            color: 'white',
            boxShadow: '0 8px 24px rgba(0, 122, 255, 0.35), 0 0 1px rgba(0, 122, 255, 0.5)',
            zIndex: 1300,
            '&:hover': {
              background: 'linear-gradient(135deg, #0051D5 0%, #003D9F 100%)',
              transform: 'scale(1.05)',
              boxShadow: '0 12px 32px rgba(0, 122, 255, 0.45)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          }}
        >
          <ChatIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Zoom>
    </>
  );
};

export default FloatingAIChatbot;
