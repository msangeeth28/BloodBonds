export const LOCATIONS = {
  Hyderabad: ["Gachibowli", "Kondapur", "Madhapur", "Banjara Hills", "Jubilee Hills", "HITEC City", "Secunderabad"],
  Bangalore: ["Whitefield", "Electronic City", "Koramangala", "Indiranagar", "HSR Layout", "BTM Layout"],
  Mumbai:    ["Andheri", "Bandra", "Thane", "Navi Mumbai", "Borivali", "Kurla"],
  Delhi:     ["Connaught Place", "Dwarka", "Rohini", "Saket", "Lajpat Nagar", "Pitampura"],
  Chennai:   ["T. Nagar", "Anna Nagar", "Velachery", "Adyar", "Tambaram", "Porur"],
  Pune:      ["Hinjewadi", "Kothrud", "Wakad", "Baner", "Viman Nagar", "Hadapsar"],
};

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const BLOOD_COMPATIBILITY = {
  "A+":  ["A+", "A-", "O+", "O-"],
  "A-":  ["A-", "O-"],
  "B+":  ["B+", "B-", "O+", "O-"],
  "B-":  ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "O+":  ["O+", "O-"],
  "O-":  ["O-"],
};

// With Vite proxy configured, we use a relative path so all /api requests
// go through the dev server → backend. Works in both dev and production builds.
export const API_BASE = "/api";
