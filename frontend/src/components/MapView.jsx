import { MapPin, ExternalLink } from 'lucide-react';

export default function MapView({ address, compact = false }) {


  const addressStr = [address?.street, address?.city, address?.state, address?.pincode]
    .filter(Boolean)
    .join(', ');

  const query = encodeURIComponent(addressStr);
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=68.0%2C8.0%2C97.0%2C37.0&layer=mapnik&marker=${query}`;
  const searchUrl = `https://www.openstreetmap.org/search?query=${query}`;

  if (!addressStr) {
    return (
      <div className="map-placeholder">
        <MapPin size={24} className="map-placeholder-icon" />
        <p className="map-placeholder-text">No address provided</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="map-compact">
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="map-compact-link"
        >
          <MapPin size={14} />
          <span className="map-compact-address">{addressStr}</span>
          <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div className="map-frame">
        <iframe
          src={mapUrl}
          title="Delivery Location"
          width="100%"
          height="240"
          style={{ border: 0, borderRadius: '12px' }}
          loading="lazy"
          allowFullScreen
        />
      </div>
      <div className="map-address-bar">
        <MapPin size={14} className="map-address-icon" />
        <span className="map-address-text">{addressStr}</span>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="map-open-link"
        >
          <ExternalLink size={14} />
          Open in Maps
        </a>
      </div>
    </div>
  );
}
