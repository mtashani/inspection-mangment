/**
 * Basic Test Page - No external dependencies
 */

export default function BasicTestPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Basic Theme Test
      </h1>
      
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        This is a basic test page with no external dependencies.
      </p>
      
      {/* Simple theme test */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          CSS Variables Test
        </h2>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div 
            style={{
              padding: '1rem',
              backgroundColor: 'var(--primary, #3b82f6)',
              color: 'white',
              borderRadius: 'var(--radius, 0.5rem)',
              minWidth: '120px',
              textAlign: 'center'
            }}
          >
            Primary
          </div>
          
          <div 
            style={{
              padding: '1rem',
              backgroundColor: 'var(--secondary, #64748b)',
              color: 'white',
              borderRadius: 'var(--radius, 0.5rem)',
              minWidth: '120px',
              textAlign: 'center'
            }}
          >
            Secondary
          </div>
          
          <div 
            style={{
              padding: '1rem',
              backgroundColor: 'var(--accent, #f59e0b)',
              color: 'white',
              borderRadius: 'var(--radius, 0.5rem)',
              minWidth: '120px',
              textAlign: 'center'
            }}
          >
            Accent
          </div>
        </div>
      </div>
      
      {/* Manual theme switcher */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Manual Theme Switcher
        </h2>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={() => {
              document.documentElement.style.setProperty('--primary', '#3b82f6')
              document.documentElement.style.setProperty('--secondary', '#64748b')
              document.documentElement.style.setProperty('--accent', '#f59e0b')
              document.documentElement.style.setProperty('--radius', '0.5rem')
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Blue Theme
          </button>
          
          <button
            onClick={() => {
              document.documentElement.style.setProperty('--primary', '#10b981')
              document.documentElement.style.setProperty('--secondary', '#6b7280')
              document.documentElement.style.setProperty('--accent', '#f59e0b')
              document.documentElement.style.setProperty('--radius', '1rem')
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Green Theme
          </button>
          
          <button
            onClick={() => {
              document.documentElement.style.setProperty('--primary', '#8b5cf6')
              document.documentElement.style.setProperty('--secondary', '#6b7280')
              document.documentElement.style.setProperty('--accent', '#f59e0b')
              document.documentElement.style.setProperty('--radius', '0rem')
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Purple Theme (Sharp)
          </button>
        </div>
      </div>
      
      {/* Instructions */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '0.5rem',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          How to Test:
        </h3>
        <ol style={{ paddingLeft: '1.5rem' }}>
          <li>Click the theme buttons above</li>
          <li>Watch the colored boxes change</li>
          <li>Open Developer Tools (F12)</li>
          <li>Go to Elements tab</li>
          <li>Find the &lt;html&gt; element</li>
          <li>In Styles panel, manually add CSS variables like:
            <ul style={{ paddingLeft: '1rem', marginTop: '0.5rem' }}>
              <li><code>--primary: #ff0000;</code></li>
              <li><code>--radius: 20px;</code></li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  )
}