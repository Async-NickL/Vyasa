import { React, useState, useEffect, useRef } from "react";
import axios from "axios";
import Loader from "../utils/Loader";
import DOMPurify from "dompurify";

const GetNotes = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const printRef = useRef(null);
  const [fileData, setFileData] = useState(null);
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [visualImage, setVisualImage] = useState(null);
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualError, setVisualError] = useState(null);

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

      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/gim,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
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

    return html;
  };

  const renderMarkdown = (content) => {
    // First parse the markdown to HTML
    const html = parseMarkdown(content);
    // Then sanitize the HTML
    const sanitizedHTML = DOMPurify.sanitize(html, {
      ADD_TAGS: ["h1", "h2", "h3", "ul", "ol", "li", "code", "pre"],
      ADD_ATTR: ["class", "target", "rel"],
    });

    console.log("Generated HTML:", sanitizedHTML);
    return { __html: sanitizedHTML };
  };

  const handlePrintPDF = () => {
    const printContent = document.createElement("div");
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="font-size: 24px; color: #333;">YouTube Notes</h1>
        <div style="font-style: italic; color: #666; margin-bottom: 20px;">Source: ${youtubeUrl}</div>
        <div>${parseMarkdown(notes)}</div>
        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 12px; font-size: 12px; color: #999;">
          Generated via YouTube Notes Generator
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
      }
    `;
    printContent.id = "print-container";
    printContent.appendChild(style);
    document.body.appendChild(printContent);
    window.print();
    document.body.removeChild(printContent);
  };

  const fetchNotes = async () => {
    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }
    setLoading(true);
    setError(null);
    setNotes("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/generate-notes",
        {
          youtube_url: youtubeUrl,
        }
      );

      if (response.data.notes) {
        setNotes(response.data.notes);
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError(
        err.response?.data?.error ||
          "Failed to generate notes. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const generateVisual = async () => {
    if (!notes) {
      setVisualError("Generate notes first before creating a visual");
      return;
    }

    setVisualLoading(true);
    setVisualError(null);
    setVisualImage(null);

    try {
      let notesContent = notes.substring(0, 500);
      const headingMatch = notes.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
      if (headingMatch && headingMatch[1]) {
        notesContent = headingMatch[1] + " - " + notesContent;
      }

      const response = await axios.post('http://localhost:5000/api/generate-visual', {
        notes_content: notesContent
      });

      if (response.data && response.data.success) {
        setVisualImage({
          data: response.data.image_data,
          mimeType: response.data.mime_type
        });
      } else {
        setVisualError("Failed to generate visual");
      }
    } catch (error) {
      console.error("Error generating visual:", error);
      setVisualError(error.response?.data?.error || "Error generating visual");
    } finally {
      setVisualLoading(false);
    }
  };

  return (
    <div className="w-screen flex flex-col items-center relative px-2">
      {/* Input Section */}
      <div className="w-[90vw] flex justify-center mb-8 z-10">
        <div className="text-neutral-800 mt-10 relative py-6 overflow-hidden flex flex-col justify-around w-full h-44 border border-neutral-500 rounded-lg bg-black/40 p-3 px-6">
          <div className="relative before:absolute before:w-96 before:h-30 before:right-15 before:bg-rose-300/60 before:-z-10 before:rounded-full before:blur-3xl before:-top-20 z-10 after:absolute after:w-64 after:h-24 after:bg-purple-400/50 after:-z-10 after:rounded-full after:-bottom-10 after:blur-2xl after:-rotate-12 after:-right-6">
            <span className="font-extrabold text-2xl text-white/80">
              Summarize it...
            </span>
            <p className="text-white/30">
              Enter Youtube url to get summary of it
            </p>
          </div>
          <div className="flex gap-1">
            <div className="relative rounded-lg flex-grow overflow-hidden before:absolute before:w-12 before:h-12 before:content[''] before:left-0 before:bg-violet-500/100 before:rounded-full before:blur-xl after:absolute after:z-10 after:w-72 after:h-50 after:content[''] after:bg-rose-300/60 after:left-32 after:top-10 after:rounded-full after:blur-xl">
              <input
                type="text"
                id="target"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="relative w-full bg-transparent text-white outline-none backdrop-blur-3xl text-sm rounded-lg placeholder-opacity-60 border-[1.5px] border-white/30 focus:border-white/60 block p-2.5"
                placeholder="Enter YouTube URL..."
              />
            </div>
            <button
              className="button whitespace-nowrap"
              onClick={fetchNotes}
              disabled={loading}
            >
              <span>{loading ? "Generating..." : "Generate"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notes Display Section */}
      {notes && (
        <div className="w-full max-w-[90vw] max-h-[85vh] overflow-y-scroll overflow-hidden mb-10 rounded-lg bg-black/40 backdrop-blur-md p-6 border border-neutral-500 text-white/80 custom-scrollbar relative">
          {/* Additional color spots */}
          <div className="absolute -z-10 w-full h-full overflow-visible">
            <div className="absolute w-64 h-64 bg-purple-500/30 rounded-full blur-3xl -top-52 -right-24"></div>
            <div className="absolute w-48 h-48 bg-blue-400/30 rounded-full blur-3xl bottom-0 left-1/4"></div>
            <div className="absolute w-32 h-32 bg-cyan-300/30 rounded-full blur-2xl top-1/3 -left-10"></div>
            <div className="absolute w-56 h-56 bg-pink-400/20 rounded-full blur-3xl bottom-1/4 -right-20"></div>
            <div className="absolute w-24 h-24 bg-emerald-400/20 rounded-full blur-xl top-1/2 left-1/3"></div>
          </div>

          <div
            className="relative before:absolute before:w-96 before:h-30 before:right-15 before:bg-rose-300/60 before:-z-10 before:rounded-full before:blur-3xl before:-top-20 z-10 
                    after:absolute after:w-64 after:h-24 after:bg-purple-400/50 after:-z-10 after:rounded-full after:-bottom-10 after:blur-2xl after:-rotate-12 after:-right-6"
          >
            <h2 className="font-extrabold text-2xl text-white/80 mb-4">
              Generated Notes
            </h2>
            <div
              ref={printRef}
              className="prose bg-transparent prose-invert prose-headings:text-white/90 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-blue-400 prose-strong:text-white/90 prose-code:text-pink-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/20 max-w-none overflow-auto custom-scrollbar
                                    before:absolute before:w-72 before:h-72 before:bg-indigo-400/30 before:-z-10 before:rounded-full before:blur-3xl before:top-1/2 before:-translate-y-1/2 before:-left-20
                                    after:absolute after:w-80 after:h-80 after:bg-teal-400/20 after:-z-10 after:rounded-full after:blur-3xl after:top-3/4 after:-right-20"
            >
              <div dangerouslySetInnerHTML={renderMarkdown(notes)} />
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

            {/* Add Visual Generation Button */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
              <button
                onClick={generateVisual}
                disabled={visualLoading}
                className="px-4 py-2 bg-[color:var(--primary)] hover:bg-[color:var(--light)] text-white rounded-md transition-all flex items-center justify-center"
              >
                {visualLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Visual...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Generate Visual
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display Visual Error */}
      {visualError && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-md text-red-200">
          {visualError}
        </div>
      )}

      {/* Display Generated Visual */}
      {visualImage && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3 text-[color:var(--text)]">Generated Visual</h3>
          <div className="bg-black/30 border border-white/10 rounded-lg p-4 flex flex-col items-center">
            <img 
              src={`data:${visualImage.mimeType};base64,${visualImage.data}`}
              alt="Generated visual representation"
              className="max-w-full max-h-[500px] object-contain rounded-md"
            />
            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = `data:${visualImage.mimeType};base64,${visualImage.data}`;
                link.download = 'notes-visual.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="mt-4 px-3 py-1.5 bg-[color:var(--primary)] hover:bg-[color:var(--light)] text-white rounded-md transition-all flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Download Visual
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-3xl mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200">
          {error}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="p-6 bg-black/60 rounded-lg border border-white/20 flex flex-col items-center">
            <Loader />
            <p className="text-white/80">Generating notes...</p>
          </div>
        </div>
      )}

      {/* Add Visual Loading State */}
      {visualLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="p-6 bg-black/60 rounded-lg border border-white/20 flex flex-col items-center">
            <Loader />
            <p className="text-white/80">Generating visual...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GetNotes;
