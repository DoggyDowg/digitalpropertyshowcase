'use client'

import { useState, useEffect } from 'react'
import { testDemoAssets, logTestResults } from '@/utils/testDemoAssets'
import { DEMO_CONFIG } from '@/config/demo'

interface TestResult {
  path: string
  success: boolean
  error?: string
  url?: string
}

interface TestSummary {
  totalTests: number
  passed: number
  failed: number
  results: TestResult[]
}

export default function TestDemoAssetsPage() {
  const [testResults, setTestResults] = useState<TestSummary | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setIsRunning(true)
    setError(null)
    
    try {
      const results = await testDemoAssets()
      setTestResults(results)
      logTestResults(results)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error running tests:', err)
    } finally {
      setIsRunning(false)
    }
  }

  // Run tests on component mount
  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Demo Asset Test Results</h1>
          <p className="text-gray-600 mb-4">
            This page tests all demo assets to ensure they're properly accessible in the Supabase storage bucket.
          </p>
          
          <button
            onClick={runTests}
            disabled={isRunning}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? 'Running Tests...' : 'Run Tests Again'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {testResults && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-2xl font-bold text-gray-800">{testResults.totalTests}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div className="bg-green-100 p-4 rounded">
                <div className="text-2xl font-bold text-green-800">{testResults.passed}</div>
                <div className="text-sm text-green-600">Passed</div>
              </div>
              <div className="bg-red-100 p-4 rounded">
                <div className="text-2xl font-bold text-red-800">{testResults.failed}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
              <div className="bg-blue-100 p-4 rounded">
                <div className="text-2xl font-bold text-blue-800">
                  {((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-blue-600">Success Rate</div>
              </div>
            </div>

            {testResults.failed > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-red-800 mb-3">❌ Failed Assets</h3>
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <div className="space-y-2">
                    {testResults.results
                      .filter(r => !r.success)
                      .map((result, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="font-mono text-sm text-red-700">{result.path}</span>
                          <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
                            {result.error}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium text-green-800 mb-3">✅ Working Assets</h3>
              <div className="bg-green-50 border border-green-200 rounded p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {testResults.results
                    .filter(r => r.success)
                    .map((result, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="font-mono text-sm text-green-700">{result.path}</span>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-800 underline"
                        >
                          View Asset
                        </a>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Demo Configuration</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {JSON.stringify(DEMO_CONFIG, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
} 