import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { createClient } from "redis";

const client = createClient();
const CODE_DIR = "/tmp/code_submissions"; 

if (!fs.existsSync(CODE_DIR)) {
  fs.mkdirSync(CODE_DIR, { recursive: true });
}

async function runUserCodeInContainer(code, language, problemId) {
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

  const res = await runDockerCommand(dockerCommand)
  return res;
}
function runDockerCommand(dockerCommand) {
  return new Promise((resolve, reject) => {
    exec(dockerCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Execution error: ${error.message}`);
        return reject(error.message);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return reject(stderr);
      }
      console.log(`Output:\n${stdout}`);
      resolve(stdout);
    });
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
  const res = runUserCodeInContainer(code, language, problemId);
  return res;
}

async function startServer() {
  try {
    await client.connect();
    console.log("Connected to Redis successfully!");
    while (true) {
      try {
        const submission = await client.brPop("problems", 0);
        const res = await processSubmission(submission.element);
        console.log("res: ",res)
        
       client.publish("submission",JSON.stringify(res))
      } catch (error) {
        console.log("Error processing submission:", error);
      }
    }
  } catch (error) {
    console.log("Failed to connect to Redis:", error);
  }
}

startServer();
