# Financial Insights API

A robust NestJS-powered web API that aggregates real-time financial data and delivers actionable insights into users’ spending patterns, currency exchange fluctuations, and stock market trends. This API is tailored for budget-conscious individuals and investors seeking smart, data-driven decision-making.

## 🌟 Key Features

- **💱 Currency Exchange Tracker**  
  Get real-time exchange rates and historical data.

- **📈 Stock Market Monitor**  
  Track specific stocks and market indices with up-to-date information.

- **🧮 Budget Calculator**  
  Plan and manage personal finances based on current financial and economic data.

- **📊 Data Visualization**  
  Interactive charts for trends, comparisons, and future projections.

- **🔍 Search & Filter**  
  Easily find relevant currencies, stock tickers, or date ranges.

- **🚨 Alerts**  
  Set alerts for currency or stock thresholds to monitor market changes.

## 🔧 Tech Stack

- **Backend Framework:** [NestJS](https://nestjs.com)  
- **Database:** PostgreSQL  
- **Containerization:** Docker & Docker Compose  
- **Hosting:** Kamatera VM  
- **External APIs Used:**
  - [Alpha Vantage](https://www.alphavantage.co) (Stock Market Data)
  - [Fixer.io](https://fixer.io) (Currency Exchange Rates)
  - [ExchangeRate API](https://app.exchangerate-api.com) (Currency Exchange Rates)

## 🚀 Getting Started

### Prerequisites

- Docker
- Docker Compose

### Clone the Repository

```bash
git clone https://github.com/yourusername/financial-insights-api.git
cd financial-insights-api
```

### Build and Run the Application

```bash
docker compose up --build
```
### Run multiple instances

```bash
docker compose up --scale app=3
```
### Access the API

The deployed API is available at: http://91.223.236.51:80

### Deployment
  
Deployment is managed via CircleCI, which automatically builds and deploys the application to a Kamatera VM upon pushing changes to the `master` branch. The deployment script handles pulling the latest code, building the Docker images, and starting the application.

### N.B.
The app is designed to be accessed only via nginx, which serves as both a reverse proxy and a load balancer, for now the load balncing is a simple round robin without wieghts . All the configuration can be found in nginx.conf in the root directory of the project.
