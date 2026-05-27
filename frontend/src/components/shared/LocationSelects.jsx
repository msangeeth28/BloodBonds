import { LOCATIONS } from "../../utils/constants";

// Reusable city + sublocation pair — used in forms across the app
export default function LocationSelects({ city, subLocation, onChange, required = true }) {
  return (
    <>
      <div className="form-group">
        <label>City</label>
        <select
          value={city}
          onChange={(e) => onChange("city", e.target.value, "subLocation", "")}
          required={required}
        >
          <option value="">Select City</option>
          {Object.keys(LOCATIONS).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {city && (
        <div className="form-group">
          <label>Area / Sub-location</label>
          <select
            value={subLocation}
            onChange={(e) => onChange("subLocation", e.target.value)}
            required={required}
          >
            <option value="">Select Area</option>
            {LOCATIONS[city]?.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
      )}
    </>
  );
}
