import { useState, useEffect, useRef } from 'react';
import './LiveRequestInspector.css';

interface ClickEventData {
  eventId: string;
  timestamp: string;
  linkId: string;
  shortCode: string;
  userId: string;
  organizationId?: string;
  ipAddress: string;
  userAgent: string;
  country?: string;
  city?: string;
  deviceType: 'ios' | 'android' | 'web';
  platform?: string;
  browser?: string;
  redirectUrl: string;
  redirectReason: string;
  targetingMatched: boolean;
  utmParameters?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  referer?: string;
  language?: string;
}

interface WebSocketMessage {
  type: 'connected' | 'click_event' | 'error';
  message?: string;
  filters?: {
    userId: string;
    linkId: string;
  };
  data?: ClickEventData;
}

interface LiveRequestInspectorProps {
  apiClient: {
    getCurrentUser: () => { userId: string } | null;
    get: (url: string) => Promise<{ data: any }>;
  };
  websocketUrl?: string; // Optional for testing
}

interface Link {
  id: string;
  shortCode: string;
  title: string;
}

export function LiveRequestInspector({ apiClient, websocketUrl }: LiveRequestInspectorProps) {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [events, setEvents] = useState<ClickEventData[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string>('all');
  const [links, setLinks] = useState<Link[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterText, setFilterText] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<number>();

  // Get current user
  const currentUser = apiClient.getCurrentUser();
  const userId = currentUser?.userId;

  // Fetch user's links for filtering
  useEffect(() => {
    if (!userId) return;

    const fetchLinks = async () => {
      try {
        const response = await apiClient.get(`/api/links?userId=${userId}`);
        setLinks(response.data || []);
      } catch (error) {
        console.error('Failed to fetch links:', error);
      }
    };

    fetchLinks();
  }, [userId, apiClient]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  // WebSocket connection management
  useEffect(() => {
    if (!userId) {
      console.error('No userId available');
      return;
    }

    const connectWebSocket = () => {
      setConnectionStatus('connecting');

      // Determine WebSocket URL
      const baseUrl = websocketUrl || (
        window.location.protocol === 'https:'
          ? `wss://${window.location.host}`
          : `ws://${window.location.hostname}:3000`
      );

      const linkFilter = selectedLinkId !== 'all' ? `&linkId=${selectedLinkId}` : '';
      const wsUrl = `${baseUrl}/api/debug/live?userId=${userId}${linkFilter}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'connected') {
            console.log('Connection acknowledged:', message.message);
          } else if (message.type === 'click_event' && message.data) {
            setEvents((prev) => [...prev, message.data!]);
          } else if (message.type === 'error') {
            console.error('WebSocket error message:', message.message);
            setConnectionStatus('error');
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');

        // Attempt reconnection after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 3000);
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    // Cleanup on unmount or when linkId changes
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [userId, selectedLinkId, websocketUrl]);

  const clearEvents = () => {
    setEvents([]);
  };

  const getDeviceBadgeClass = (deviceType: string) => {
    switch (deviceType) {
      case 'ios': return 'device-badge-ios';
      case 'android': return 'device-badge-android';
      case 'web': return 'device-badge-web';
      default: return 'device-badge-unknown';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeString}.${ms}`;
  };

  // Filter events based on search text
  const filteredEvents = events.filter((event) => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      event.shortCode.toLowerCase().includes(searchLower) ||
      event.country?.toLowerCase().includes(searchLower) ||
      event.city?.toLowerCase().includes(searchLower) ||
      event.deviceType.toLowerCase().includes(searchLower) ||
      event.ipAddress.toLowerCase().includes(searchLower)
    );
  });

  if (!userId) {
    return (
      <div className="live-inspector-container">
        <div className="error-message">
          Please log in to use the Live Request Inspector
        </div>
      </div>
    );
  }

  return (
    <div className="live-inspector-container">
      <div className="live-inspector-header">
        <h2>Live Request Inspector</h2>
        <div className={`connection-status status-${connectionStatus}`}>
          <span className="status-indicator"></span>
          {connectionStatus === 'connected' && 'Connected'}
          {connectionStatus === 'connecting' && 'Connecting...'}
          {connectionStatus === 'disconnected' && 'Disconnected'}
          {connectionStatus === 'error' && 'Error - Retrying...'}
        </div>
      </div>

      <div className="live-inspector-controls">
        <div className="control-group">
          <label htmlFor="link-filter">Filter by Link:</label>
          <select
            id="link-filter"
            value={selectedLinkId}
            onChange={(e) => {
              setSelectedLinkId(e.target.value);
              setEvents([]); // Clear events when changing filter
            }}
            className="link-select"
          >
            <option value="all">All Links</option>
            {links.map((link) => (
              <option key={link.id} value={link.id}>
                {link.title || link.shortCode}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="search-filter">Search:</label>
          <input
            id="search-filter"
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter by shortcode, country, city, device..."
            className="search-input"
          />
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
        </div>

        <button onClick={clearEvents} className="clear-button">
          Clear Events ({filteredEvents.length})
        </button>
      </div>

      <div className="events-container">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <p>Waiting for click events...</p>
            <p className="empty-state-hint">
              {selectedLinkId !== 'all'
                ? 'Click events for the selected link will appear here in real-time.'
                : 'Click events for all your links will appear here in real-time.'}
            </p>
          </div>
        ) : (
          <div className="events-list">
            {filteredEvents.map((event) => (
              <div key={event.eventId} className="event-card">
                <div className="event-header">
                  <div className="event-time">{formatTimestamp(event.timestamp)}</div>
                  <div className="event-shortcode">/{event.shortCode}</div>
                  <div className={`device-badge ${getDeviceBadgeClass(event.deviceType)}`}>
                    {event.deviceType.toUpperCase()}
                  </div>
                </div>

                <div className="event-details">
                  <div className="detail-row">
                    <span className="detail-label">IP Address:</span>
                    <span className="detail-value">{event.ipAddress}</span>
                  </div>

                  {event.country && (
                    <div className="detail-row">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">
                        {event.city ? `${event.city}, ${event.country}` : event.country}
                      </span>
                    </div>
                  )}

                  {event.platform && (
                    <div className="detail-row">
                      <span className="detail-label">Platform:</span>
                      <span className="detail-value">{event.platform}</span>
                    </div>
                  )}

                  {event.browser && (
                    <div className="detail-row">
                      <span className="detail-label">Browser:</span>
                      <span className="detail-value">{event.browser}</span>
                    </div>
                  )}

                  {event.language && (
                    <div className="detail-row">
                      <span className="detail-label">Language:</span>
                      <span className="detail-value">{event.language}</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">Redirected to:</span>
                    <span className="detail-value redirect-url" title={event.redirectUrl}>
                      {event.redirectUrl}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Reason:</span>
                    <span className="detail-value">{event.redirectReason}</span>
                  </div>

                  {event.utmParameters && Object.keys(event.utmParameters).length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">UTM Params:</span>
                      <span className="detail-value">
                        {Object.entries(event.utmParameters)
                          .map(([key, value]) => `${key}=${value}`)
                          .join(', ')}
                      </span>
                    </div>
                  )}

                  {event.referer && (
                    <div className="detail-row">
                      <span className="detail-label">Referer:</span>
                      <span className="detail-value" title={event.referer}>
                        {event.referer}
                      </span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">User Agent:</span>
                    <span className="detail-value user-agent" title={event.userAgent}>
                      {event.userAgent}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={eventsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
