const copilotService = require('../services/ai/copilot.service');

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    const { jobId } = req.params;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Flush headers to establish stream immediately
    res.flushHeaders();

    // Delegate stream piping to service
    await copilotService.chatStream(jobId, req.user.id, message, res);
    
  } catch (error) {
    console.error('Copilot Chat Controller Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
};
