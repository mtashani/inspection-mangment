// API validation functions

export async function checkEmployeeIdExists(employeeId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/inspectors/check-employee-id/${encodeURIComponent(employeeId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.exists;
    }
    
    // If endpoint doesn't exist, we'll handle it in the main submission
    return false;
  } catch (error) {
    console.warn("Could not check employee ID uniqueness:", error);
    return false;
  }
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/inspectors/check-username/${encodeURIComponent(username)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.exists;
    }
    
    return false;
  } catch (error) {
    console.warn("Could not check username uniqueness:", error);
    return false;
  }
}