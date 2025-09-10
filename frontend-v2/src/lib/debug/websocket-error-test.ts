/**
 * WebSocket Error Handling Test
 * 
 * This script can be run in the browser console to test
 * the improved WebSocket error handling functionality.
 */

// Test script for browser console
const wsErrorTest = {
  /**
   * Test the debug helper functionality
   */
  testDebugHelper() {
    console.log('🧪 Testing Debug Helper...')
    
    if (typeof window !== 'undefined' && (window as any).wsDebugHelper) {
      const helper = (window as any).wsDebugHelper
      
      console.log('✅ Debug Helper Available')
      console.log('📋 Available methods:', Object.keys(helper))
      
      // Test error logging
      helper.test()
      
      setTimeout(() => {
        console.log('📊 Recent logs:', helper.logs())
        console.log('❌ Error logs:', helper.errors())
      }, 1000)
    } else {
      console.warn('⚠️ Debug Helper not available')
    }
  },

  /**
   * Test WebSocket error serialization
   */
  testErrorSerialization() {
    console.log('🧪 Testing Error Serialization...')
    
    // Test 1: Empty object
    const emptyError = {}
    console.log('Empty object:', JSON.stringify(emptyError))
    
    // Test 2: Undefined
    const undefinedError = undefined
    console.log('Undefined:', JSON.stringify(undefinedError))
    
    // Test 3: Event-like object
    const mockEvent = {
      type: 'error',
      target: {
        readyState: 3,
        url: 'ws://localhost:8000/test'
      },
      timestamp: Date.now()
    }
    console.log('Mock Event:', JSON.stringify(mockEvent))
    
    // Test 4: Circular reference
    const circular: any = { name: 'test' }
    circular.self = circular
    
    try {
      console.log('Circular:', JSON.stringify(circular))
    } catch (e) {
      console.log('Circular error (expected):', e instanceof Error ? e.message : 'Unknown error')
    }
    
    // Test safe stringify
    try {
      const safeStringify = (obj: any) => {
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular Reference]'
            }
            seen.add(value)
          }
          return value
        })
      }
      
      const seen = new WeakSet()
      console.log('Safe circular:', safeStringify(circular))
    } catch (e) {
      console.log('Safe stringify error:', e instanceof Error ? e.message : 'Unknown error')
    }
  },

  /**
   * Test structured error creation
   */
  testStructuredErrors() {
    console.log('🧪 Testing Structured Error Creation...')
    
    // Test different error types
    const errorTypes = [
      undefined,
      null,
      '',
      'string error',
      { message: 'object error' },
      { type: 'websocket_error', details: { test: true } },
      new Error('Error instance'),
      { circular: {} }
    ]
    
    errorTypes[errorTypes.length - 1].circular = errorTypes[errorTypes.length - 1]
    
    errorTypes.forEach((error, index) => {
      try {
        const errorInfo = this.createStructuredError(error, `test_${index}`)
        console.log(`Error ${index}:`, errorInfo)
      } catch (e) {
        console.log(`Error ${index} failed:`, e instanceof Error ? e.message : 'Unknown error')
      }
    })
  },

  /**
   * Create structured error like the WebSocket service does
   */
  createStructuredError(error: any, source: string) {
    let errorMessage = 'Unknown error'
    let errorType = 'generic_error'
    let errorDetails = {}
    
    try {
      if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message
        } else if (error.type) {
          errorMessage = `Error type: ${error.type}`
        }
        
        if (error.type) {
          errorType = error.type
        }
        
        // Try to extract details safely
        if (error.details) {
          errorDetails = error.details
        } else if (error.target) {
          errorDetails = {
            target: {
              readyState: error.target.readyState,
              url: error.target.url
            }
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
        errorType = error.name || 'error'
      }
    } catch (parseError) {
      errorMessage = 'Error parsing error object'
      errorDetails = { parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error' }
    }
    
    return {
      message: errorMessage,
      type: errorType,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      source
    }
  },

  /**
   * Run all tests
   */
  runAllTests() {
    console.log('🚀 Starting WebSocket Error Handling Tests...')
    console.log('==========================================')
    
    this.testDebugHelper()
    
    setTimeout(() => {
      this.testErrorSerialization()
    }, 500)
    
    setTimeout(() => {
      this.testStructuredErrors()
    }, 1000)
    
    setTimeout(() => {
      console.log('==========================================')
      console.log('✅ All tests completed!')
      console.log('💡 Check browser console for detailed results')
      console.log('🔧 Use window.wsDebugHelper methods for live debugging')
    }, 1500)
  }
}

// Export for browser console use
if (typeof window !== 'undefined') {
  (window as any).wsErrorTest = wsErrorTest
  
  console.log('🧪 WebSocket Error Test loaded!')
  console.log('💡 Run: wsErrorTest.runAllTests()')
  console.log('🔧 Debug Helper: window.wsDebugHelper')
}

export default wsErrorTest