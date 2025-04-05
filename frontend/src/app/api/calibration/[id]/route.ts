import { NextRequest, NextResponse } from 'next/server';

// Ensure we're using the correct backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// This file handles API requests to /api/calibration/{id}
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Log the entire params object to ensure we're getting the ID correctly
    console.log("Route params:", params);
    
    const id = params.id;
    
    console.log("-------- CALIBRATION UPDATE --------");
    console.log("Processing update for calibration ID:", id);
    
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
    console.log("Request method:", request.method);
    console.log("Request headers:", Object.fromEntries(request.headers));
    
    try {
      // Ensure we're using the correct URL format for the backend
      // The correct route structure: /api/psv/calibration/{id}
      const backendEndpoint = `${API_URL}/api/psv/calibration/${id}`;
      
      console.log("Making PUT request to backend endpoint:", backendEndpoint);
      
      const response = await fetch(backendEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(calibrationData),
      });
      
      console.log("Backend response status:", response.status);
      console.log("Backend response status text:", response.statusText);
      
      // Detailed debug information
      console.log("Request details:", {
        method: 'PUT',
        url: backendEndpoint,
        requestBody: JSON.stringify(calibrationData).substring(0, 100) + '...',
        apiUrl: API_URL,
        fullPath: `/api/psv/calibration/${id}`,
        combinedUrl: `${API_URL}/api/psv/calibration/${id}`
      });
      
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

// This function handles DELETE requests to /api/calibration/{id}
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Log the entire params object to ensure we're getting the ID correctly
    console.log("DELETE Route params:", params);
    const id = params.id;
    
    console.log(`-------- CALIBRATION DELETE --------`);
    console.log(`Processing deletion for calibration ID: ${id}`);
    
    // Construct the full backend URL for the DELETE request
    const backendUrl = `${API_URL}/api/psv/calibration/${id}`;
    console.log("Backend deletion URL:", backendUrl);
    
    try {
      // Send the request to the backend
      const response = await fetch(backendUrl, {
        method: 'DELETE',
        headers: {
          'Accept': '*/*',
        }
      });
      
      console.log("Backend delete response status:", response.status);
      console.log("Backend delete response status text:", response.statusText);
      
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
      
      // Return a success response
      console.log("Calibration successfully deleted");
      console.log("-------- DELETE COMPLETED --------");
      return new NextResponse(null, { status: 204 }); // No Content
      
    } catch (fetchError: unknown) {
      console.error("Fetch error during backend delete request:", fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown network error';
      return NextResponse.json(
        { detail: `Network error: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in DELETE handler:", error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}