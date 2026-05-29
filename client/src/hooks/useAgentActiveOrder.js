import { useState, useEffect, useCallback } from 'react';
import { getAgentActive } from '../api/orders';

/**
 * Custom React hook to retrieve and manage the active order assigned to the current agent.
 * Handles loading states, network/server errors, and provides a manual refetch helper.
 *
 * @returns {{
 *   activeOrder: object|null,
 *   loading: boolean,
 *   error: string|null,
 *   refetch: () => Promise<void>
 * }}
 */
export default function useAgentActiveOrder() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAgentActive();
      // Backend returns the order object or null if there is no active assignment
      setActiveOrder(response.data || null);
    } catch (err) {
      console.error('Error fetching active agent order:', err);
      // Ensure we expose readable status messages
      if (err.response?.status === 403) {
        setError('Unauthorized: Only agents can access active delivery profiles.');
      } else {
        setError(err.response?.data?.message || 'Failed to retrieve active delivery details.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveOrder();
  }, [fetchActiveOrder]);

  return {
    activeOrder,
    loading,
    error,
    refetch: fetchActiveOrder,
  };
}
