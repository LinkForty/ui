import { useState, useEffect } from 'react';
import './DeviceSimulator.css';

interface ApiClient {
  get: (url: string) => Promise<{ data: any }>;
  post: (url: string, data: any) => Promise<{ data: any }>;
  getCurrentUser: () => { userId: string } | null;
}

interface DeviceSimulatorProps {
  apiClient: ApiClient;
}

interface SimulationResult {
  simulation: {
    linkId: string;
    shortCode: string;
    title: string;
    isActive: boolean;
    expiresAt: string | null;
  };
  input: {
    deviceType: string;
    userAgent: string;
    country: string;
    language: string;
    ipAddress: string;
  };
  detection: {
    detectedDevice: string;
    detectionMethod: string;
  };
  targeting: {
    hasRules: boolean;
    rules: any;
    matched: boolean;
    details: {
      countryMatch: boolean | null;
      deviceMatch: boolean | null;
      languageMatch: boolean | null;
    };
  };
  redirect: {
    wouldRedirect: boolean;
    finalUrl: string | null;
    redirectReason: string;
    utmParametersAdded: boolean;
    utmParameters: any;
  };
  warnings: string[];
}

interface UserAgent {
  name: string;
  userAgent: string;
  device: string;
}

interface Country {
  code: string;
  name: string;
}

interface Language {
  code: string;
  name: string;
}

