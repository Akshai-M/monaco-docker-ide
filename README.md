# Monaco Docker IDE

A web-based code executor that combines Monaco Editor with Docker containerization to safely run Python, PySpark, Databricks, and SQL code with automatic dependency installation.

**Live Demo:** [https://monaco-docker-ide.vercel.app](https://monaco-docker-ide.vercel.app)

---

## 🚀 What This Does

Write code in a beautiful Monaco Editor, hit "Run," and your code executes inside an isolated Docker container with all dependencies auto-installed. No local setup required. No dependency management headaches.

**Supported Languages:**
- Python (with automatic pip package detection)
- PySpark (Spark-enabled execution)
- Snowflake (Snowpark support)
- Databricks (optimized environment)
- Redshift (data warehouse queries)
- BigQuery (data warehouse queries)

---

## Architecture

### Three-Layer Design

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend Layer (Next.js + React)                            │
│ • Monaco Editor for code editing                            │
│ • Language selection dropdown                               │
│ • Optional database credential config                       │
│ • Real-time output display                                  │
└────────────────┬────────────────────────────────────────────┘
                 │ axios POST /api/execute
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ API Layer (Next.js Route Handler)                           │
│ • Receives code + language selection                        │
│ • Parses imports via regex to detect dependencies           │
│ • Writes code to temp file with UUID                        │
│ • Selects appropriate Docker image                          │
│ • Executes container and captures output                    │
└────────────────┬────────────────────────────────────────────┘
                 │ docker run --rm -v tempDir:/work
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ Execution Layer (Docker Container)                          │
│ • Volume-mounted temp directory                             │
│ • Auto-installs detected pip packages                       │
│ • Executes script                                           │
│ • Captures stdout + stderr                                  │
│ • Container exits and is removed                            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Code in Monaco
    ↓
POST /api/execute (code + language)
    ↓
Parse imports → Detect packages (regex)
    ↓
Select Docker image (python:3.10-slim / bitnami/spark / etc.)
    ↓
Write code to /tmp/{uuid}/main.py
    ↓
docker run --rm -v /tmp/{uuid}:/home/jovyan/work
    ↓
pip install {packages} && python main.py
    ↓
Capture stdout/stderr → JSON response
    ↓
Display in Output Panel
```

---

## Tech Stack

### Frontend
- **Framework:** Next.js 15.3
- **UI Library:** React 19
- **Editor:** @monaco-editor/react 4.7.0
- **UI Components:** Radix UI (@radix-ui/react-select)
- **HTTP Client:** axios 1.9.0
- **Styling:** Tailwind CSS 4
- **Icons:** lucide-react

### Backend
- **Runtime:** Node.js (Next.js API Routes)
- **File I/O:** Node fs module
- **Process Execution:** child_process.exec()
- **Unique IDs:** uuid 11.1.0

### Infrastructure
- **Containerization:** Docker
- **Deployment:** Vercel (frontend + API)
- **Runtime Environments:**
  - `python:3.10-slim` (Python)
  - `bitnami/spark:latest` (PySpark)
  - `jupyter/pyspark-notebook` (Databricks)

---

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker installed and running (for code execution)
- Vercel account (optional, for deployment)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Akshai-M/monaco-docker-ide.git
   cd monaco-docker-ide
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Ensure Docker is running:**
   ```bash
   docker ps
   ```
   If this fails, start your Docker daemon.

### Build for Production

```bash
npm run build
npm run start
```

---

## How to Use

### Basic Workflow

1. **Select Language:** Choose from the dropdown (Python, PySpark, Databricks, etc.)
2. **Write Code:** Type or paste your code in the Monaco Editor
3. **Optional - Add Imports:** The system automatically detects and installs these packages
4. **Optional - Configure Database:** Check "Use Remote DB" and enter credentials if needed
5. **Run Code:** Click the "Run" button
6. **View Output:** Results appear in the Output panel below the editor

### Example: Python with Dependencies

```python
import pandas as pd
import numpy as np

data = {'name': ['Alice', 'Bob'], 'age': [25, 30]}
df = pd.DataFrame(data)
print(df)
print(f"Mean age: {df['age'].mean()}")
```

→ Backend detects `pandas` and `numpy` → Installs via pip → Executes → Shows output

### Example: PySpark

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("example").getOrCreate()
df = spark.createDataFrame([(1, "a"), (2, "b")], ["id", "val"])
df.show()
```

→ Backend selects `bitnami/spark:latest` image → Executes spark-submit → Returns results

---

## 🔧 Configuration

### Environment Variables

Currently, the application works out-of-the-box. For production deployments, consider:

- `DOCKER_HOST` — Docker daemon socket (if not running locally)
- `TEMP_DIR` — Override default temp directory (currently `/tmp` on Linux, `C:/tmp` on Windows)
- `MAX_BUFFER_SIZE` — Stdout buffer size (default: 500KB)

*Note: Update the hardcoded path in `pages/api/execute.js` line 18 if deploying on non-standard systems.*

---

## 🔍 Key Implementation Details

### Dependency Detection

The backend uses regex to extract import statements:

```javascript
const importRegex = /^(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm;
```

**How it works:**
- Scans for `import X` and `from X import Y` patterns
- Extracts the root package name (e.g., `pandas.io` → `pandas`)
- Passes to pip install

**Limitations:**
- Doesn't catch dynamic imports (`__import__()`)
- Misses conditional imports
- Doesn't handle package name mismatches (e.g., `PIL` vs `Pillow`)

**For production:** Consider using AST parsing or asking users to specify dependencies explicitly.

### Docker Execution

```javascript
const dockerCommand = `docker run --rm -v ${tempDir}:/home/jovyan/work -w /home/jovyan/work ${dockerImage} bash -c "${runCommand}"`;

exec(dockerCommand, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
  // Handle output
});
```

**Key flags:**
- `--rm` — Remove container after execution (cleanup)
- `-v ${tempDir}:/home/jovyan/work` — Mount temp directory into container
- `-w /home/jovyan/work` — Set working directory
- `maxBuffer: 1024 * 500` — Allow 500KB of output (default is 200KB)

### Error Handling

- Errors from Docker/Python are captured and cleaned (last 5 lines only)
- Server errors return 500 with error message
- User errors return 200 with error output (not a server failure)

---

## Security & Isolation

### How Code Is Isolated

1. **Container Isolation:** Each execution runs in a fresh Docker container
2. **Filesystem Isolation:** Code runs in mounted temp directory, not host filesystem
3. **Cleanup:** `--rm` flag ensures no container state persists
4. **No Persistence:** Containers are ephemeral—no data saved between runs

### Current Limitations

- **No user-to-user isolation:** If two users run code simultaneously, isolation is guaranteed by Docker, but audit trails are not logged
- **Credentials in HTTP:** Database passwords are transmitted (over HTTPS in production, but still logged)
- **No resource limits:** A runaway loop will consume resources until timeout
- **No execution timeout:** Long-running code will block indefinitely

### Production Recommendations

- Implement request timeouts (30-60 seconds)
- Add rate limiting per user
- Use secrets management for database credentials (not HTTP fields)
- Log all executions for audit trails
- Implement resource limits in Docker (`--memory`, `--cpus`)
- Consider serverless containers (AWS Lambda, Google Cloud Functions) for better isolation

---

## Known Issues & Limitations

| Issue | Severity | Workaround |
|-------|----------|-----------|
| Dependency detection misses dynamic imports | Medium | Manually specify imports in comments |
| Container startup takes 2-5 seconds | High | Pre-pull images, use serverless containers |
| Database credentials not integrated | Medium | Manual SQL in code or environment variables |
| No output streaming (full buffering) | Low | Use smaller scripts or upgrade to WebSockets |
| Hardcoded temp path (Windows vs Linux) | Medium | Update `pages/api/execute.js` line 18 |
| No execution timeout | High | Add timeout logic to handler |

---

## 📊 Performance Characteristics

- **Cold start:** 2-5 seconds (Docker image pull + container spin-up)
- **Warm execution:** 500ms - 2s (container start + pip install + execution)
- **Output buffer:** 500KB max
- **Typical script:** 1-10 seconds end-to-end

---

## 🚀 Deployment

### Deploy to Vercel (Recommended for Frontend)

```bash
vercel deploy
```

Frontend deploys instantly. Backend executes locally.

### Deploy Backend Separately

Since Docker execution requires a host machine:

1. **Option A:** Keep backend on local machine with ngrok tunnel
   ```bash
   npx ngrok http 3000
   ```

2. **Option B:** Deploy to a VPS with Docker installed (DigitalOcean, AWS EC2, etc.)
   - Install Node.js and Docker
   - Clone repo
   - Run `npm install && npm run start`

3. **Option C:** Use Docker Desktop with WSL2 (Windows) for local testing

**Note:** The demo at [vercel.app](https://monaco-docker-ide.vercel.app) has backend running locally (may not be available during downtime).

---

## Roadmap & Future Enhancements

### Short Term
- [ ] Integrate database connections (Databricks, Snowflake, Redshift)
- [ ] Add execution timeout (30-60 seconds)
- [ ] Improve dependency detection (AST parsing)
- [ ] Add syntax error highlighting for unsupported code

### Medium Term
- [ ] Output streaming (WebSockets/SSE)
- [ ] Code execution history/bookmarking
- [ ] Environment variable management UI
- [ ] Multi-file project support
- [ ] Debugging with breakpoints

### Long Term
- [ ] Real-time collaborative editing
- [ ] Custom Docker image support
- [ ] Notebook-style cell execution
- [ ] Results caching
- [ ] API access for programmatic execution

---

## 🤝 Contributing

Contributions welcome! Areas needing help:

- Dependency detection improvements
- Database integration
- Performance optimization
- UI/UX enhancements
- Documentation
- Bug reports

### To Contribute

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add your feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## Learning Resources

- [Monaco Editor Docs](https://microsoft.github.io/monaco-editor/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js child_process](https://nodejs.org/api/child_process.html)

---

## License

This project is open source. Feel free to use, modify, and distribute.

---

## Related Articles

- **Medium Post:** [Building an Embedded Code Executor: Why Monaco Alone Isn't Enough](link-to-medium-post)
- **GitHub Discussions:** [Ask questions and share ideas](https://github.com/Akshai-M/monaco-docker-ide/discussions)

---

## Support & Questions

- **GitHub Issues:** [Report bugs](https://github.com/Akshai-M/monaco-docker-ide/issues)
- **Discussions:** [Ask questions](https://github.com/Akshai-M/monaco-docker-ide/discussions)
- **Twitter:** [@Akshai-M](https://twitter.com/your-handle) (optional)

---

## Acknowledgments

- Monaco Editor team for the fantastic editor component
- Next.js team for the excellent framework
- Docker for containerization
- All contributors and users providing feedback

  
