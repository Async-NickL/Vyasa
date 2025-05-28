import Background from "./components/utils/Background";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GooeyNav from "./components/Navbar";
import Home from "./components/Home/Home";
import GetNotes from "./components/Notes/GetNotes";
import SummarizeFile from "./components/SummerizeFile/SummarizeFile";
import RoadmapGenerator from "./components/Roadmap/RoadmapGenerator";
import QuestionBank from "./components/QuestionBank/QuestionBank";

function App() {
  const navigationItems = [
    {
      href: "/",
      label: "YouTube Notes",
    },
    {
      href: "/document-analyzer",
      label: "Document Analyzer",
    },
    {
      href: "/roadmap",
      label: "Learning Roadmap",
    },
    {
      href: "/question-bank",
      label: "Question Bank",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] overflow-hidden">
      <Background
        colorStops={["#00D8FF", "#7CFF67", "#00D8FF"]}
        blend={4}
        amplitude={0.6}
        speed={0.7}
      />
      <BrowserRouter>
        <GooeyNav items={navigationItems} />
        <div className="relative w-full overflow-hidden">
          <Routes>
            <Route path="/" element={<GetNotes />} />
            <Route path="/document-analyzer" element={<SummarizeFile />} />
            <Route path="/roadmap" element={<RoadmapGenerator />} />
            <Route path="/question-bank" element={<QuestionBank />} />
            <Route path="/home" element={<Home />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
