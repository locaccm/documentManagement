import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

export const setupSwagger = (app: Express): void => {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "API DocumentManagement",
        version: "1.0.0",
        description: "API REST pour générer des quittances de loyer en PDF.",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Serveur de développement",
        },
      ],
      tags: [
        {
          name: "Documents",
          description:
            "Opérations liées aux documents PDF (quittances, suppressions, liste)",
        },
      ],
      components: {
        schemas: {
          RentReceipt: {
            type: "object",
            properties: {
              receiptNumber: { type: "string" },
              rentalType: { type: "string" },
              month: { type: "string" },
              landlordName: { type: "string" },
              landlordAddress: { type: "string" },
              tenantName: { type: "string" },
              tenantAddress: { type: "string" },
              signedAt: { type: "string" },
              receiptDate: { type: "string" },
              rentalAddress: { type: "string" },
              rentalPeriodStart: { type: "string" },
              rentalPeriodEnd: { type: "string" },
              rentAmount: { type: "number" },
              rentAmountText: { type: "string" },
              chargesAmount: { type: "number" },
              energyContribution: { type: "number" },
              totalAmount: { type: "number" },
              paymentDate: { type: "string" },
            },
            required: [
              "rentalType",
              "month",
              "landlordName",
              "landlordAddress",
              "tenantName",
              "tenantAddress",
              "signedAt",
              "receiptDate",
              "rentalAddress",
              "rentalPeriodStart",
              "rentalPeriodEnd",
              "rentAmount",
              "rentAmountText",
              "chargesAmount",
              "totalAmount",
              "paymentDate",
            ],
          },
          DocumentInfo: {
            type: "object",
            properties: {
              name: { type: "string", example: "quittance-abc.pdf" },
              url: {
                type: "string",
                example:
                  "https://storage.googleapis.com/mon-bucket/42/document/quittance-abc.pdf",
              },
              created: {
                type: "string",
                format: "date-time",
                example: "2024-11-04T12:34:56Z",
              },
            },
          },
        },
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: ["./src/routes/*.ts"],
  };

  const swaggerSpec = swaggerJsDoc(options);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
