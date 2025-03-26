"use client"

import { useState } from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, TerminalSquare, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Language = "javascript" | "python" | "cpp"

interface OutputEntry {
  timestamp: string
  content: string
  status: "success" | "error"
}

export default function CodeEditorPage() {
  const [code, setCode] = useState<string>("")
  const [language, setLanguage] = useState<Language>("javascript")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [output, setOutput] = useState<OutputEntry[]>([])
  const { toast } = useToast()

  const languageDefaults = {
    javascript: "// Write your JavaScript code here\nconsole.log('Hello, world!');",
    python: "# Write your Python code here\nprint('Hello, world!')",
    cpp: '// Write your C++ code here\n#include <iostream>\n\nint main() {\n  std::cout << "Hello, world!" << std::endl;\n  return 0;\n}',
  }

  const handleLanguageChange = (value: Language) => {
    setLanguage(value)
    setCode(languageDefaults[value])
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value)
    }
  }

  const formatTimestamp = () => {
    const now = new Date()
    return `${now.toLocaleTimeString()}`
  }

  const clearOutput = () => {
    setOutput([])
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch("http://localhost:3000/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problemId:"69",
          code,
          language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status}`)
      }

      // Add the new output to the output array
      setOutput((prev) => [
        ...prev,
        {
          timestamp: formatTimestamp(),
          content: data.output || JSON.stringify(data, null, 2),
          status: "success",
        },
      ])

      toast({
        title: "Code executed successfully",
        description: "Your code has been processed by the server.",
      })
    } catch (error) {
      console.error("Error submitting code:", error)

      // Add error to output
      setOutput((prev) => [
        ...prev,
        {
          timestamp: formatTimestamp(),
          content: error instanceof Error ? error.message : "Failed to connect to server",
          status: "error",
        },
      ])

      toast({
        title: "Execution failed",
        description: "There was an error processing your code",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Code Editor</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <div className="mb-4">
            <Select value={language} onValueChange={(value) => handleLanguageChange(value as Language)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md overflow-hidden mb-4 flex-grow">
            <Editor
              height="500px"
              language={language}
              value={code || languageDefaults[language]}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              "Run Code"
            )}
          </Button>
        </div>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-medium flex items-center">
              <TerminalSquare className="mr-2 h-4 w-4" />
              Output
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearOutput} disabled={output.length === 0}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Clear output</span>
            </Button>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="bg-black text-white font-mono text-sm p-4 rounded-md h-[500px] overflow-y-auto">
              {output.length === 0 ? (
                <div className="text-gray-500 italic">Run your code to see output here</div>
              ) : (
                output.map((entry, index) => (
                  <div key={index} className="mb-2">
                    <span className="text-gray-500">[{entry.timestamp}] </span>
                    <span className={entry.status === "error" ? "text-red-400" : "text-green-400"}>
                      {entry.status === "error" ? "ERROR: " : ""}
                    </span>
                    <span className="whitespace-pre-wrap">{entry.content}</span>
                  </div>
                ))
              )}
              {isSubmitting && (
                <div className="flex items-center text-yellow-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing code...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

