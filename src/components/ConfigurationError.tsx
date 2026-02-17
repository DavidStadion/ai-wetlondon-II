interface ConfigurationErrorProps {
  title: string;
  message: string;
  details?: string[];
}

export function ConfigurationError({ title, message, details }: ConfigurationErrorProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      color: '#f8fafc',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        background: '#1e293b',
        border: '2px solid #ef4444',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <h1 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#ef4444'
          }}>
            {title}
          </h1>
        </div>

        <p style={{
          margin: '0 0 1.5rem 0',
          lineHeight: '1.6',
          color: '#cbd5e1'
        }}>
          {message}
        </p>

        {details && details.length > 0 && (
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <p style={{
              margin: '0 0 0.5rem 0',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#94a3b8'
            }}>
              Required environment variables:
            </p>
            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              listStyle: 'disc'
            }}>
              {details.map((detail, i) => (
                <li key={i} style={{
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  color: '#f1f5f9'
                }}>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '1rem',
          fontSize: '0.875rem',
          lineHeight: '1.6',
          color: '#cbd5e1'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#94a3b8' }}>
            For local development:
          </p>
          <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>Create a <code style={{ background: '#1e293b', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>.env</code> file in the project root</li>
            <li>Add the required environment variables</li>
            <li>Restart your dev server</li>
          </ol>

          <p style={{ margin: '1rem 0 0.5rem 0', fontWeight: '600', color: '#94a3b8' }}>
            For Vercel deployment:
          </p>
          <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>Go to your project settings in Vercel</li>
            <li>Navigate to Environment Variables</li>
            <li>Add the required variables</li>
            <li>Redeploy your site</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
