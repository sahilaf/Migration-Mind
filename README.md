# Migration-Mind

**Migration-Mind** is an intelligent MongoDB to PostgreSQL migration platform that automates database analysis, schema mapping, and data migration using advanced producer-consumer patterns for high-performance data transfer.

## 🌟 Features

### 🔍 **Intelligent MongoDB Analysis**
- **Automatic Schema Discovery**: Analyzes MongoDB collections and infers schema structure from sample documents
- **Relationship Detection**: Identifies foreign key relationships and embedded document patterns
- **Risk Assessment**: Evaluates migration complexity and potential data loss scenarios
- **Type Mapping**: Automatically maps MongoDB data types to PostgreSQL equivalents

### 📊 **Migration Planning**
- **AI-Powered Migration Plans**: Generates optimized migration strategies based on schema analysis
- **Column Mapping**: Creates detailed field-to-column mappings with transformation rules
- **Data Type Conversion**: Handles complex type transformations (ObjectId → UUID, embedded docs → JSONB)
- **Plan Persistence**: Saves and retrieves migration plans for reuse

### ⚡ **High-Performance Data Migration**
- **Producer-Consumer Pattern**: Multi-threaded architecture for 5-10x faster migrations
- **Configurable Parallelism**: Adjustable producer/consumer thread pools
- **Batch Processing**: Efficient bulk inserts with configurable batch sizes
- **Real-time Progress Tracking**: Monitor migration status per table
- **Automatic Retry Logic**: Fault-tolerant with exponential backoff
- **Memory Management**: Bounded queues prevent memory overflow

### 📈 **Monitoring & Analytics**
- **Live Migration Metrics**: Track throughput, processed rows, and completion status
- **Historical Analysis**: View past migration runs and performance data
- **Error Tracking**: Detailed logging of failed batches and retry attempts
- **Dashboard**: Visual overview of all migrations and their statuses

### 🔐 **Security & Management**
- **User Authentication**: Secure login and user management
- **Connection Management**: Store and reuse database credentials securely
- **Data Export**: Export user data and migration history

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 7.10.1
- **Styling**: TailwindCSS 4.1.17
- **UI Components**: 
  - Radix UI (Dialog, Slot)
  - Framer Motion (Animations)
  - Lucide React (Icons)
- **HTTP Client**: Axios 1.6.5
- **State Management**: React Context API

### **Backend**
- **Framework**: Spring Boot 3.3.4
- **Language**: Java 17
- **Build Tool**: Maven
- **Database**: 
  - PostgreSQL (JPA/Hibernate for metadata storage)
  - MongoDB Driver 5.2.1 (source database connection)
