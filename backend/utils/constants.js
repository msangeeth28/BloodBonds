// Blood group compatibility table — donor can give to recipient
const BLOOD_COMPATIBILITY = {
  "A+":  ["A+", "A-", "O+", "O-"],
  "A-":  ["A-", "O-"],
  "B+":  ["B+", "B-", "O+", "O-"],
  "B-":  ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "O+":  ["O+", "O-"],
  "O-":  ["O-"],
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const LOCATIONS = {
  Hyderabad: ["Gachibowli", "Kondapur", "Madhapur", "Banjara Hills", "Jubilee Hills", "HITEC City", "Secunderabad"],
  Bangalore: ["Whitefield", "Electronic City", "Koramangala", "Indiranagar", "HSR Layout", "BTM Layout"],
  Mumbai:    ["Andheri", "Bandra", "Thane", "Navi Mumbai", "Borivali", "Kurla"],
  Delhi:     ["Connaught Place", "Dwarka", "Rohini", "Saket", "Lajpat Nagar", "Pitampura"],
  Chennai:   ["T. Nagar", "Anna Nagar", "Velachery", "Adyar", "Tambaram", "Porur"],
  Pune:      ["Hinjewadi", "Kothrud", "Wakad", "Baner", "Viman Nagar", "Hadapsar"],
};

module.exports = { BLOOD_COMPATIBILITY, BLOOD_GROUPS, LOCATIONS };
