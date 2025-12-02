// Common types used across the application

type Clinic = {
  id: string;
  name: string;
  address: string;
  // Add other clinic properties as needed
};

type RootState = {
  // Define your root state shape here
  // This should match your Redux store's root state
  clinic: any;
  booking: any;
  auth: any;
  // Add other slices as needed
};

export type { Clinic, RootState };
