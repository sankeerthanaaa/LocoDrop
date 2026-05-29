import { useState, useEffect, useRef } from 'react';
import { useAddressSearch } from '../../hooks/useAddressSearch';

/**
 * AddressAutocomplete component for hyper-local pickup and drop address searches.
 * Handles dropdown suggestions, active selection via keyboard, and loading/error feedback.
 *
 * @param {object} props
 * @param {string} props.label - Field label
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.value - Selected address string (two-way bound)
 * @param {function(string)} props.onChange - Invoked when text changes
 * @param {function({address: string, coords: {lat: number, lng: number}})} props.onSelect - Invoked when a suggestion is selected
 * @param {string} [props.error] - Input-specific error messages
 * @param {boolean} [props.required=false] - Makes input required in UX
 * @param {string} props.id - Unique ID for accessibility and testing labels
 */
export default function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  error,
  required = false,
  id,
}) {
  const { query, setQuery, suggestions, loading, error: searchError } = useAddressSearch();
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal debounced query state with the incoming parent value
  useEffect(() => {
    setQuery(value || '');
  }, [value, setQuery]);

  // Click outside listener to close the dropdown when focus changes
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    setShowDropdown(true);
    setActiveIndex(-1);
  };

  const handleSelectSuggestion = (suggestion) => {
    onSelect({
      address: suggestion.formatted,
      coords: {
        lat: suggestion.lat,
        lng: suggestion.lng,
      },
    });
    setShowDropdown(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="autocomplete-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <label className="form-label" htmlFor={id}>
        {label} {required && '*'}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          id={id}
          className={`form-input autocomplete-input ${error ? 'error' : ''}`}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={`${id}-listbox`}
          aria-haspopup="listbox"
          style={{ width: '100%', paddingRight: loading ? '32px' : '12px' }}
        />
        {loading && (
          <div
            className="autocomplete-spinner"
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <div
              className="spinner"
              style={{
                width: 14,
                height: 14,
                borderWidth: '2px',
                margin: 0,
              }}
            />
          </div>
        )}
      </div>

      {showDropdown && query.trim().length >= 2 && (
        <ul
          id={`${id}-listbox`}
          className="autocomplete-dropdown"
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-md)',
            marginTop: 4,
            padding: 4,
            listStyle: 'none',
            maxHeight: 200,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
          }}
        >
          {suggestions.length === 0 && !loading && (
            <li
              className="autocomplete-no-results"
              style={{
                padding: '8px 12px',
                color: 'var(--text-3)',
                fontSize: '12px',
              }}
            >
              No addresses found
            </li>
          )}
          {suggestions.map((s, index) => (
            <li
              key={s.id}
              role="option"
              aria-selected={activeIndex === index}
              onClick={() => handleSelectSuggestion(s)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`autocomplete-item ${activeIndex === index ? 'active' : ''}`}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
                fontSize: '12px',
                background: activeIndex === index ? 'var(--accent-light)' : 'transparent',
                color: activeIndex === index ? 'var(--accent)' : 'var(--text-1)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span style={{ fontSize: 13, flexShrink: 0 }}>📍</span>
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {s.formatted}
              </div>
            </li>
          ))}
        </ul>
      )}
      {(error || searchError) && (
        <span
          className="form-error-msg"
          style={{
            color: 'var(--red)',
            fontSize: '11px',
            marginTop: 4,
            display: 'block',
          }}
        >
          {error || searchError}
        </span>
      )}
    </div>
  );
}
