const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Store connected clients
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established');

      // Handle authentication
      const token = this.extractTokenFromRequest(req);
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userEmail = decoded.email;
        
        // Store client with user email
        this.clients.set(ws, { userEmail, ws });
        console.log(`User ${userEmail} connected to WebSocket`);

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connection',
          message: 'Connected to WebSocket server',
          userEmail
        }));

      } catch (error) {
        console.log('WebSocket authentication failed:', error.message);
        ws.close(1008, 'Invalid token');
        return;
      }

      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        const client = this.clients.get(ws);
        if (client) {
          console.log(`User ${client.userEmail} disconnected from WebSocket`);
          this.clients.delete(ws);
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  extractTokenFromRequest(req) {
    // Try to get token from query parameter
    try {
      const url = new URL(req.url, `https://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (token) return token;
    } catch (error) {
      console.log('Error parsing URL:', error.message);
    }

    // Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  handleMessage(ws, data) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (data.type) {
      case 'reaction_update':
        this.broadcastReactionUpdate(data);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  broadcastReactionUpdate(data) {
    const message = JSON.stringify({
      type: 'reaction_update',
      invitationId: data.invitationId,
      reactionType: data.reactionType,
      count: data.count,
      userEmail: data.userEmail,
      timestamp: new Date().toISOString()
    });

    // Broadcast to all connected clients
    this.clients.forEach((client, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  // Method to broadcast updates from server-side events
  broadcastToAll(type, data) {
    const message = JSON.stringify({
      type,
      ...data,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((client, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

module.exports = WebSocketServer;
