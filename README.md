# Migration-Mind
# New version testing

Migration-Mind is a web application with a frontend and a Java Spring Boot backend. This README explains how to prepare your machine, run the application in development, and build for production.

## Table of contents
- [Prerequisites](#prerequisites)
- [Clone the repository](#clone-the-repository)
- [Frontend - development and build](#frontend---development-and-build)
- [Backend - development and build](#backend---development-and-build)
- [Environment variables & ports](#environment-variables--ports)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

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

## Clone the repository
Clone the repo and change into the project folder:
```bash
git clone https://github.com/sahilaf/Migration-Mind.git
cd Migration-Mind
```

## Frontend - development and build
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

## Backend - development and build
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

## Environment variables & configuration
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
- Add your project license here (e.g., MIT). If there is no license yet, add one to clarify usage and contribution rights.

---
If you want, I can:
- Open a pull request with this updated README.md (tell me the target branch), or
- Create a branch and push the change for you.
