import { useState } from "react";

export default function CopyableField({ value }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // если Clipboard API недоступен — молча игнорируем, поле всё равно видно и выделяется вручную
    }
  }

  return (
    <span className="copyable-field">
      <span className="copyable-value">{value}</span>
      <button type="button" className="copy-btn" onClick={handleCopy} title="Скопировать" aria-label="Скопировать">
        {copied ? "✓" : "⧉"}
      </button>
    </span>
  );
}
