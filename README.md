# Milely

Frontend setup instructions for the current React/Vite app.

## Run the Frontend

### Windows

1. Open PowerShell in the project root.
2. Move into the frontend folder:

```powershell
cd front-end
```

3. Install dependencies:

```powershell
npm install
```

4. Start the development server:

```powershell
npm run dev
```

5. Open the local URL shown in the terminal.

### macOS

1. Open Terminal in the project root.
2. Move into the frontend folder:

```bash
cd front-end
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open the local URL shown in the terminal.

## Build the Frontend

From the `front-end` folder on either Windows or macOS:

```bash
npm run build
```

## Run the Backend

The backend must be running alongside the frontend for full functionality. Open a **separate terminal** and follow these steps.

### Windows

1. Open PowerShell in the project root.
2. Move into the backend folder:

```powershell
cd back-end
```

3. Install dependencies:

```powershell
npm install
```

4. Start the backend server:

```powershell
npm start
```

5. The API will be available at `http://localhost:3000`.

### macOS

1. Open Terminal in the project root.
2. Move into the backend folder:

```bash
cd back-end
```

3. Install dependencies:

```bash
npm install
```

4. Start the backend server:

```bash
npm start
```

5. The API will be available at `http://localhost:3000`.

> **Note:** The frontend dev server and backend server must both be running at the same time. Start each in its own terminal window.

## Run Backend Tests

From the `back-end` folder:

```bash
npm test
```

This runs all Mocha/Chai unit tests and reports code coverage via c8.
