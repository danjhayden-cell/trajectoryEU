import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { 
      indicator, 
      region1, 
      region2, 
      percentageDifference, 
      timeHorizon, 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const indicatorNames: Record<string, string> = {
      'NY.GDP.PCAP.PP.KD': 'GDP per Capita',
      'NY.GDP.MKTP.KD.ZG': 'GDP Growth',
      'GB.XPD.RSDV.GD.ZS': 'R&D Spending',
      'NE.GDI.TOTL.ZS': 'Investment',
      'labor_productivity': 'Productivity'
    };

    // Log the exact prompt being sent
    const promptText = `Write a detailed economic analysis: What would it mean if, in ${2024 + timeHorizon}, ${leader === 'European Union' ? 'the EU' : 
      leader === 'United States' ? 'the USA' : 
      leader === 'China' ? 'China' : 
      leader === 'BRICS' ? 'BRICS' : leader} ${leader === 'BRICS' ? 'are' : 'is'} ahead of ${(leader === region1 ? region2 : region1) === 'European Union' ? 'the EU' : 
      (leader === region1 ? region2 : region1) === 'United States' ? 'the USA' : 
      (leader === region1 ? region2 : region1) === 'China' ? 'China' : 
      (leader === region1 ? region2 : region1) === 'BRICS' ? 'BRICS' : (leader === region1 ? region2 : region1)} by ${Math.round(percentageDifference * 10) / 10}% in ${indicator === 'NY.GDP.PCAP.PP.KD' ? 'GDP per capita' : indicator === 'GB.XPD.RSDV.GD.ZS' ? 'R&D spending' : indicator === 'NY.GDP.MKTP.KD.ZG' ? 'GDP growth' : indicator === 'NE.GDI.TOTL.ZS' ? 'investment rates' : 'productivity'}?

Structure your response with markdown headers and provide:
- Economic fundamentals and drivers of this gap
- Real-world implications for households, businesses, and competitiveness  
- Long-term consequences and global dynamics

Write 4-5 substantial paragraphs with concrete examples and specific regional context for the US and EU.`;

    console.log('Sending prompt to API:', promptText);
    console.log('Data being sent:', { indicator, region1, region2, percentageDifference, timeHorizon, leader });

    // Try GPT-5 with Chat Completions API instead of Responses API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [
          {
            role: 'user',
            content: promptText
          }
        ],
        reasoning_effort: 'minimal',
        verbosity: 'medium',
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorData
      });
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    // Log basic response info
    console.log('GPT-5 response received:', {
      finishReason: data.choices?.[0]?.finish_reason,
      hasContent: !!data.choices?.[0]?.message?.content
    });
    
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in response - likely hit token limit');
      // Return a helpful message instead of an error
      return NextResponse.json({ 
        content: '## Analysis Temporarily Unavailable\n\nThe economic analysis is temporarily unavailable due to high demand. Please try adjusting your scenario or time horizon and try again.' 
      });
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


