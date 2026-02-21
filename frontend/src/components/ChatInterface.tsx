import React from "react";
import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  ContentCopy as CopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  chatAPI,
  dictionariesAPI,
  DictionaryListItem,
  ChatMessage as APIChatMessage,
  SuggestedQuestion,
} from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sqlQuery?: string;
  hasCode?: boolean;
}

function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your AI database assistant. Select a dictionary below, then ask me anything about your database schema, data quality, or SQL queries.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dictionaries, setDictionaries] = useState<DictionaryListItem[]>([]);
  const [selectedDictId, setSelectedDictId] = useState<string>('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [loadingDicts, setLoadingDicts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchDictionaries();
  }, []);

  useEffect(() => {
    if (selectedDictId) {
      fetchSuggestions(selectedDictId);
    }
  }, [selectedDictId]);

  const fetchDictionaries = async () => {
    setLoadingDicts(true);
    try {
      const res = await dictionariesAPI.list();
      setDictionaries(res.data);
      if (res.data.length > 0) {
        setSelectedDictId(res.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch dictionaries:', error);
    } finally {
      setLoadingDicts(false);
    }
  };

  const fetchSuggestions = async (dictId: string) => {
    try {
      const res = await chatAPI.getSuggestions(dictId);
      setSuggestedQuestions(res.data);
    } catch {
      setSuggestedQuestions([]);
    }
  };

  const extractSqlFromResponse = (content: string): { text: string; sql?: string } => {
    const sqlMatch = content.match(/```sql\n([\s\S]*?)```/);
    if (sqlMatch) {
      const text = content.replace(/```sql\n[\s\S]*?```/, '').trim();
      return { text, sql: sqlMatch[1].trim() };
    }
    return { text: content };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!selectedDictId) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Please select a dictionary first. If you haven\'t generated one yet, go to the Explorer page to generate a data dictionary.',
          timestamp: new Date(),
        },
      ]);
      return;
    }

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

    try {
      // Build conversation history for context
      const history: APIChatMessage[] = messages
        .filter((m) => m.id !== '1') // skip initial greeting
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await chatAPI.query({
        dictionary_id: selectedDictId,
        question,
        conversation_history: history,
      });

      const { text, sql } = extractSqlFromResponse(res.data.answer);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text || res.data.answer,
        timestamp: new Date(),
        sqlQuery: sql,
        hasCode: !!sql,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update suggested questions from response
      if (res.data.suggested_questions?.length > 0) {
        setSuggestedQuestions(res.data.suggested_questions);
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail ||
        'Sorry, I encountered an error. Please check your API key in Settings and try again.';
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

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          AI Chat Assistant
        </Typography>
        <FormControl size="small" sx={{ minWidth: 250 }}>
          <InputLabel>Dictionary Context</InputLabel>
          <Select
            value={selectedDictId}
            label="Dictionary Context"
            onChange={(e) => setSelectedDictId(e.target.value)}
            disabled={loadingDicts}
          >
            {dictionaries.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.database_name} ({d.total_tables} tables)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!loadingDicts && dictionaries.length === 0 && (
        <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>
            No dictionaries found. Generate a data dictionary first to enable AI chat.
          </Typography>
          <Button variant="contained" href="/explorer" sx={{ mt: 1 }}>
            Go to Explorer
          </Button>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' }}>
            {/* Messages Area */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 3,
                bgcolor: 'background.default',
              }}
            >
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    mb: 3,
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                      width: 36,
                      height: 36,
                    }}
                  >
                    {message.role === 'user' ? <PersonIcon /> : <BotIcon />}
                  </Avatar>

                  <Box sx={{ maxWidth: '75%' }}>
                    <Box
                      sx={{
                        bgcolor: message.role === 'user' ? 'primary.lighter' : 'background.paper',
                        p: 2,
                        borderRadius: 2,
                        border: 1,
                        borderColor: message.role === 'user' ? 'primary.light' : 'divider',
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          '& strong': { fontWeight: 'bold' },
                        }}
                      >
                        {message.content}
                      </Typography>

                      {message.sqlQuery && (
                        <Box mt={2}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Chip icon={<CodeIcon />} label="SQL Query" size="small" color="primary" />
                            <IconButton size="small" onClick={() => handleCopyCode(message.sqlQuery!)}>
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box
                            sx={{
                              borderRadius: 1,
                              overflow: 'hidden',
                              '& pre': { margin: 0 },
                            }}
                          >
                            <SyntaxHighlighter language="sql" style={vscDarkPlus} customStyle={{ fontSize: 13 }}>
                              {message.sqlQuery}
                            </SyntaxHighlighter>
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {message.role === 'assistant' && message.id !== '1' && (
                      <Box display="flex" gap={1} mt={1} ml={1}>
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
                          <ThumbUpIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
                          <ThumbDownIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: 'text.secondary' }}
                          onClick={() => handleCopyCode(message.content)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}

              {isLoading && (
                <Box display="flex" gap={2} mb={3}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                    <BotIcon />
                  </Avatar>
                  <Box
                    sx={{
                      bgcolor: 'background.paper',
                      p: 2,
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <CircularProgress size={20} />
                  </Box>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>

            <Divider />

            {/* Input Area */}
            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder={
                    selectedDictId
                      ? 'Ask me anything about your database...'
                      : 'Select a dictionary to start chatting...'
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  variant="outlined"
                  size="small"
                  disabled={!selectedDictId}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading || !selectedDictId}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&:disabled': { bgcolor: 'action.disabledBackground' },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar - Suggested Questions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Suggested Questions
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {selectedDictId
                ? 'Try asking these questions about your database:'
                : 'Select a dictionary to see suggestions.'}
            </Typography>

            <Box display="flex" flexDirection="column" gap={1}>
              {suggestedQuestions.map((sq, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => handleSuggestedQuestion(sq.question)}
                  disabled={!selectedDictId}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    textTransform: 'none',
                    py: 1.5,
                  }}
                >
                  {sq.question}
                </Button>
              ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Tips
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1 }}>
              <Typography component="li" variant="body2" color="text.secondary" mb={1}>
                Ask about specific tables or columns
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" mb={1}>
                Request SQL queries for complex operations
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" mb={1}>
                Inquire about data quality metrics
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Get explanations of table relationships
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ChatInterface;