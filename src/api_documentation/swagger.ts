import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

export const setupSwagger = (app: Express): void => {
    const options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'API de génération de quittance de loyer',
                version: '1.0.0',
                description: 'API REST pour générer des quittances de loyer en PDF.'
            },
            servers: [
                {
                    url: 'http://localhost:3000',
                    description: 'Serveur de développement'
                }
            ],
            components: {
                schemas: {
                    RentReceipt: {
                        type: 'object',
                        properties: {
                            receiptNumber: { type: 'string' },
                            rentalType: { type: 'string' },
                            month: { type: 'string' },
                            landlordName: { type: 'string' },
                            landlordAddress: { type: 'string' },
                            tenantName: { type: 'string' },
                            tenantAddress: { type: 'string' },
                            signedAt: { type: 'string' },
                            receiptDate: { type: 'string' },
                            rentalAddress: { type: 'string' },
                            rentalPeriodStart: { type: 'string' },
                            rentalPeriodEnd: { type: 'string' },
                            rentAmount: { type: 'number' },
                            rentAmountText: { type: 'string' },
                            chargesAmount: { type: 'number' },
                            energyContribution: { type: 'number' },
                            totalAmount: { type: 'number' },
                            paymentDate: { type: 'string' }
                        },
                        required: [
                            'rentalType',
                            'month',
                            'landlordName',
                            'landlordAddress',
                            'tenantName',
                            'tenantAddress',
                            'signedAt',
                            'receiptDate',
                            'rentalAddress',
                            'rentalPeriodStart',
                            'rentalPeriodEnd',
                            'rentAmount',
                            'rentAmountText',
                            'chargesAmount',
                            'totalAmount',
                            'paymentDate'
                        ]
                    }
                },
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            },
            security: [
                {
                    bearerAuth: []
                }
            ]
        },
        apis: ['./src/routes/*.ts']
    };

    const swaggerSpec = swaggerJsDoc(options);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};