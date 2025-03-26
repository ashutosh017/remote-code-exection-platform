import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { createClient } from "redis";

const client = createClient();
const CODE_DIR = "/tmp/code_submissions"; 

if (!fs.existsSync(CODE_DIR)) {
  fs.mkdirSync(CODE_DIR, { recursive: true });
}

function runUserCodeInContainer(code, language, problemId) {
  const fileExtension =
    language === "python"
      ? "py"
      : language === "cpp"
      ? "cpp"
      : language === "javascript"
      ? "js"
      : "txt";
  const filePath = path.join(CODE_DIR, `${problemId}.${fileExtension}`);

  fs.writeFileSync(filePath, code);

  const dockerCommand = `
  sudo docker run --rm \
  -v ${CODE_DIR}:/code \
  ${language === "python" ? "python:3.10" : language==="cpp"?"gcc:latest" :"node"} \
  bash -c "cd /code && ${getExecutionCommand(language, problemId)}"
`;

  console.log("Executing:", dockerCommand);

  exec(dockerCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`Output:\n${stdout}`);
  });
}

function getExecutionCommand(language, problemId) {
  switch (language) {
    case "python":
      return `python3 ${problemId}.py`;
    case "cpp":
      return `g++ -o ${problemId} ${problemId}.cpp && ./${problemId}`;
    case "javascript":
      return `node ${problemId}.js`
    default:
      return `cat ${problemId}.txt`;
  }
}

async function processSubmission(submission) {
  const { problemId, code, language } = JSON.parse(submission);
  console.log("Processing submission for problem ID:", problemId);
  runUserCodeInContainer(code, language, problemId);
}

async function startServer() {
  try {
    await client.connect();
    console.log("Connected to Redis successfully!");
    while (true) {
      try {
        const submission = await client.brPop("problems", 0);
        await processSubmission(submission.element);
      } catch (error) {
        console.log("Error processing submission:", error);
      }
    }
  } catch (error) {
    console.log("Failed to connect to Redis:", error);
  }
}

startServer();
