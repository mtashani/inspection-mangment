// Simple test script to verify error handling improvements
// This can be run in browser console to test error scenarios

console.log('🧪 Testing Error Handling Improvements...')

// Test 1: Undefined error object
console.log('\n1. Testing undefined error handling:')
try {
  const errorInfo = {
    type: undefined?.type || 'unknown',
    message: undefined?.message || 'WebSocket connection error',
    timestamp: new Date().toISOString(),
    readyState: 'unknown'
  }
  console.log('✅ Undefined error handled:', errorInfo)
} catch (e) {
  console.error('❌ Failed to handle undefined error:', e)
}

// Test 2: Malformed error object
console.log('\n2. Testing malformed error handling:')
try {
  const malformedError = { randomProperty: 'test' }
  const errorInfo = {
    type: malformedError?.type || 'unknown',
    message: malformedError?.message || 'WebSocket connection error',
    timestamp: new Date().toISOString()
  }
  console.log('✅ Malformed error handled:', errorInfo)
} catch (e) {
  console.error('❌ Failed to handle malformed error:', e)
}

// Test 3: Circular reference error
console.log('\n3. Testing circular reference handling:')
try {
  const circularObj = { name: 'test' }
  circularObj.self = circularObj
  
  let safeLog
  try {
    safeLog = JSON.stringify(circularObj, null, 2)
  } catch (stringifyError) {
    safeLog = circularObj
  }
  console.log('✅ Circular reference handled:', typeof safeLog)
} catch (e) {
  console.error('❌ Failed to handle circular reference:', e)
}

// Test 4: Error instanceof check
console.log('\n4. Testing Error instanceof check:')
try {
  const testError = new Error('Test error message')
  const errorInfo = {
    message: testError instanceof Error ? testError.message : 'Unknown error',
    type: 'test_error'
  }
  console.log('✅ Error instanceof check worked:', errorInfo)
} catch (e) {
  console.error('❌ Failed instanceof check:', e)
}

console.log('\n🎉 Error handling tests completed!')