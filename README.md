# Document Management

## Overview

The Document Management is a specialized service for handling document operations within a property management system. It provides functionality for generating, storing, retrieving, and deleting documents such as rent receipts. The service integrates with Google Cloud Storage for document storage and uses JWT for authentication.

## Features

- **Document Generation**: Create PDF documents like rent receipts from database information
- **Document Storage**: Store documents securely in Google Cloud Storage
- **Document Retrieval**: Retrieve documents with proper authentication
- **Document Deletion**: Remove documents when no longer needed
- **User-specific Storage**: Documents are stored in user-specific folders for better organization
- **Secure Access**: JWT authentication ensures only authorized users can access documents

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database
- Google Cloud Storage account and bucket

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/locaccm/documentManagement.git
   cd documentManagement
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see [Configuration](#configuration))

4. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# Google Cloud Storage
GCS_BUCKET_NAME="your-gcs-bucket-name"

# JWT Authentication
JWT_SECRET_KEY="your-jwt-secret-key"

# Database Connection
DATABASE_URL="postgresql://username:password@host:port/database"
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| GCS_BUCKET_NAME | Name of your Google Cloud Storage bucket for document storage |
| JWT_SECRET_KEY | Secret key for JWT token generation and validation |
| DATABASE_URL | PostgreSQL connection string for database access |

## Usage

### API Endpoints

The microservice provides the following endpoints:

#### Generate Rent Receipt
```
POST /api/rent-receipt
```
Generates a rent receipt PDF for a specific lease and saves it to Google Cloud Storage.

**Request Body:**
```json
{
  "leaseId": 1
}
```

**Response:**
```json
{
  "message": "Rent receipt successfully generated and saved",
  "pdfUrl": "https://storage.googleapis.com/bucket-name/user-id/document/quittance-uuid.pdf"
}
```

#### Get Document
```
GET /api/document/:documentId
```
Retrieves a document by its ID.

#### Delete Document
```
DELETE /api/document/:documentId
```
Deletes a document by its ID.

## API Documentation

The API is documented using Swagger. Once the server is running, you can access the Swagger UI at:

```
http://localhost:<port>/api-docs
```

## Testing

Run the test suite with:

```bash
npm test
```

This will execute all tests and generate a coverage report.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: [AIC-???] - ....'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

### Coding Standards

- Follow the ESLint configuration
- Write tests for new features
- Update documentation as needed
