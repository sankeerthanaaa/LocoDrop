import { useState, useEffect, useRef } from 'react';

/**
 * Custom React hook for debounced address searching against the Photon API.
 * Handles loading, error states, and cancels stale in-flight requests.
 *
 * @returns {{
 *   query: string,
 *   setQuery: (q: string) => void,
 *   suggestions: Array<{id: string, formatted: string, name: string, city: string, country: string, lat: number, lng: number}>,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useAddressSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Input minimum length validation (2 characters)
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Cancel the previous active request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 400ms debounce buffer to limit API rate usage and optimize typing UX
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=5`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('Autocomplete service returned an error status.');
        }

        const data = await response.json();
        
        // Parse OSM/Photon GeoJSON coordinates
        const items = (data.features || []).map((feature) => {
          const props = feature.properties || {};
          const geom = feature.geometry || {};
          const coords = geom.coordinates || []; // [longitude, latitude] in GeoJSON format

          // Assemble a human-readable address line
          const parts = [];
          if (props.name) parts.push(props.name);
          if (props.street) {
            const num = props.housenumber ? ` ${props.housenumber}` : '';
            parts.push(`${props.street}${num}`);
          }
          if (props.city || props.town || props.village) {
            parts.push(props.city || props.town || props.village);
          }
          if (props.state) parts.push(props.state);
          if (props.country) parts.push(props.country);

          const formatted = parts.filter(Boolean).join(', ');

          return {
            id: props.osm_id?.toString() || Math.random().toString(36).substring(2, 9),
            formatted,
            name: props.name || '',
            city: props.city || props.town || '',
            country: props.country || '',
            lat: coords[1], // GeoJSON longitude is index 0, latitude is index 1
            lng: coords[0],
          };
        });

        // Remove duplicates by matching formatted address strings
        const uniqueItems = [];
        const seen = new Set();
        for (const item of items) {
          if (!seen.has(item.formatted)) {
            seen.add(item.formatted);
            uniqueItems.push(item);
          }
        }

        setSuggestions(uniqueItems);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching autocomplete suggestions:', err);
          setError(err.message || 'Unable to retrieve location suggestions.');
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [query]);

  return {
    query,
    setQuery,
    suggestions,
    loading,
    error,
  };
}
