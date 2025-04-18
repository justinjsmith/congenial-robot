# Congenial Robot

A full-stack web application with a React frontend and FastAPI backend, deployed on AWS.

## Architecture

- **Frontend**: React with TypeScript, built with Vite, deployed to AWS S3
- **Backend**: FastAPI with Python, deployed to AWS Lambda
- **Infrastructure**: AWS resources managed through direct AWS CLI commands
- **CI/CD**: Automated deployment pipeline on merges to main branch using GitHub Actions

## Deployment

The application is deployed and available at:
https://d13v6lzwthonv1.cloudfront.net

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

## Infrastructure

The AWS infrastructure is managed using CDK and includes:

- S3 bucket for static frontend hosting
- Lambda function for the backend API
- API Gateway to expose the Lambda function
- CloudFront distribution for content delivery
- CI/CD pipeline for automated deployments

## Deployment Process

The application is automatically deployed when changes are merged to the main branch through the CI/CD pipeline.
