import { useState, useEffect, useCallback } from 'react';

/**
 * Custom React hook to retrieve and monitor device GPS location
 *
 * @param {Object} options - { enableHighAccuracy, timeout, maximumAge, watch }
 * @returns {Object} { coordinates: { lat, lng }, latitude, longitude, accuracy, loading, error, getLocation }
 */
export function useGeolocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options;

  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(typeof window !== 'undefined' && 'geolocation' in navigator);
  const [error, setError] = useState(
    typeof window !== 'undefined' && !('geolocation' in navigator)
      ? 'Geolocation is not supported by your browser'
      : null
  );

  const onSuccess = useCallback((position) => {
    setCoordinates({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
    setAccuracy(position.coords.accuracy);
    setLoading(false);
    setError(null);
  }, []);

  const onError = useCallback((err) => {
    let message = 'Unable to retrieve location';
    switch (err.code) {
      case 1: // PERMISSION_DENIED
        message = 'Location permission denied by user';
        break;
      case 2: // POSITION_UNAVAILABLE
        message = 'Location information is unavailable';
        break;
      case 3: // TIMEOUT
        message = 'Location request timed out';
        break;
      default:
        message = err.message || message;
    }
    setError(message);
    setLoading(false);
  }, []);

  const getLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return;
    }

    const geoOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    if (watch) {
      const watcherId = navigator.geolocation.watchPosition(onSuccess, onError, geoOptions);
      return () => navigator.geolocation.clearWatch(watcherId);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions);
    }
  }, [watch, enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);

  return {
    coordinates,
    latitude: coordinates.lat,
    longitude: coordinates.lng,
    accuracy,
    loading,
    error,
    getLocation,
  };
}

export default useGeolocation;
