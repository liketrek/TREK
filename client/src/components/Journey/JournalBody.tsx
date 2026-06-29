import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

interface Props {
  text: string
  dark?: boolean
}

export default function JournalBody({ text, dark }: Props) {
  return (
    <div className="journal-body" style={{
      fontFamily: 'inherit',
      fontSize: 'inherit',
      lineHeight: 1.6,
      color: 'inherit',
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => <p style={{ margin: '0 0 6px' }}>{children}</p>,
          h2: ({ children }) => <p style={{ margin: '0 0 6px' }}>{children}</p>,
          h3: ({ children }) => <p style={{ margin: '0 0 6px' }}>{children}</p>,
          p: ({ children }) => <p style={{ margin: '0 0 6px' }}>{children}</p>,
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: `3px solid var(--journal-accent)`,
              paddingLeft: 16, margin: '12px 0',
              fontStyle: 'italic', color: 'var(--journal-muted)',
            }}>{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--journal-accent)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
              {children}
            </a>
          ),
          ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '8px 0' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: 20, margin: '8px 0' }}>{children}</ol>,
          li: ({ children }) => <li style={{ margin: '4px 0' }}>{children}</li>,
          strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--journal-border)', margin: '20px 0' }} />,
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <pre style={{
                  background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  borderRadius: 8, padding: 14, overflowX: 'auto',
                  fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontFamily: 'monospace', margin: '12px 0',
                }}>
                  <code>{children}</code>
                </pre>
              )
            }
            return (
              <code style={{
                background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                borderRadius: 4, padding: '2px 5px', fontSize: '0.9em', fontFamily: 'monospace',
              }}>{children}</code>
            )
          },
        }}
      >
        {text.replace(/^(.+)\n([-=]{3,})$/gm, '$1\n\n$2')}
      </ReactMarkdown>
    </div>
  )
}
