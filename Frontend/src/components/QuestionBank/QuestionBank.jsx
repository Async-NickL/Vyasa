import React, { useState } from "react";
import axios from "axios";
import Loader from "../utils/Loader";
import DOMPurify from "dompurify";
import apiConfig from "../../config/api";

const QuestionBank = () => {
  const [fileData, setFileData] = useState(null);
  const [questions, setQuestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseMarkdown = (markdown) => {
    if (!markdown) return "";

    let html = markdown
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/__(.*?)__/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      .replace(/_(.*?)_/gim, "<em>$1</em>")
      .replace(
        /```(.*?)\n([\s\S]*?)```/gim,
        '<pre><code class="language-$1">$2</code></pre>'
      )
      .replace(/`(.*?)`/gim, "<code>$1</code>")
      .replace(/^\* (.*$)/gim, "<ul><li>$1</li></ul>")
      .replace(/^\- (.*$)/gim, "<ul><li>$1</li></ul>")
      .replace(/^\+ (.*$)/gim, "<ul><li>$1</li></ul>")
      .replace(/^\d+\. (.*$)/gim, "<ol><li>$1</li></ol>")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/gim,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline;">$1</a>'
      )
      .replace(
        /!\[([^\]]+)\]\(([^)]+)\)/gim,
        '<img src="$2" alt="$1" class="max-w-full h-auto" />'
      )
      .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>")
      .replace(/^(?!<[a-z])(.*$)/gim, "<p>$1</p>");

    html = html.replace(/<\/ul>\s*<ul>/g, "");
    html = html.replace(/<\/ol>\s*<ol>/g, "");
    html = html.replace(/\n/g, "<br />");

    return html;
  };

  const renderMarkdown = (content) => {
    const html = parseMarkdown(content);
    const sanitizedHTML = DOMPurify.sanitize(html, {
      ADD_TAGS: ["h1", "h2", "h3", "ul", "ol", "li", "code", "pre", "a"],
      ADD_ATTR: ["class", "target", "rel", "href", "style"],
    });

    return { __html: sanitizedHTML };
  };

  const handleFileUpload = (file) => {
    setFileData(file);
  };

  const removeFile = () => {
    setFileData(null);
    setQuestions("");
    setError(null);
  };

  const generateQuestions = async () => {
    if (!fileData) {
      setError("Please upload a document first");
      return;
    }

    setLoading(true);
    setError(null);
    setQuestions("");

    const formData = new FormData();
    formData.append("file", fileData);

    try {
      const response = await axios.post(
        apiConfig.QUESTIONS_API,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.questions) {
        setQuestions(response.data.questions);
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err) {
      console.error("Error generating questions:", err);
      setError(
        err.response?.data?.error ||
          "Failed to generate questions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = () => {
    const printContent = document.createElement("div");
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="font-size: 24px; color: #333;">Question Bank</h1>
        <div style="margin-bottom: 20px; font-style: italic; color: #666;">
          Generated from: ${fileData ? fileData.name : "Unknown file"}
        </div>
        <div>${parseMarkdown(questions)}</div>
        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 12px; font-size: 12px; color: #999;">
          Generated via Question Bank Generator
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-container, #print-container * {
          visibility: visible;
        }
        #print-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          size: auto;
          margin: 20mm;
        }
        h1, h2, h3 { color: #333; }
        a { color: #0066cc !important; text-decoration: underline !important; }
      }
    `;

    printContent.id = "print-container";
    printContent.appendChild(style);

    document.body.appendChild(printContent);
    window.print();
    document.body.removeChild(printContent);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen w-full pt-24 px-4">
      <div className="w-full max-w-3xl mb-8">
        <div className="w-full max-w-[90vw] max-h-[85vh] overflow-y-scroll overflow-hidden mb-10 rounded-lg bg-black/40 backdrop-blur-md p-6 border border-neutral-500 text-white/80 custom-scrollbar relative">
          <h1 className="text-3xl font-bold text-white/90 mb-6 text-center">
            Question Bank Generator
          </h1>
          <div className="w-full p-6 rounded-lg border border-dashed border-white/30 relative flex flex-col items-center justify-center cursor-pointer">
            {fileData ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center">
                  {fileData.type.includes("pdf") ? (
                    <svg
                      className="w-12 h-12 text-white/80"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  ) : fileData.type.includes("word") ? (
                    <svg
                      className="w-12 h-12 text-white/80"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  ) : fileData.type.includes("sheet") ? (
                    <svg
                      className="w-12 h-12 text-white/80"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-12 h-12 text-white/80"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}
                  <p className="text-lg font-medium text-white/80 mt-2 break-all text-center">
                    {fileData.name}
                  </p>
                  <p className="text-sm text-white/50">
                    {fileData.size
                      ? (fileData.size / 1024 / 1024).toFixed(2) + " MB"
                      : ""}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={removeFile}
                    className="button whitespace-nowrap"
                  >
                    <span>Remove</span>
                  </button>
                  <button
                    onClick={generateQuestions}
                    className="button whitespace-nowrap"
                    disabled={loading}
                  >
                    <span>Generate Questions</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-lg font-medium text-white/80 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-white/50">
                    PDF, DOC, DOCX, XLS, XLSX or TXT (Max 30MB)
                  </p>
                </div>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.txt"
                />
              </>
            )}

            {error && (
              <div className="mt-4 p-2 bg-red-500/20 border border-red-500/50 text-red-200 rounded-md w-full max-w-md text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Questions Display Section */}
      {questions && (
        <div className="w-full max-w-[90vw] max-h-[80vh] overflow-y-scroll overflow-hidden mb-4 rounded-lg bg-black/40 backdrop-blur-md p-6 border border-neutral-500 text-white/80 custom-scrollbar relative">
          <div
            className="relative before:absolute before:w-96 before:h-30 before:right-15 before:bg-rose-300/60 before:-z-10 before:rounded-full before:blur-3xl before:-top-20 z-10 
                      after:absolute after:w-64 after:h-24 after:bg-purple-400/50 after:-z-10 after:rounded-full after:-bottom-10 after:blur-2xl after:-rotate-12 after:-right-6"
          >
            <div className="absolute inset-0 -z-10 ">
              <div className="absolute w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[80px] -top-[150px] -right-[150px]"></div>
              <div className="absolute w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-[80px] bottom-[10%] left-[20%]"></div>
              <div className="absolute w-[300px] h-[300px] bg-cyan-300/20 rounded-full blur-[60px] top-[30%] -left-[50px]"></div>
              <div className="absolute w-[350px] h-[350px] bg-pink-400/15 rounded-full blur-[70px] bottom-[20%] -right-[100px]"></div>
              <div className="absolute w-[250px] h-[250px] bg-emerald-400/15 rounded-full blur-[50px] top-[40%] left-[30%]"></div>
            </div>

            <h2 className="font-extrabold text-2xl text-white/80 mb-4">
              Generated Questions
            </h2>
            <div
              className="prose prose-invert prose-headings:text-white/90 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-blue-400 prose-strong:text-white/90 prose-code:text-pink-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/20 max-w-none overflow-auto custom-scrollbar"
            >
              <div dangerouslySetInnerHTML={renderMarkdown(questions)} />
            </div>

            {/* PDF Export Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handlePrintPDF}
                className="button flex items-center gap-2 relative z-20"
              >
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Save as PDF
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="p-6 bg-black/60 rounded-lg border border-white/20 flex flex-col items-center">
            <Loader />
            <p className="text-white/80">Generating questions...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank; 