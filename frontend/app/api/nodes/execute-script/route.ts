import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { script, query } = await request.json()

    if (!script || typeof script !== 'string') {
      return NextResponse.json(
        { error: 'Script is required' },
        { status: 400 }
      )
    }

    // Create temporary Python file
    const tempDir = tmpdir()
    const tempFile = join(tempDir, `script_${Date.now()}.py`)
    
    try {
      // Write script to temporary file
      await writeFile(tempFile, script, 'utf-8')

      // Execute Python script with query as argument
      const { stdout, stderr } = await execAsync(
        `python "${tempFile}" "${query || ''}"`,
        {
          timeout: 30000, // 30 second timeout
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        }
      )

      // Clean up temp file
      await unlink(tempFile).catch(() => {
        // Ignore cleanup errors
      })

      if (stderr && !stdout) {
        return NextResponse.json(
          { error: `Script execution error: ${stderr}` },
          { status: 500 }
        )
      }

      // Try to parse JSON output
      let results
      try {
        results = JSON.parse(stdout.trim())
      } catch (parseError) {
        // If not JSON, return as text result
        results = {
          count: stdout.trim() ? 1 : 0,
          output: stdout.trim(),
          sources: [],
        }
      }

      return NextResponse.json({
        results,
        status: 'completed',
      })
    } catch (execError: any) {
      // Clean up temp file on error
      await unlink(tempFile).catch(() => {
        // Ignore cleanup errors
      })

      if (execError.code === 'ETIMEDOUT') {
        return NextResponse.json(
          { error: 'Script execution timed out' },
          { status: 408 }
        )
      }

      return NextResponse.json(
        { error: `Execution failed: ${execError.message}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error executing script:', error)
    return NextResponse.json(
      { error: 'Failed to execute script' },
      { status: 500 }
    )
  }
}
