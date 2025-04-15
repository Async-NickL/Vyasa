import React, { useState } from "react";
import axios from "axios";
import Loader from "../utils/Loader";
import DOMPurify from "dompurify";
import apiConfig from "../../config/api";

const RoadmapGenerator = () => {
  const [topic, setTopic] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setLoading(true);
    setError(null);
    setRoadmap(null);

    try {
      const response = await axios.post(
        apiConfig.ROADMAP_API,
        {
          topic: topic.trim(),
        }
      );

      setRoadmap(response.data);
    } catch (err) {
      console.error("Error generating roadmap:", err);
      setError(
        err.response?.data?.error ||
          "Failed to generate roadmap. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const parseMarkdown = (markdown) => {
    if (!markdown) return "";

    let html = markdown
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")

      // Bold
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/__(.*?)__/gim, "<strong>$1</strong>")

      // Italic
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      .replace(/_(.*?)_/gim, "<em>$1</em>")

      // Code blocks with language highlighting
      .replace(
        /```(.*?)\n([\s\S]*?)```/gim,
        '<pre><code class="language-$1">$2</code></pre>'
      )

      // Inline code
      .replace(/`(.*?)`/gim, "<code>$1</code>")

      // Lists
      .replace(/^\* (.*$)/gim, "<ul><li>$1</li></ul>")
      .replace(/^\- (.*$)/gim, "<ul><li>$1</li></ul>")
      .replace(/^\+ (.*$)/gim, "<ul><li>$1</li></ul>")
      .replace(/^\d+\. (.*$)/gim, "<ol><li>$1</li></ol>")

      // Links - highlight with light blue
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/gim,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline;">$1</a>'
      )

      // Images
      .replace(
        /!\[([^\]]+)\]\(([^)]+)\)/gim,
        '<img src="$2" alt="$1" class="max-w-full h-auto" />'
      )

      // Blockquotes
      .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>")

      // Paragraphs - wrap lines that aren't already handled
      .replace(/^(?!<[a-z])(.*$)/gim, "<p>$1</p>");

    // Fix nested lists issue
    html = html.replace(/<\/ul>\s*<ul>/g, "");
    html = html.replace(/<\/ol>\s*<ol>/g, "");

    // Add line breaks for new lines
    html = html.replace(/\n/g, "<br />");

    // Highlight resource sections with light blue background
    html = html.replace(
      /<h2>(Online Courses|Tutorials|Books|YouTube|Community|Resources|Free Resources)<\/h2>/gi,
      '<h2 style="color: #93c5fd;">$1</h2>'
    );

    return html;
  };

  const renderMarkdown = (content) => {
    // First parse the markdown to HTML
    const html = parseMarkdown(content);
    // Then sanitize the HTML
    const sanitizedHTML = DOMPurify.sanitize(html, {
      ADD_TAGS: ["h1", "h2", "h3", "ul", "ol", "li", "code", "pre", "a"],
      ADD_ATTR: ["class", "target", "rel", "href", "style"],
    });

    return { __html: sanitizedHTML };
  };

  const handlePrintPDF = () => {
    const printContent = document.createElement("div");
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="text-align: center; margin-bottom: 20px;">${roadmap.topic} Learning Roadmap</h1>
        
        <div style="margin-bottom: 30px;">
          <h2>Overview</h2>
          ${parseMarkdown(roadmap.overview)}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2>Learning Stages</h2>
          ${parseMarkdown(roadmap.learning_stages)}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #60a5fa;">Recommended Resources</h2>
          ${parseMarkdown(roadmap.recommended_resources)}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2>Learning Projects</h2>
          ${parseMarkdown(roadmap.learning_projects)}
        </div>
        
        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 12px; font-size: 12px; color: #999;">
          Generated via Learning Roadmap Generator
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
            Learning Roadmap Generator
          </h1>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative w-full mb-6 flex gap-5">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic you want to learn (e.g., MERN Stack, Machine Learning, Python)"
                className="w-full p-4 pr-24 rounded-lg bg-black/40 backdrop-blur-md border border-white/30 text-white/80 placeholder-white/50 focus:outline-none focus:border-purple-500/70"
              />
              <button type="submit" className="button" disabled={loading}>
                <span>Generate</span>
              </button>
            </div>
          </form>
        </div>
        {error && (
          <div className="w-full p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 mb-6">
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="p-6 bg-black/60 rounded-lg border border-white/20 flex flex-col items-center">
            <Loader />
            <p className="text-white/80 mt-4">
              Generating your learning roadmap...
            </p>
          </div>
        </div>
      )}

      {roadmap && !loading && (
        <div className="w-full max-w-[90vw] max-h-[80vh] overflow-y-scroll overflow-hidden mb-7 rounded-lg bg-black/40 backdrop-blur-md p-6 border border-neutral-500 text-white/80 custom-scrollbar relative">
          <div className="relative z-10">
            <div className="absolute inset-0 -z-10 ">
              <div className="absolute w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[80px] -top-[150px] -right-[150px]"></div>
              <div className="absolute w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-[80px] bottom-[10%] left-[20%]"></div>
              <div className="absolute w-[300px] h-[300px] bg-cyan-300/20 rounded-full blur-[60px] top-[30%] -left-[50px]"></div>
              <div className="absolute w-[350px] h-[350px] bg-pink-400/15 rounded-full blur-[70px] bottom-[20%] -right-[100px]"></div>
              <div className="absolute w-[250px] h-[250px] bg-emerald-400/15 rounded-full blur-[50px] top-[40%] left-[30%]"></div>
            </div>

            <h2 className="font-extrabold text-3xl text-white/90 mb-6">
              {roadmap.topic} Learning Roadmap
            </h2>

            {/* Overview Section */}
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-white/90 mb-4 border-b border-white/20 pb-2">
                Overview
              </h3>
              <div
                className="prose prose-invert prose-headings:text-white/90 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-blue-400 prose-strong:text-white/90 prose-code:text-pink-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/20 max-w-none"
                dangerouslySetInnerHTML={renderMarkdown(roadmap.overview)}
              />
            </div>

            {/* Learning Stages Section */}
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-white/90 mb-4 border-b border-white/20 pb-2">
                Learning Stages
              </h3>
              <div
                className="prose prose-invert prose-headings:text-white/90 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-blue-400 prose-strong:text-white/90 prose-code:text-pink-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/20 max-w-none"
                dangerouslySetInnerHTML={renderMarkdown(
                  roadmap.learning_stages
                )}
              />
            </div>

            {/* Recommended Resources Section */}
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-blue-300 mb-4 border-b border-blue-300/30 pb-2">
                Recommended Resources
              </h3>
              <div
                className="prose prose-invert prose-headings:text-white/90 prose-h1:text-2xl prose-h2:text-blue-300 prose-h3:text-lg prose-a:text-blue-400 prose-strong:text-white/90 prose-code:text-pink-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/20 max-w-none"
                dangerouslySetInnerHTML={renderMarkdown(
                  roadmap.recommended_resources
                )}
              />
            </div>

            {/* Learning Projects Section */}
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-white/90 mb-4 border-b border-white/20 pb-2">
                Learning Projects
              </h3>
              <div
                className="prose prose-invert prose-headings:text-white/90 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-blue-400 prose-strong:text-white/90 prose-code:text-pink-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/20 max-w-none"
                dangerouslySetInnerHTML={renderMarkdown(
                  roadmap.learning_projects
                )}
              />
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
    </div>
  );
};

export default RoadmapGenerator;
