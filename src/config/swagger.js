import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.1',
  info: {
    title: 'SupCrud API',
    version: '1.0.0',
    description: 'API documentation for SupCrud (auth, owner, agents, tickets, public, addons)',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local server' },
    { url: 'http://localhost:3000/api', description: 'Local API base' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Credentials: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
        required: ['email', 'password'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string' },
          avatar: { type: 'string' },
        },
      },
      Workspace: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          referenceCode: { type: 'string' },
        },
      },
      Ticket: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string' },
          referenceCode: { type: 'string' },
          workspace_id: { type: 'string' },
          owner: { $ref: '#/components/schemas/User' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Credentials' },
            },
          },
        },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { type: 'object' } } } },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login and receive JWT token',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Credentials' },
            },
          },
        },
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current logged-in user',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },

    '/workspaces/mine': {
      get: {
        summary: 'List workspaces for current user',
        tags: ['Workspace'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/workspaces': {
      post: {
        summary: 'Create a workspace',
        tags: ['Workspace'],
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/workspaces/{id}': {
      get: {
        summary: 'Get workspace details',
        tags: ['Workspace'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
      put: {
        summary: 'Update workspace',
        tags: ['Workspace'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/workspaces/{id}/members': {
      get: {
        summary: 'List members in a workspace',
        tags: ['Workspace'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/workspaces/{id}/addons': {
      get: {
        summary: 'List enabled addons in a workspace',
        tags: ['Workspace'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/workspaces/{id}/addons/toggle': {
      post: {
        summary: 'Toggle an addon for a workspace',
        tags: ['Workspace'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, enabled: { type: 'boolean' } }, required: ['name', 'enabled'] } } } },
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/workspaces/{id}/ai-config': {
      get: {
        summary: 'Get AI configuration for workspace',
        tags: ['Workspace'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
      put: {
        summary: 'Update AI configuration for workspace',
        tags: ['Workspace'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Updated' } },
      },
    },

    '/owner/workspaces': {
      get: {
        summary: 'List all workspaces (owner only)',
        tags: ['Owner'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/owner/workspaces/{id}/status': {
      put: {
        summary: 'Update workspace status (owner only)',
        tags: ['Owner'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] } }, required: ['status'] } } } },
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/owner/workspaces/{id}/metrics': {
      get: {
        summary: 'Get workspace metrics (owner only)',
        tags: ['Owner'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/owner/addons': {
      get: {
        summary: 'List global addons (owner only)',
        tags: ['Owner'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        summary: 'Create a global addon (owner only)',
        tags: ['Owner'],
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/owner/addons/{id}': {
      put: {
        summary: 'Update a global addon (owner only)',
        tags: ['Owner'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Updated' } },
      },
      delete: {
        summary: 'Delete a global addon (owner only)',
        tags: ['Owner'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Deleted' } },
      },
    },

    '/agents/invite': {
      post: {
        summary: 'Invite an agent to the workspace',
        tags: ['Agents'],
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' } }, required: ['email'] } } } },
        responses: { '200': { description: 'Invited' } },
      },
    },
    '/agents/accept': {
      post: {
        summary: 'Accept an agent invite',
        tags: ['Agents'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } }, required: ['token'] } } } },
        responses: { '200': { description: 'Accepted' } },
      },
    },

    '/tickets/public': {
      post: {
        summary: 'Create a ticket from the public widget',
        tags: ['Tickets'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/tickets': {
      get: {
        summary: 'List tickets (workspace members)',
        tags: ['Tickets'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/tickets/{id}': {
      get: {
        summary: 'Get ticket details',
        tags: ['Tickets'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/tickets/{id}/status': {
      put: {
        summary: 'Update ticket status',
        tags: ['Tickets'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' } }, required: ['status'] } } } },
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/tickets/{id}/assign': {
      put: {
        summary: 'Assign ticket to an agent',
        tags: ['Tickets'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { agentId: { type: 'string' } }, required: ['agentId'] } } } },
        responses: { '200': { description: 'Assigned' } },
      },
    },
    '/tickets/{id}/messages': {
      post: {
        summary: 'Add a message to a ticket',
        tags: ['Tickets'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/tickets/{id}/attachments': {
      post: {
        summary: 'Upload attachment to a ticket',
        tags: ['Tickets'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
            },
          },
        },
        responses: { '201': { description: 'Uploaded' } },
      },
    },

    '/public/ticket/{referenceCode}': {
      get: {
        summary: 'Get public ticket info (partial)',
        tags: ['Public'],
        parameters: [{ name: 'referenceCode', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/public/ticket/{referenceCode}/full': {
      get: {
        summary: 'Get public ticket full info (requires access token)',
        tags: ['Public'],
        parameters: [{ name: 'referenceCode', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/public/request-otp': {
      post: {
        summary: 'Request OTP for public ticket access',
        tags: ['Public'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { phone: { type: 'string' }, referenceCode: { type: 'string' } }, required: ['phone', 'referenceCode'] } } } },
        responses: { '200': { description: 'OTP sent' } },
      },
    },
    '/public/verify-otp': {
      post: {
        summary: 'Verify OTP and get access token',
        tags: ['Public'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { referenceCode: { type: 'string' }, otp: { type: 'string' } }, required: ['referenceCode', 'otp'] } } } },
        responses: { '200': { description: 'Verified' } },
      },
    },
  },
};

export function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/api/docs.json', (req, res) => {
    res.json(swaggerDocument);
  });
}

export default swaggerDocument;
