import { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { fetchRoute } from '../../utils/routeService'

// Fix Leaflet default icon broken in Vite/CRA
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// CSS style element content for animations
const pulseStyle = `
  @keyframes pulse-brand {
    0% { transform: scale(0.85); opacity: 0.9; }
    70% { transform: scale(1.6); opacity: 0; }
    100% { transform: scale(0.85); opacity: 0; }
  }
  @keyframes pulse-green {
    0% { transform: scale(0.85); opacity: 0.9; }
    70% { transform: scale(1.6); opacity: 0; }
    100% { transform: scale(0.85); opacity: 0; }
  }
  @keyframes pulse-amber {
    0% { transform: scale(0.8); opacity: 0.85; }
    70% { transform: scale(1.7); opacity: 0; }
    100% { transform: scale(0.8); opacity: 0; }
  }
`

// Modern delivery-style pins with custom CSS ripple animations
const pickupIcon = new L.DivIcon({
  html: `
    <div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;">
      <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(205,242,2,0.25);animation:pulse-brand 2s infinite"></div>
      <div style="position:absolute;width:11px;height:11px;border-radius:50%;background:#CDF202;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>
    </div>
  `,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const dropIcon = new L.DivIcon({
  html: `
    <div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;">
      <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(34,197,94,0.25);animation:pulse-green 2s infinite"></div>
      <div style="position:absolute;width:11px;height:11px;border-radius:50%;background:#22C55E;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>
    </div>
  `,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const agentIcon = new L.DivIcon({
  html: `
    <div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;">
      <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:rgba(251,209,90,0.3);animation:pulse-amber 2s infinite"></div>
      <div style="position:absolute;width:20px;height:20px;border-radius:50%;background:#FBD15A;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#191B1D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
          <circle cx="5.5" cy="18" r="2.5" />
          <circle cx="18.5" cy="18" r="2.5" />
          <path d="M5.5 18l5-6.5h6l2 6.5" />
          <path d="M10.5 11.5l1.5-4.5h4" />
        </svg>
      </div>
    </div>
  `,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

// Auto-adjust zoom and bounds to keep all points visible
const MapBoundsManager = ({ pickupCoords, dropCoords, agentCoords }) => {
  const map = useMap()
  
  useEffect(() => {
    const points = []
    if (pickupCoords) points.push([pickupCoords.lat, pickupCoords.lng])
    if (dropCoords) points.push([dropCoords.lat, dropCoords.lng])
    if (agentCoords) points.push([agentCoords.lat, agentCoords.lng])

    if (points.length >= 2) {
      map.fitBounds(points, { 
        padding: [50, 50], 
        maxZoom: 16,
        animate: true,
        duration: 1.2
      })
    } else if (points.length === 1) {
      map.setView(points[0], 14, { animate: true })
    }
  }, [pickupCoords, dropCoords, agentCoords, map])

  return null
}

const MapView = ({ 
  pickupCoords, 
  dropCoords, 
  agentCoords, 
  status,
  pickupDraggable = false,
  dropDraggable = false,
  onPickupDragEnd,
  onDropDragEnd
}) => {
  const [deliveryRoute, setDeliveryRoute] = useState([])
  const [agentRoute, setAgentRoute] = useState([])

  const pickupRef = useRef(null)
  const dropRef = useRef(null)

  const pickupEventHandlers = useMemo(() => ({
    dragend() {
      const marker = pickupRef.current
      if (marker != null && onPickupDragEnd) {
        const latLng = marker.getLatLng()
        onPickupDragEnd({ lat: latLng.lat, lng: latLng.lng })
      }
    }
  }), [onPickupDragEnd])

  const dropEventHandlers = useMemo(() => ({
    dragend() {
      const marker = dropRef.current
      if (marker != null && onDropDragEnd) {
        const latLng = marker.getLatLng()
        onDropDragEnd({ lat: latLng.lat, lng: latLng.lng })
      }
    }
  }), [onDropDragEnd])

  // Fetch the primary delivery route (Pickup to Drop)
  useEffect(() => {
    if (!pickupCoords || !dropCoords) {
      setDeliveryRoute([])
      return
    }

    const loadPrimaryRoute = async () => {
      try {
        const routeData = await fetchRoute(pickupCoords, dropCoords)
        setDeliveryRoute(routeData.coordinates)
      } catch (err) {
        console.error('Failed to load primary route:', err)
      }
    }

    loadPrimaryRoute()
  }, [pickupCoords?.lat, pickupCoords?.lng, dropCoords?.lat, dropCoords?.lng])

  // Fetch agent routing (Rider to Pickup or Rider to Drop)
  useEffect(() => {
    if (!agentCoords) {
      setAgentRoute([])
      return
    }

    const loadAgentRoute = async () => {
      try {
        // If order status is accepted, route is Agent -> Pickup
        // If order status is picked_up, route is Agent -> Drop
        const destination = status === 'picked_up' ? dropCoords : pickupCoords
        
        if (destination) {
          const routeData = await fetchRoute(agentCoords, destination)
          setAgentRoute(routeData.coordinates)
        }
      } catch (err) {
        console.error('Failed to load agent route:', err)
      }
    }

    loadAgentRoute()
  }, [
    agentCoords?.lat, 
    agentCoords?.lng, 
    pickupCoords?.lat, 
    pickupCoords?.lng, 
    dropCoords?.lat, 
    dropCoords?.lng, 
    status
  ])

  // If no coordinates are present, display a premium empty state instead of default coordinates
  if (!pickupCoords && !dropCoords && !agentCoords) {
    return (
      <div
        className="map-empty-state"
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          color: 'var(--text-3)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontWeight: '600', color: 'var(--text-2)', fontSize: 13, marginBottom: 4 }}>
          Select an address first
        </div>
        <div style={{ fontSize: 11, maxWidth: 220, color: 'var(--text-3)', lineHeight: 1.4 }}>
          Choose your pickup and drop locations to visualize your route in real-time.
        </div>
      </div>
    )
  }

  // Derive center dynamically from available points
  const defaultCenter = pickupCoords
    ? [pickupCoords.lat, pickupCoords.lng]
    : dropCoords
    ? [dropCoords.lat, dropCoords.lng]
    : agentCoords
    ? [agentCoords.lat, agentCoords.lng]
    : [0, 0]

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Dynamic Keyframes Injection */}
      <style>{pulseStyle}</style>

      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors & CartoDB'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Pickup Marker */}
        {pickupCoords && (
          <Marker 
            position={[pickupCoords.lat, pickupCoords.lng]} 
            icon={pickupIcon}
            draggable={pickupDraggable}
            eventHandlers={pickupEventHandlers}
            ref={pickupRef}
          >
            <Popup>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: '600' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                </svg>
                Pickup Point
              </div>
              {pickupDraggable && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Drag to adjust location pin</div>}
            </Popup>
          </Marker>
        )}

        {/* Drop Marker */}
        {dropCoords && (
          <Marker 
            position={[dropCoords.lat, dropCoords.lng]} 
            icon={dropIcon}
            draggable={dropDraggable}
            eventHandlers={dropEventHandlers}
            ref={dropRef}
          >
            <Popup>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: '600' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                </svg>
                Drop Point
              </div>
              {dropDraggable && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Drag to adjust location pin</div>}
            </Popup>
          </Marker>
        )}

        {/* Moving Delivery Agent Marker */}
        {agentCoords && (
          <Marker position={[agentCoords.lat, agentCoords.lng]} icon={agentIcon}>
            <Popup>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: '600' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FBD15A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="5.5" cy="18" r="2.5" /><circle cx="18.5" cy="18" r="2.5" />
                  <path d="M5.5 18l5-6.5h6l2 6.5" /><path d="M10.5 11.5l1.5-4.5h4" />
                </svg>
                Delivery Rider
              </div>
              {status && <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: 4 }}>Status: {status.replace('_', ' ')}</div>}
            </Popup>
          </Marker>
        )}

        {/* Primary Delivery Road Path */}
        {deliveryRoute.length >= 2 && (
          <Polyline 
            positions={deliveryRoute} 
            color="#CDF202" 
            weight={4.5} 
            opacity={0.85} 
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Agent Approach Road Path */}
        {agentRoute.length >= 2 && (
          <Polyline 
            positions={agentRoute} 
            color="#FBD15A" 
            weight={4} 
            opacity={0.8} 
            dashArray="8, 6"
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Smart Bounds Centering and Zoom */}
        <MapBoundsManager 
          pickupCoords={pickupCoords} 
          dropCoords={dropCoords} 
          agentCoords={agentCoords} 
        />
      </MapContainer>
    </div>
  )
}

export default MapView