export function DeviceSimulator({ apiClient }: DeviceSimulatorProps) {
  const [links, setLinks] = useState<any[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  const [deviceMode, setDeviceMode] = useState<'preset' | 'custom'>('preset');
  const [presetDevice, setPresetDevice] = useState<'ios' | 'android' | 'web'>('ios');
  const [customUserAgent, setCustomUserAgent] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [ipAddress, setIpAddress] = useState<string>('');

  const [userAgents, setUserAgents] = useState<{ ios: UserAgent[]; android: UserAgent[]; web: UserAgent[] }>({ ios: [], android: [], web: [] });
  const [countries, setCountries] = useState<Country[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedPresetUA, setSelectedPresetUA] = useState<string>('');

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch user's links
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await apiClient.get('/api/links');
        setLinks(response.data);
        if (response.data.length > 0) {
          setSelectedLinkId(response.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch links:', err);
      }
    };
    fetchLinks();
  }, []);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [uaRes, countriesRes, languagesRes] = await Promise.all([
          apiClient.get('/api/debug/user-agents'),
          apiClient.get('/api/debug/countries'),
          apiClient.get('/api/debug/languages'),
        ]);
        setUserAgents(uaRes.data);
        setCountries(countriesRes.data.countries);
        setLanguages(languagesRes.data.languages);

        // Set default preset User-Agent
        if (uaRes.data.ios && uaRes.data.ios.length > 0) {
          setSelectedPresetUA(uaRes.data.ios[0].userAgent);
        }
      } catch (err) {
        console.error('Failed to fetch dropdown data:', err);
      }
    };
    fetchDropdownData();
  }, []);

  // Update preset User-Agent when device type changes
  useEffect(() => {
    if (userAgents[presetDevice] && userAgents[presetDevice].length > 0) {
      setSelectedPresetUA(userAgents[presetDevice][0].userAgent);
    }
  }, [presetDevice, userAgents]);

  const handleSimulate = async () => {
    if (!selectedLinkId) {
      setError('Please select a link to test');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: any = {
        linkId: selectedLinkId,
        userId: apiClient.getCurrentUser()?.userId || '',
        country: selectedCountry,
        language: selectedLanguage,
      };

      if (ipAddress) {
        payload.ipAddress = ipAddress;
      }

      if (deviceMode === 'preset') {
        payload.deviceType = presetDevice;
        payload.userAgent = selectedPresetUA;
      } else {
        payload.userAgent = customUserAgent;
      }

      const response = await apiClient.post('/api/debug/simulate', payload);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="device-simulator">
      <div className="simulator-header">
        <h2>🧪 Device Simulator</h2>
        <p>Test how your links behave on different devices without physical hardware</p>
      </div>

      <div className="simulator-form">
        {/* Link Selection */}
        <div className="form-group">
          <label htmlFor="link-select">Link to Test</label>
          <select
            id="link-select"
            value={selectedLinkId}
            onChange={(e) => setSelectedLinkId(e.target.value)}
            className="form-control"
          >
            {links.length === 0 && <option>No links available</option>}
            {links.map((link) => (
              <option key={link.id} value={link.id}>
                {link.short_code} - {link.title || link.original_url}
              </option>
            ))}
          </select>
        </div>

        {/* Device Type */}
        <div className="form-group">
          <label>Device Simulation</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="preset"
                checked={deviceMode === 'preset'}
                onChange={() => setDeviceMode('preset')}
              />
              Use Preset Device
            </label>
            <label>
              <input
                type="radio"
                value="custom"
                checked={deviceMode === 'custom'}
                onChange={() => setDeviceMode('custom')}
              />
              Custom User-Agent
            </label>
          </div>
        </div>

        {deviceMode === 'preset' ? (
          <>
            <div className="form-group">
              <label htmlFor="device-type">Device Type</label>
              <select
                id="device-type"
                value={presetDevice}
                onChange={(e) => setPresetDevice(e.target.value as 'ios' | 'android' | 'web')}
                className="form-control"
              >
                <option value="ios">📱 iOS (iPhone/iPad)</option>
                <option value="android">🤖 Android</option>
                <option value="web">💻 Web (Desktop)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="preset-ua">Preset User-Agent</label>
              <select
                id="preset-ua"
                value={selectedPresetUA}
                onChange={(e) => setSelectedPresetUA(e.target.value)}
                className="form-control"
              >
                {userAgents[presetDevice]?.map((ua, index) => (
                  <option key={index} value={ua.userAgent}>
                    {ua.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="form-group">
            <label htmlFor="custom-ua">Custom User-Agent String</label>
            <textarea
              id="custom-ua"
              value={customUserAgent}
              onChange={(e) => setCustomUserAgent(e.target.value)}
              className="form-control"
              rows={3}
              placeholder="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ..."
            />
          </div>
        )}

        {/* Country */}
        <div className="form-group">
          <label htmlFor="country">Country (Geolocation)</label>
          <select
            id="country"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="form-control"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name} ({country.code})
              </option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div className="form-group">
          <label htmlFor="language">Language</label>
          <select
            id="language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="form-control"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.code})
              </option>
            ))}
          </select>
        </div>

        {/* IP Address (Optional) */}
        <div className="form-group">
          <label htmlFor="ip-address">IP Address (Optional)</label>
          <input
            id="ip-address"
            type="text"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            className="form-control"
            placeholder="192.168.1.1"
          />
          <small className="form-help-text">Leave empty to use country for geolocation</small>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading || !selectedLinkId}
          className="btn btn-primary"
        >
          {loading ? 'Simulating...' : '🚀 Run Simulation'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="simulation-error">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="simulation-result">
          <h3>Simulation Results</h3>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="result-warnings">
              <h4>⚠️ Warnings</h4>
              <ul>
                {result.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Link Info */}
          <div className="result-section">
            <h4>📎 Link Information</h4>
            <table className="result-table">
              <tbody>
                <tr>
                  <td><strong>Short Code:</strong></td>
                  <td>{result.simulation.shortCode}</td>
                </tr>
                <tr>
                  <td><strong>Title:</strong></td>
                  <td>{result.simulation.title || 'No title'}</td>
                </tr>
                <tr>
                  <td><strong>Active:</strong></td>
                  <td>{result.simulation.isActive ? '✅ Yes' : '❌ No'}</td>
                </tr>
                {result.simulation.expiresAt && (
                  <tr>
                    <td><strong>Expires At:</strong></td>
                    <td>{new Date(result.simulation.expiresAt).toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Detection */}
          <div className="result-section">
            <h4>🔍 Device Detection</h4>
            <table className="result-table">
              <tbody>
                <tr>
                  <td><strong>Detected Device:</strong></td>
                  <td className={`device-badge device-${result.detection.detectedDevice}`}>
                    {result.detection.detectedDevice.toUpperCase()}
                  </td>
                </tr>
                <tr>
                  <td><strong>Detection Method:</strong></td>
                  <td>{result.detection.detectionMethod}</td>
                </tr>
                <tr>
                  <td><strong>User-Agent:</strong></td>
                  <td className="code-text">{result.input.userAgent}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Targeting */}
          <div className="result-section">
            <h4>🎯 Targeting Rules</h4>
            <table className="result-table">
              <tbody>
                <tr>
                  <td><strong>Has Targeting Rules:</strong></td>
                  <td>{result.targeting.hasRules ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                  <td><strong>Rules Matched:</strong></td>
                  <td>{result.targeting.matched ? '✅ Yes' : '❌ No'}</td>
                </tr>
                {result.targeting.details.countryMatch !== null && (
                  <tr>
                    <td><strong>Country Match:</strong></td>
                    <td>{result.targeting.details.countryMatch ? '✅' : '❌'} ({result.input.country})</td>
                  </tr>
                )}
                {result.targeting.details.deviceMatch !== null && (
                  <tr>
                    <td><strong>Device Match:</strong></td>
                    <td>{result.targeting.details.deviceMatch ? '✅' : '❌'} ({result.detection.detectedDevice})</td>
                  </tr>
                )}
                {result.targeting.details.languageMatch !== null && (
                  <tr>
                    <td><strong>Language Match:</strong></td>
                    <td>{result.targeting.details.languageMatch ? '✅' : '❌'} ({result.input.language})</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Redirect */}
          <div className="result-section">
            <h4>🔄 Redirect Behavior</h4>
            <table className="result-table">
              <tbody>
                <tr>
                  <td><strong>Would Redirect:</strong></td>
                  <td>{result.redirect.wouldRedirect ? '✅ Yes' : '❌ No (404)'}</td>
                </tr>
                {result.redirect.wouldRedirect && (
                  <>
                    <tr>
                      <td><strong>Redirect Reason:</strong></td>
                      <td>{result.redirect.redirectReason}</td>
                    </tr>
                    <tr>
                      <td><strong>Final URL:</strong></td>
                      <td className="final-url">
                        <a href={result.redirect.finalUrl!} target="_blank" rel="noopener noreferrer">
                          {result.redirect.finalUrl}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>UTM Parameters:</strong></td>
                      <td>{result.redirect.utmParametersAdded ? 'Added' : 'None'}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
