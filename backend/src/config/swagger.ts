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
          name: 'X-APP-KEY'
        }
      }
    },
    security: [{ appKey: [] }]
  },
  apis: ['./src/routes/*.ts']
});
