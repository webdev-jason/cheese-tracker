# 🧀 Cheese Tracker

### 📋 Overview
**Cheese Tracker** is a full-stack traceability application designed for cheese manufacturing. It tracks the lifecycle of raw ingredients (milk, salt, cultures) as they are transformed into production runs and serialized finished products.
The goal is to ensure 100% traceability for audits and recalls. If a specific lot of salt is contaminated, this system can instantly identify every block of cheese containing that salt.

### ✨ Key Features
* **📦 Inventory Tracking:** Logs incoming raw materials with Lot Codes and Quantities.
* **🏭 Production Runs:** specific "Make Days" or Vats.
* **🔗 Granular Traceability:** Links specific ingredient lots to specific production runs.
* **🏷️ Serialization:** Assigns unique serial numbers to every finished 40lb block.
* **🛡️ Data Integrity:** Uses SQL Foreign Keys to prevent orphaned data (e.g., cannot delete milk if it was used in a cheese block).

### 🧠 How It Works
1.  **The Backend:** Built on **Node.js & Express**, serving as the logic layer.
2.  **The Database:** Uses **SQLite** to store relational data.
    * *raw_materials* (Inventory)
    * *production_runs* (Batch processing)
    * *material_usage* (The link between inventory and batch)
    * *finished_blocks* (The final output)
3.  **The API:** The backend exposes REST endpoints (e.g., `GET /api/materials`) that the frontend (Dashboard) uses to read and write data.

### 🖥️ Requirements
| Component | Requirement |
| :--- | :--- |
| **Runtime** | Node.js v18+ |
| **Database** | SQLite3 (No installation required) |
| **Backend Framework** | Express.js |
| **Frontend Framework** | Vue.js (In Development) |

### 🚀 Usage
1.  Open the project in VS Code.
2.  Navigate to the server directory:
    ```bash
    cd server
    ```
3.  Install dependencies (first run only):
    ```bash
    npm install
    ```
4.  Start the Development Server:
    ```bash
    npm run dev
    ```
5.  The API will run at `http://localhost:3000`.

### 📁 API Endpoints (Current)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check to confirm server is running. |
| `GET` | `/api/materials` | Retrieve list of all raw ingredients. |
| `POST` | `/api/materials` | Add a new raw ingredient batch. |

### 🧑‍💻 Developer Notes
* **Database Auto-Init:** The server checks for the existence of `cheese_factory.db` on startup. If missing, it automatically creates the file and generates the 4 required tables.
* **Security:** SQL Injection protection is implemented using Parameterized Queries in the SQLite driver.

### 📜 License
This project is an internal automation utility. All rights reserved.

### 👤 Author
Developed by **[Your Name]** © 2025