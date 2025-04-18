# Congenial Robot

A full-stack web application with a React frontend and FastAPI backend, deployed on AWS.

## Deployment

The application is deployed and available at:
https://d13v6lzwthonv1.cloudfront.net

## Architecture

- **Frontend**: React with TypeScript, built with Vite, deployed to AWS S3
- **Backend**: FastAPI with Python, deployed to AWS Lambda
- **Infrastructure**: AWS resources managed through AWS CLI commands
- **CI/CD**: Automated deployment pipeline on merges to main branch using GitHub Actions

## AWS Resources

- S3 bucket: `congenial-robot-frontend` for static frontend hosting
- Lambda function: `congenial-robot-backend` for the backend API
- API Gateway: Exposes the Lambda function at `/api/*` endpoints
- CloudFront distribution: Serves both frontend and backend through a single domain

## Local Development

### Backend

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173

## Deployment Process

The application is automatically deployed when changes are merged to the main branch through the CI/CD pipeline. The workflow:

1. Builds the frontend assets
2. Packages the backend code for Lambda
3. Deploys the frontend to S3
4. Updates the Lambda function code
5. Invalidates the CloudFront cache to ensure the latest content is served