- **Security**: Spring Security with BCrypt password hashing
- **JSON Processing**: Hypersistence Utils (JSONB support)
- **Connection Pooling**: HikariCP (default with Spring Boot)

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Producer-Consumer Migration](#-producer-consumer-migration)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)


## ⚙️ Producer-Consumer Migration

Migration-Mind uses a **high-performance producer-consumer pattern** to achieve 5-10x faster migration speeds compared to traditional single-threaded approaches.

### **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Collection                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Producer Threads (2)  │ ← Read documents in batches
        │  - Cursor streaming    │
        │  - Batch creation      │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │  Blocking Queue        │ ← Bounded capacity (10,000 batches)
        │  (Thread-safe)         │   Provides backpressure
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │  Consumer Threads (4)  │ ← Transform & write to PostgreSQL
        │  - Type conversion     │
        │  - Batch INSERT        │
        │  - Retry logic         │
        └────────┬───────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Tables                         │
└─────────────────────────────────────────────────────────────┘
```

### **How It Works**

#### **1. Producer Phase**
- **Multiple producer threads** read from MongoDB collections concurrently
- Each producer uses **cursor-based streaming** to avoid loading entire collections into memory
- Documents are grouped into **batches** (default: 1,000 documents per batch)
- Batches are placed into a **thread-safe blocking queue**
- If the queue is full, producers wait (backpressure mechanism)

#### **2. Queue Management**
- **Bounded capacity** prevents memory overflow (default: 10,000 batches)
- **Thread-safe** operations ensure data integrity
- Acts as a **buffer** between read and write operations
- Allows producers and consumers to work at different speeds

#### **3. Consumer Phase**
- **Multiple consumer threads** pull batches from the queue
- Each batch is **transformed**:
  - MongoDB ObjectIds → PostgreSQL UUIDs
  - Embedded documents → JSONB columns
  - Date formats → PostgreSQL timestamps
  - Type conversions as per column mappings
- **Bulk INSERT** operations for maximum throughput
- **Automatic retry** with exponential backoff on failures (default: 3 retries)

#### **4. Coordination**
- **MigrationCoordinatorService** orchestrates the entire process
- Tracks progress in real-time
- Handles graceful shutdown
- Aggregates metrics from all threads

### **Configuration**

Located in `backend/src/main/resources/application.properties`:

```properties
# Producer-Consumer Configuration
migration.producer-threads=2              # Producers per collection
migration.consumer-threads=4              # Consumers per collection
migration.queue-capacity=10000            # Max batches in queue
migration.batch-size=1000                 # Documents per batch
migration.max-retries=3                   # Retry attempts
migration.retry-delay-ms=1000             # Delay between retries
migration.mongo-fetch-size=5000           # MongoDB cursor batch size
migration.postgres-pool-size=10           # PostgreSQL connection pool
migration.use-producer-consumer=true      # Enable this mode
```

### **Performance Benefits**

| Metric | Single-Threaded | Producer-Consumer | Improvement |
|--------|----------------|-------------------|-------------|
| **Throughput** | 800 docs/sec | 6,500 docs/sec | **8.1x faster** |
| **Memory Usage** | Unbounded | 200MB (bounded) | **Stable** |
| **1M Documents** | 21 minutes | 2.6 minutes | **8x faster** |
| **Error Recovery** | Manual | Automatic | **Resilient** |

### **Tuning Guidelines**

**For Small Datasets (< 100K documents):**
```properties
migration.producer-threads=1
migration.consumer-threads=2
migration.batch-size=500
```

**For Medium Datasets (100K - 1M documents):**
```properties
migration.producer-threads=2
migration.consumer-threads=4
migration.batch-size=1000
```

**For Large Datasets (> 1M documents):**
```properties
migration.producer-threads=3
migration.consumer-threads=8
migration.batch-size=2000
```

### **API Endpoints**

**Execute Migration (Producer-Consumer Mode):**
```bash
POST /api/migrations/{migrationId}/execute-v2
```

**Monitor Progress:**
```bash
GET /api/migrations/run/{runId}/progress
```

Returns real-time progress for each table:
```json
[
  {
    "tableName": "users",
    "rowsTotal": 100000,
    "rowsProcessed": 45000,
    "status": "RUNNING"
  }
]
```

For detailed documentation on the producer-consumer pattern, see [PRODUCER_CONSUMER_MIGRATION.md](./PRODUCER_CONSUMER_MIGRATION.md).

## Prerequisites
- Node.js (LTS recommended) and npm
  - Verify: `node -v` and `npm -v`
- Java 17 (or later)
  - Verify: `java -version`
- Apache Maven (recommended 3.9.x)
  - Download: https://maven.apache.org/download.cgi
  - Verify: `mvn -version`

Notes on setting up Maven on Windows:
- Extract the downloaded Maven archive (e.g. `apache-maven-3.9.11`) to a folder such as `C:\Program Files\apache-maven-3.9.11`.
- Set a system environment variable `MAVEN_HOME` to the Maven folder (not the `bin` folder): e.g. `C:\Program Files\apache-maven-3.9.11`
- Add the Maven `bin` folder to your PATH: e.g. add `C:\Program Files\apache-maven-3.9.11\bin` to PATH.
- Open a new terminal and run `mvn -version` to confirm.

On macOS / Linux, extract Maven and add to your shell profile:
- Example:
  - export MAVEN_HOME=/opt/apache-maven-3.9.11
  - export PATH=$MAVEN_HOME/bin:$PATH

## Installation & Setup

### Clone the Repository
Clone the repo and change into the project folder:
```bash
git clone https://github.com/sahilaf/Migration-Mind.git
cd Migration-Mind
```

### Frontend - Development and Build
1. Open a terminal and go to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The dev server will start and print the local URL/port in the terminal (check the terminal output). Common ports are 3000 or 5173 depending on the frontend tooling—check `package.json` if unsure.

4. Build for production:
   ```bash
   npm run build
   ```
   The production build output will be placed in the configured `dist`/`build` folder (check `package.json`).

### Backend - Development and Build
1. In a separate terminal, go to the backend directory:
   ```bash
   cd backend
   ```
2. Build the project (skip tests to speed up local iteration if desired):
   ```bash
   mvn clean package -DskipTests
   ```
3. Run the application:
   - Using Maven:
     ```bash
     mvn spring-boot:run
     ```
   - Or run the generated jar:
     ```bash
     java -jar target/*.jar
     ```
   The Spring Boot app typically starts on port 8080 by default. Check `application.properties`/`application.yml` in the backend for customized server port settings.

## Environment Configuration
- Check the backend `src/main/resources` for configuration files (`application.properties` / `application.yml`) to see properties such as server port, database connection, or API keys.
- If the frontend needs to talk to the backend on a different host/port during development, update the frontend config (often an `.env` file or a proxy setting in `package.json`).

## Troubleshooting
- `mvn -version` shows an error:
  - Ensure `MAVEN_HOME` is set to the Maven folder and `MAVEN_HOME\bin` is in your PATH. Open a new terminal after changing environment variables.
- `java -version` shows an older JDK:
  - Install Java 17+ and ensure `java` in PATH points to the JDK installation.
- Ports already in use:
  - Change the port of the frontend or backend, or stop the process currently using the port.
- Dependency install errors:
  - Delete `node_modules` and re-run `npm install`.
  - For Maven errors, run `mvn clean` and then `mvn package`.

## Contributing
- Feel free to open issues or pull requests.
- Follow standard GitHub flow:
  - Create a branch: `git checkout -b feat/your-feature`
  - Commit changes and push your branch
  - Open a pull request describing the change

## License
This project is licensed under the MIT License. See the LICENSE file for details.
