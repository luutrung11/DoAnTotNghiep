import React, { useState, useRef, useEffect } from "react";
import "./ChatBot.css";

const WELCOME = {
    role: "assistant",
    content: "Xin chào! Mình là trợ lý tư vấn của cửa hàng. Mình có thể giúp bạn tìm sản phẩm, gợi ý theo ngân sách, hoặc giải đáp về thanh toán, vận chuyển, đổi trả. Bạn cần gì nào?",
};

const ChatBot = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([WELCOME]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    // tự cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const newMessages = [...messages, { role: "user", content: text }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            // chỉ gửi role + content (bỏ tin nhắn chào mở đầu để tiết kiệm token)
            const history = newMessages
                .filter((m) => m !== WELCOME)
                .map((m) => ({ role: m.role, content: m.content }));

            const res = await fetch("http://localhost:4000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history }),
            });
            const data = await res.json();
            const reply = data.success
                ? data.reply
                : data.errors || "Xin lỗi, có lỗi xảy ra. Bạn thử lại nhé!";
            setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        } catch (e) {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Không kết nối được tới máy chủ. Bạn kiểm tra lại kết nối nhé!" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chatbot">
            {open && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <span>Tư vấn tự động</span>
                        <button className="chatbot-close" onClick={() => setOpen(false)}>×</button>
                    </div>
                    <div className="chatbot-messages">
                        {messages.map((m, i) => (
                            <div key={i} className={`chatbot-msg ${m.role}`}>
                                {m.content}
                            </div>
                        ))}
                        {loading && <div className="chatbot-msg assistant chatbot-typing">Đang trả lời...</div>}
                        <div ref={bottomRef} />
                    </div>
                    <div className="chatbot-input">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập câu hỏi của bạn..."
                            rows={1}
                        />
                        <button onClick={sendMessage} disabled={loading}>Gửi</button>
                    </div>
                </div>
            )}
            <button className="chatbot-toggle" onClick={() => setOpen((o) => !o)}>
                {open ? "Đóng" : "💬 Tư vấn"}
            </button>
        </div>
    );
};

export default ChatBot;
