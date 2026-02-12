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
  Card,
  CardContent,
  Grid,
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sqlQuery?: string;
  hasCode?: boolean;
}

const suggestedQuestions = [
  'What tables contain customer information?',
  'Show me the relationship between orders and customers',
  'What are the data quality issues in the sales table?',
  'Generate SQL to find top 10 customers by revenue',
  'Which columns have the most null values?',
  'Explain the purpose of the products table',
];

function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI database assistant. I can help you understand your database schema, generate SQL queries, and answer questions about your data. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response with delay
    setTimeout(() => {
      const responses: Record<string, { content: string; sql?: string }> = {
        'customer': {
          content: 'Based on your database schema, the **customers** table contains customer information. It has the following columns:\n\n- `id` (INTEGER, Primary Key)\n- `email` (VARCHAR)\n- `name` (VARCHAR)\n- `created_at` (TIMESTAMP)\n\nThis table has 15,000 rows and is related to the orders table through the customer_id foreign key.',
        },
        'relationship': {
          content: 'The **orders** table has a relationship with the **customers** table through a foreign key constraint:\n\n- `orders.customer_id` references `customers.id`\n\nThis is a one-to-many relationship, meaning one customer can have multiple orders.',
        },
        'sql': {
          content: 'Here\'s a SQL query to find the top 10 customers by revenue:',
          sql: `SELECT 
  c.id,
  c.name,
  c.email,
  SUM(o.total) as total_revenue
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.status = 'completed'
GROUP BY c.id, c.name, c.email
ORDER BY total_revenue DESC
LIMIT 10;`,
        },
        'quality': {
          content: 'Based on the data quality analysis, here are the issues found in the sales table:\n\n**Completeness Issues:**\n- `discount` column: 12% null values\n- `notes` column: 45% null values\n\n**Freshness:**\n- Last updated: 3 days ago (slightly stale)\n\n**Data Distribution:**\n- `quantity` column has 3 outliers (values > 1000)\n\nI recommend reviewing the null values and considering if they should have default values.',
        },
        'default': {
          content: 'I can help you with:\n\n1. **Schema Exploration** - Understanding table structures and relationships\n2. **SQL Generation** - Creating queries for your specific needs\n3. **Data Quality** - Identifying issues and patterns\n4. **Best Practices** - Recommendations for your database\n\nWhat specific question do you have about your database?',
        },
      };

      let response = responses.default;
      const lowerInput = inputValue.toLowerCase();

      if (lowerInput.includes('customer')) response = responses.customer;
      else if (lowerInput.includes('relationship')) response = responses.relationship;
      else if (lowerInput.includes('sql') || lowerInput.includes('query')) response = responses.sql;
      else if (lowerInput.includes('quality') || lowerInput.includes('issue')) response = responses.quality;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        sqlQuery: response.sql,
        hasCode: !!response.sql,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // Could add a toast notification here
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        AI Chat Assistant
      </Typography>

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

                    {message.role === 'assistant' && (
                      <Box display="flex" gap={1} mt={1} ml={1}>
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
                          <ThumbUpIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
                          <ThumbDownIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
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
                  placeholder="Ask me anything about your database..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  variant="outlined"
                  size="small"
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
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
              Try asking these common questions:
            </Typography>

            <Box display="flex" flexDirection="column" gap={1}>
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => handleSuggestedQuestion(question)}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    textTransform: 'none',
                    py: 1.5,
                  }}
                >
                  {question}
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