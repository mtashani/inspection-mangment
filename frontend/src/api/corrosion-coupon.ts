import { CorrosionCoupon, CouponFormData, CouponStatus, CouponType } from "@/components/corrosion/types";

/**
 * Fetch all coupons with optional filtering
 */
export async function fetchCoupons(
  options: {
    status?: CouponStatus,
    couponType?: CouponType,
    locationId?: string
  } = {}
): Promise<CorrosionCoupon[]> {
  const params = new URLSearchParams();
  
  if (options.status) {
    params.append('status', options.status);
  }
  if (options.couponType) {
    params.append('coupon_type', options.couponType);
  }
  if (options.locationId) {
    params.append('location_id', options.locationId);
  }
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/corrosion/coupons${queryString}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch coupons: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Fetch a single coupon by ID
 */
export async function fetchCouponById(couponId: string): Promise<CorrosionCoupon> {
  const response = await fetch(`/api/corrosion/coupons/${couponId}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch coupon: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Create a new coupon
 */
export async function createCoupon(couponData: CouponFormData): Promise<CorrosionCoupon> {
  // Convert Date objects to ISO strings for API
  const apiData = {
    ...couponData,
    installation_date: couponData.installation_date.toISOString(),
    scheduled_removal_date: couponData.scheduled_removal_date.toISOString()
  };

  const response = await fetch('/api/corrosion/coupons', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to create coupon: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Update an existing coupon
 */
export async function updateCoupon(
  couponId: string,
  couponData: Partial<CouponFormData>
): Promise<CorrosionCoupon> {
  // Create a new object without the Date objects
  const apiData: Record<string, unknown> = {};
  
  // Copy all properties except dates
  Object.keys(couponData).forEach(key => {
    const value = couponData[key as keyof Partial<CouponFormData>];
    
    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      apiData[key] = value.toISOString();
    } else {
      apiData[key] = value;
    }
  });

  const response = await fetch(`/api/corrosion/coupons/${couponId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to update coupon: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Delete a coupon
 */
export async function deleteCoupon(couponId: string): Promise<void> {
  const response = await fetch(`/api/corrosion/coupons/${couponId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to delete coupon: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Record removal of a coupon
 */
export async function recordCouponRemoval(
  couponId: string,
  removalDate: Date,
  notes?: string
): Promise<CorrosionCoupon> {
  const response = await fetch(`/api/corrosion/coupons/${couponId}/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      actual_removal_date: removalDate.toISOString(),
      notes
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to record coupon removal: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}