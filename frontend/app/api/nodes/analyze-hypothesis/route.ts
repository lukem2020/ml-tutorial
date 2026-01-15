import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { hypothesis } = await request.json()

    if (!hypothesis || typeof hypothesis !== 'string') {
      return NextResponse.json(
        { error: 'Hypothesis is required' },
        { status: 400 }
      )
    }

    // Analyze hypothesis to determine required data types
    const requiredDataTypes = analyzeHypothesisForDataNeeds(hypothesis)

    return NextResponse.json({
      requiredData: requiredDataTypes,
      status: 'completed',
    })
  } catch (error) {
    console.error('Error analyzing hypothesis:', error)
    return NextResponse.json(
      { error: 'Failed to analyze hypothesis' },
      { status: 500 }
    )
  }
}

function analyzeHypothesisForDataNeeds(hypothesis: string): string[] {
  const lowerHypothesis = hypothesis.toLowerCase()
  const requiredData: string[] = []

  // Literature review - always needed
  requiredData.push('Literature Search')

  // Check for genetic/genomic terms
  if (
    lowerHypothesis.includes('gene') ||
    lowerHypothesis.includes('genetic') ||
    lowerHypothesis.includes('gwas') ||
    lowerHypothesis.includes('variant') ||
    lowerHypothesis.includes('mutation')
  ) {
    requiredData.push('GWAS Data')
  }

  // Check for expression/omics terms
  if (
    lowerHypothesis.includes('expression') ||
    lowerHypothesis.includes('transcriptomic') ||
    lowerHypothesis.includes('genomic') ||
    lowerHypothesis.includes('proteomic') ||
    lowerHypothesis.includes('omics')
  ) {
    requiredData.push('Expression Data')
    requiredData.push('Omics Data')
  }

  // Check for pathway terms
  if (
    lowerHypothesis.includes('pathway') ||
    lowerHypothesis.includes('network') ||
    lowerHypothesis.includes('signaling') ||
    lowerHypothesis.includes('inflammasome') ||
    lowerHypothesis.includes('kinase')
  ) {
    requiredData.push('Pathway Data')
  }

  // Check for disease-specific terms
  if (
    lowerHypothesis.includes('diabetes') ||
    lowerHypothesis.includes('cardiovascular') ||
    lowerHypothesis.includes('cancer') ||
    lowerHypothesis.includes('disease')
  ) {
    requiredData.push('Disease Association Data')
  }

  // Remove duplicates and return
  return Array.from(new Set(requiredData))
}
