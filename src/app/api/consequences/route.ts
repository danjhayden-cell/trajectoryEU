import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { 
      indicator, 
      region1, 
      region2, 
      percentageDifference, 
      timeHorizon, 
      scenario,
      leader 
    } = await request.json();

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Simple indicator name mapping
    const indicatorNames: Record<string, string> = {
      'NY.GDP.PCAP.PP.KD': 'GDP per Capita',
      'NY.GDP.MKTP.KD.ZG': 'GDP Growth',
      'GB.XPD.RSDV.GD.ZS': 'R&D Spending',
      'NE.GDI.TOTL.ZS': 'Investment',
      'labor_productivity': 'Productivity'
    };

    // Simple OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: `Write a detailed economic analysis: What would it mean if the ${leader} is ${percentageDifference.toFixed(1)}% ahead of ${leader === region1 ? region2 : region1} in ${indicatorNames[indicator] || indicator} over ${timeHorizon} years? 

Structure your response with markdown headers and provide:
- Economic fundamentals and drivers of this gap
- Real-world implications for households, businesses, and competitiveness  
- Long-term consequences and global dynamics

Write 4-5 substantial paragraphs with concrete examples and specific regional context for the US and EU.`
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return NextResponse.json({ content });

  } catch (error) {
    console.error('Error generating consequences:', error);
    return NextResponse.json(
      { error: 'Failed to generate consequence analysis' },
      { status: 500 }
    );
  }
}


