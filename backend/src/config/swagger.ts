import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp Platform API',
      version: '1.0.0',
      description: 'Mini Twilio-like WhatsApp SaaS gateway API'
    },
    components: {
      securitySchemes: {
        appKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-APP-KEY',
          description: 'Also accepts APP_API_KEY, X-API-KEY, or Authorization: Bearer <APP_API_KEY>'
        }
      }
    },
    security: [{ appKey: [] }]
  },
  apis: ['./src/routes/*.ts']
});
