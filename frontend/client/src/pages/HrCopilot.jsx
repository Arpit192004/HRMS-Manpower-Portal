import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Send, Sparkles } from "lucide-react";
import api from "../api/axios";

const HrCopilot = ({ clientView = false }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      title: "HRMS Copilot ready",
      answer:
        "Ask me about approvals, attendance, payroll, invoices, hiring, compliance or today’s HR operations."
    }
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadSuggestions = async () => {
    try {
      const { data } = await api.get("/copilot/suggestions");
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions([]);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const askQuestion = async (text = question) => {
    if (!text.trim()) return;

    const userMessage = { role: "user", answer: text };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/copilot/ask", { question: text });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          ...data.response
        }
      ]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Copilot could not answer this question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className={clientView ? "client-heading" : "page-heading"}>
        <div>
          <h1>AI HR Copilot</h1>
          <p>Ask smart questions from your live HRMS data without opening every module.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="copilot-grid">
        <aside className="content-card copilot-sidebar">
          <Sparkles size={26} />
          <h3>Try asking</h3>
          <p>These questions are answered from live portal data.</p>
          <div className="copilot-suggestions">
            {suggestions.map((item) => (
              <button key={item} onClick={() => askQuestion(item)} disabled={loading}>
                {item}
              </button>
            ))}
          </div>
        </aside>

        <div className="content-card copilot-chat">
          <div className="copilot-messages">
            {messages.map((message, index) => (
              <article className={`copilot-message ${message.role}`} key={`${message.role}-${index}`}>
                <div className="copilot-avatar">
                  {message.role === "assistant" ? <Bot size={18} /> : "You"}
                </div>
                <div>
                  {message.title && <h3>{message.title}</h3>}
                  <p>{message.answer}</p>
                  {message.actions?.length > 0 && (
                    <div className="copilot-actions">
                      {message.actions.map((action) => (
                        <Link key={action.path} to={action.path}>
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
            {loading && (
              <article className="copilot-message assistant">
                <div className="copilot-avatar"><Bot size={18} /></div>
                <div>
                  <p>Thinking through live HRMS data...</p>
                </div>
              </article>
            )}
          </div>

          <form
            className="copilot-input"
            onSubmit={(event) => {
              event.preventDefault();
              askQuestion();
            }}
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask: Which invoices are outstanding?"
            />
            <button className="primary-button" disabled={loading}>
              <Send size={16} />
              Ask
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HrCopilot;
