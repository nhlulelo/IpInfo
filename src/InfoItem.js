import React from 'react';
import { FaCopy } from 'react-icons/fa';

export default function InfoItem({ label, value, copyable, copyToClipboard }) {
  return (
    <div className="info-item">
      <span className="info-label">{label}:</span>
      <span className="info-value">
        {value}
        {copyable && (
          <button className="copy-button" onClick={() => copyToClipboard(value)}>
            <FaCopy />
          </button>
        )}
      </span>
    </div>
  );
}