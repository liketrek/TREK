import { useState } from 'react';
import { emojiToCodepoint } from './CollabChat.helpers';

export function TwemojiImg({ emoji, size = 20, style = {} }) {
  const cp = emojiToCodepoint(emoji);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span style={{ fontSize: size, lineHeight: 1, display: 'inline-block', verticalAlign: 'middle', ...style }}>
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${cp}.png`}
      alt={emoji}
      draggable={false}
      style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle', ...style }}
      onError={() => setFailed(true)}
    />
  );
}
