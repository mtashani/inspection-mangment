import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const calibrationData = await request.json();
    
    // Enhanced logging
    console.log('Received calibration data:', calibrationData);
    console.log('Using tag_number:', calibrationData.tag_number);
    
    // Validate tag_number exists
    if (!calibrationData.tag_number) {
      console.error('Missing tag_number in request data');
      return NextResponse.json(
        { detail: "tag_number is required" },
        { status: 400 }
      );
    }
    
    // Forward the request to the backend with tag_number
    const tagNumber = calibrationData.tag_number;
    const response = await fetch(`${API_URL}/api/psv/calibration/${tagNumber}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calibrationData),
    });
    
    // Enhanced logging for response
    console.log('Backend API response status:', response.status);
    if (!response.ok) {
      console.error(`Backend API error (${response.status})`);
      
      // Clone the response before attempting to read its body
      const responseClone = response.clone();
      
      // Try to parse error as JSON first
      try {
        const errorData = await response.json();
        console.error('Error data:', errorData);
        return NextResponse.json(
          { detail: errorData.detail || `Failed to save calibration: ${response.statusText}` },
          { status: response.status }
        );
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        
        // Use the cloned response for text
        try {
          const errorText = await responseClone.text();
          console.error('Error text:', errorText);
          return NextResponse.json(
            { detail: `Failed to save calibration: ${response.statusText}` },
            { status: response.status }
          );
        } catch (textError) {
          console.error('Error parsing text response:', textError);
          return NextResponse.json(
            { detail: `Failed to save calibration (Status ${response.status})` },
            { status: response.status }
          );
        }
      }
    }
    
    const data = await response.json();
    console.log('Successfully saved calibration:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in calibration API route:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add PUT method to handle calibration updates
export async function PUT(request: NextRequest) {
  try {
    // Detailed request logging
    const url = request.url;
    console.log("-------- CALIBRATION UPDATE --------");
    console.log("Incoming update request URL:", url);
    console.log("Request method:", request.method);
    
    // Get the full URL path and extract the segments
    const pathname = new URL(url).pathname;
    console.log("Pathname:", pathname);
    
    // Use a more precise pattern to extract the ID - works with dynamic routes in Next.js
    // Pattern matches: /api/calibration/123 or /api/calibration/123/
    const idMatch = pathname.match(/\/api\/calibration\/([^\/]+)\/?$/);
    
    if (!idMatch) {
      console.error("ID pattern not matched in URL:", pathname);
      return NextResponse.json(
        { detail: "Invalid URL format - could not extract calibration ID" },
        { status: 400 }
      );
    }
    
    const id = idMatch[1];
    console.log("Extracted calibration ID:", id);
    
    let calibrationData;
    try {
      calibrationData = await request.json();
      console.log("Parsed request body:", calibrationData);
    } catch (e) {
      console.error("Failed to parse request JSON:", e);
      return NextResponse.json(
        { detail: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    // Construct the full backend URL for the PUT request
    const backendUrl = `${API_URL}/api/psv/calibration/${id}`;
    console.log("Backend API URL:", backendUrl);
    
    try {
      // Send the request to the backend
      const response = await fetch(backendUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calibrationData),
      });
      
      console.log("Backend response status:", response.status);
      
      if (!response.ok) {
        console.error(`Backend API error (${response.status}: ${response.statusText})`);
        
        // Clone the response before attempting to read the body
        const responseClone = response.clone();
        
        try {
          // Try to parse as JSON
          const errorData = await response.json();
          console.error("Error response data:", errorData);
          return NextResponse.json(
            { detail: errorData.detail || `Error ${response.status}: ${response.statusText}` },
            { status: response.status }
          );
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError);
          
          // Fall back to text from the cloned response
          try {
            const errorText = await responseClone.text();
            console.error("Error response text:", errorText);
            return NextResponse.json(
              { detail: `Error ${response.status}: ${response.statusText}` },
              { status: response.status }
            );
          } catch (textError) {
            console.error("Error parsing text response:", textError);
            return NextResponse.json(
              { detail: `Error ${response.status}: ${response.statusText}` },
              { status: response.status }
            );
          }
        }
      }
      
      const data = await response.json();
      console.log("Success response data:", data);
      console.log("-------- UPDATE COMPLETED --------");
      return NextResponse.json(data);
    } catch (fetchError: unknown) {
      console.error("Fetch error during backend request:", fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown network error';
      return NextResponse.json(
        { detail: `Network error: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in PUT handler:", error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Calibration API endpoint is working' });
}