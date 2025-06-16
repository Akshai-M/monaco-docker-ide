import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'Code and language are required' });
  }

  const id = uuidv4();
  const tempDir = path.join('C:/tmp', id); // On Linux: use /tmp

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    const filename = 'main.py';
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, code);

    let dockerImage;
    let runCommand;

    if (language === 'python') {
      dockerImage = 'python:3.10-slim';

      const importRegex = /^(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm;
      const packages = [];
      let match;
      while ((match = importRegex.exec(code)) !== null) {
        const pkg = match[1] || match[2];
        if (pkg && !pkg.startsWith('.')) packages.push(pkg.split('.')[0]);
      }

      const pipInstall = packages.length ? `pip install ${packages.join(' ')} > /dev/null 2>&1 && ` : '';
      runCommand = `${pipInstall}python ${filename}`;

    } else if (language === 'pyspark') {
      dockerImage = 'bitnami/spark:latest';
      runCommand = `spark-submit ${filename}`;

    } else if (language === 'databricks') {
      dockerImage = 'jupyter/pyspark-notebook';
      runCommand = `spark-submit ${filename}`;

    } else {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    const dockerCommand = `docker run --rm -v ${tempDir}:/home/jovyan/work -w /home/jovyan/work ${dockerImage} bash -c "${runCommand}"`;

    exec(dockerCommand, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
      fs.rmSync(tempDir, { recursive: true, force: true });

      if (error) {
        const cleanError = stderr.trim().split('\n').slice(-5).join('\n');
        return res.status(200).json({ error: cleanError });
      }

      const cleanOutput = stdout.trim();
      return res.status(200).json({ output: cleanOutput });
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error: ' + err.message });
  }
}
