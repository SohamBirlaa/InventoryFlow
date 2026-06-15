# InventoryFlow — Inventory & Order Management System

InventoryFlow is a lightweight, high-performance, and responsive web application designed to manage catalog items, register customer profiles, and process sales orders. It is engineered with a React (Vite) frontend, a FastAPI (Python) backend, and a PostgreSQL database.

---

## Tech Stack

- **Frontend**: React 19 (Vite), Tailwind CSS, Axios, React Router 7, React Hook Form.
- **Backend**: FastAPI, SQLAlchemy ORM, Uvicorn, Pydantic, PostgreSQL client.
- **Database**: PostgreSQL 16.
- **Dependency Management**: `uv` (Fast and efficient dependency installer for Python).
- **Containerization**: Docker, Docker Compose.

---

## Features

1. **Interactive Dashboard**:
   - High-impact KPI cards summarizing inventory statistics: Total Products, Registered Customers, Total Orders, and Low Stock Alerts.
   - Built-in connection resilience that detects server availability and prompts for retries.
2. **Product Catalog Management (CRUD)**:
   - Full Create, Read, Update, and Delete operations for products.
   - Client-side SKU uniqueness checks to prevent SQL database constraint violations.
   - Filter catalog dynamically by search keywords (Name, SKU) and stock status (All, Low Stock, Out of Stock).
   - Validation fields checking name, price (must be positive), and stock (integer >= 0).
3. **Customer Directory**:
   - Register new customers with email validation and local duplicate check.
   - View list of customers with initials-based profile avatars.
   - Search by name, email, or phone.
4. **Order Management System**:
   - Create multi-item sales orders with dynamic rows addition and removal.
   - Select customers from dropdown list.
   - Real-time stock limit validation: prevents placing orders if quantity exceeds available stock levels.
   - Real-time calculations of line items total and final grand total.
   - Beautiful, structured print-ready **Sales Invoice Modal** detailing items, unit prices, and customer info.

---

## Business Rules Implemented

- **Low Stock Threshold**: Products with quantities strictly less than **10** trigger a "Low Stock" badge and show up in Dashboard alerts.
- **SKU Uniqueness**: Every product SKU code must be unique. Frontend validates this before submitting forms.
- **Stock Depletion**: Processing an order automatically decrements the respective product's stock levels.
- **Stock Limit Validation**: Users cannot order quantities exceeding the available stock. Dropdowns show available stock levels.
- **Currency Standard**: All monetary values are rendered in **Indian Rupees (INR)** using the `en-IN` locale and `₹` symbol (e.g. `₹1,50,000.75`), including Lakhs formatting.

---

## Docker Architecture

The application is containerized into three distinct microservices orchestrated via `docker-compose`:

```
                    +-----------------------------+
                    |       Client Browser        |
                    +--------------+--------------+
                                   |
         +-------------------------+-------------------------+
         | Port 3000                                         | Port 8000
         v                                                   v
+--------+--------+                                 +--------+--------+
|    frontend     | --(Vite build API requests)-->  |     backend     |
| (Nginx Serve)   |                                 | (FastAPI App)   |
+-----------------+                                 +--------+--------+
                                                             |
                                                             | Docker Network
                                                             v
                                                    +--------+--------+
                                                    |    postgres     |
                                                    | (DB persistence)|
                                                    +-----------------+
```

- **`postgres`**: Runs PostgreSQL 16. Uses a named volume `postgres_data` mapping to `/var/lib/postgresql/data` for persistent database storage. Implements a health check via `pg_isready`.
- **`backend`**: Python FastAPI app. Builds with `uv` directly using Astral's binary copy phase, speeding up container creation. Depends on the PostgreSQL healthcheck to prevent boot-up race conditions.
- **`frontend`**: React assets compiled during multi-stage Docker build. Served using an Nginx web server configured with a custom router redirect fallback rule.

---

## Deployment URLs

When running the stack via Docker Compose, the services are mapped to:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
- **Backend Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## Live Deployment

- **Frontend**: https://inventory-flow-blue.vercel.app

- **Backend**: https://inventoryflow-backend-jfct.onrender.com

- **API Docs**: https://inventoryflow-backend-jfct.onrender.com/docs

- **Docker Hub**: https://hub.docker.com/r/sohambirlaa/inventoryflow-backend

- **GitHub**: https://github.com/SohamBirlaa/InventoryFlow

## Local Setup (Without Docker)

### Prerequisites
- Node.js (v18+)
- Python (v3.12+)
- PostgreSQL database running on localhost:5432

### 1. Database Setup
1. Create a PostgreSQL database named `inventory_db`.
2. Set up a user `postgres` with password `postgres` (or adjust `.env` file credentials).

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # On Windows (PowerShell):
   .venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -e .
   uv sync
   uv run uvicorn app.main:app --reload
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

### 3. Frontend Setup
1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the browser and visit [http://localhost:5173](http://localhost:5173).

---

## Docker Setup

### Prerequisites
- Docker Desktop installed and running.

### Complete Orchestration
To build and start the entire stack (Database, Backend, Frontend):
1. Navigate to the root directory containing `docker-compose.yml`.
2. Run the following command:
   ```bash
   docker compose up --build
   ```
3. Once all containers boot up:
   - Access the dashboard interface at [http://localhost:3000](http://localhost:3000).
   - Access the interactive API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

To stop the containers and keep data intact:
```bash
docker compose down
```

To stop containers and wipe the database volume:
```bash
docker compose down -v
```

> [!NOTE]
> **Tailwind CSS Build Configuration**: The frontend `.dockerignore` is configured to copy the Tailwind and Vite configs (`tailwind.config.js`, `postcss.config.js`, `vite.config.js`) into the build context. Removing these configs from `.dockerignore` is required for Tailwind to successfully compile stylesheet assets inside the Docker multi-stage container.


---

## API Endpoints Reference

### Dashboard
- `GET /dashboard/`: Get summary metrics of inventory and low-stock alerts.

### Products
- `GET /products/`: Retrieve all catalog items.
- `POST /products/`: Add a new product.
- `GET /products/{id}`: Retrieve product details.
- `PUT /products/{id}`: Update product attributes.
- `DELETE /products/{id}`: Remove product.

### Customers
- `GET /customer/`: Retrieve all customers.
- `POST /customer/`: Register new customer.
- `GET /customer/{id}`: Get customer profile.
- `DELETE /customer/{id}`: Remove customer.

### Orders
- `GET /orders/`: Retrieve past orders.
- `POST /orders/`: Submit a new order.
- `GET /orders/{id}`: Get order summary and item invoices.
- `DELETE /orders/{id}`: Cancel/delete order.
