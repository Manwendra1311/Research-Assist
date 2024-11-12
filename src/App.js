import './App.css';
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import html2pdf from 'html2pdf.js'; 

function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [domain, setDomain] = useState("VLSI");
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const textAreaRef = useRef();

  useEffect(() => {
    const savedResponse = localStorage.getItem("lastResponse");
    if (savedResponse) setResponse(savedResponse);
  }, []);

  useEffect(() => {
    if (response) localStorage.setItem("lastResponse", response);
  }, [response]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:3001/chat", {
        prompt: prompt,
        domain: domain
      });
  
      // Format the response to add paragraph breaks and handle specific formatting
      const formattedResponse = res.data.response
        .split('\n') // Split the response into lines
        .map((line, index) => {
          // Handle bold formatting and remove markings
          const boldedLine = line
            .replace(/### (.+)/g, '<strong>$1</strong>') // Make text after ### bold
            .replace(/\*\*\*\*(.+?)\*\*\*\*/g, '<strong>$1</strong>') // Make text within **** bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); // Make text within ** bold and remove the markings
  
          return <p key={index} dangerouslySetInnerHTML={{ __html: boldedLine.trim() }} />;
        });
  
      setResponse(formattedResponse); // Set the formatted response
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(response);
  };

  const handleClear = () => {
    setPrompt("");
    setResponse("");
    localStorage.removeItem("lastResponse");
  };

  const generatePDF = () => {
    const content = document.querySelector('.content-display').innerHTML; 
    const pdfStyles = `
      <style>
        body {
          font-family: 'Roboto', sans-serif;
          line-height: 1.6;
          padding: 20px;
          text-align: justify;
          color: #333;
        }
        .content-wrapper {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          box-sizing: border-box;
        }
        h1, h2, h3 {
          text-align: center;
          color: #2c3e50;
        }
        p {
          margin: 10px 0;
        }
        ul {
          padding-left: 20px;
          margin: 10px 0;
        }
        li {
          margin: 5px 0;
        }
      </style>
    `;
    const pdfContent = `
      <div class="content-wrapper">
        ${pdfStyles}
        <h1>Electronics Content Generated</h1>
        <h2>Domain: ${domain}</h2>
        <h3>Query:</h3>
        <p>${prompt}</p>
        <h3>Response:</h3>
        <div>${content}</div>
      </div>
    `;

    // Use `html2pdf` to generate and download the PDF
    const options = {
      margin: 0.5,
      filename: 'electronics-content.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
      .set(options)
      .from(pdfContent)
      .save();
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <aside className="sidebar">
        <h2 className="sidebar-title">Research Assist</h2>
        <div className="domain-switcher">
          <h3>Select Domain</h3>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className="domain-dropdown">
            <option value="VLSI">VLSI</option>
            <option value="Embedded Systems">Embedded Systems</option>
            <option value="Control Systems">Control Systems</option>
            <option value="Digital Systems">Digital Systems</option>
          </select>
        </div>
        <div className="dark-mode-toggle">
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <form onSubmit={submitHandler} className="form-container">
          <textarea
            name="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="prompt-input"
            placeholder="Write your electronics-related query..."
            maxLength={200}
            ref={textAreaRef}
          />
          <button type="submit" className="generate-button" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Content'}
          </button>
        </form>

        {response && (
          <div className="content-container">
            <div className="content-display">
              {response}
            </div>
            <div className="actions">
              <button onClick={generatePDF} className="action-button">Download PDF</button>
              <button onClick={handleCopyToClipboard} className="action-button">Copy to Clipboard</button>
              <button onClick={handleClear} className="action-button clear-button">Clear</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
