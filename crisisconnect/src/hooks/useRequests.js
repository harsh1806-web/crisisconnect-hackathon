import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  subscribeToRequests,
  createCrisisRequest,
  updateRequestStatus,
  assignVolunteerToRequest,
} from '../services/requestService';

/**
 * Custom React hook for live emergency requests
 *
 * @param {Object} initialFilters - Optional initial filter object { status, category, urgency }
 * @returns {Object} { requests, loading, error, filters, setFilters, createRequest, updateStatus, assignVolunteer }
 */
export function useRequests(initialFilters = {}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const filterStatus = filters?.status;
  const filterCategory = filters?.category;
  const filterUrgency = filters?.urgency;

  const activeFilters = useMemo(
    () => ({
      status: filterStatus,
      category: filterCategory,
      urgency: filterUrgency,
    }),
    [filterStatus, filterCategory, filterUrgency]
  );

  useEffect(() => {
    const unsubscribe = subscribeToRequests((data) => {
      setRequests(data);
      setLoading(false);
    }, activeFilters);

    return () => unsubscribe();
  }, [activeFilters]);

  const createRequest = useCallback(async (requestData, currentUser) => {
    return await createCrisisRequest(requestData, currentUser);
  }, []);

  const updateStatus = useCallback(async (requestId, status, updatedBy) => {
    return await updateRequestStatus(requestId, status, updatedBy);
  }, []);

  const assignVolunteer = useCallback(async (requestId, volunteerUser) => {
    return await assignVolunteerToRequest(requestId, volunteerUser);
  }, []);

  return {
    requests,
    loading,
    error,
    setError,
    filters,
    setFilters,
    createRequest,
    updateStatus,
    assignVolunteer,
  };
}

export default useRequests;
