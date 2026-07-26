import { useState } from "react";

export default function ImageHint({ image, alt }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="field-tooltip"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(v => !v)}
    >
      ?
      {visible && (
        <span className="field-tooltip-popup">
          <img src={image} alt={alt} />
        </span>
      )}
    </span>
  );
}
