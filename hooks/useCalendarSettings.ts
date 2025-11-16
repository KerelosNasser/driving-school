import { useQuery } from '@tanstack/react-query';

/**
 * Simple hook to fetch calendar settings (no real-time for now)
 */
export function useCalendarSettings() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['calendar-settings'],
    queryFn: async () => {
      console.log('🔄 [useCalendarSettings] Fetching calendar settings...');
      
      const response = await fetch('/api/calendar/settings');
      if (!response.ok) {
        throw new Error(`Failed to fetch calendar settings: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [useCalendarSettings] Settings received:', data);
      
      return data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    settings: data,
    isLoading,
    error,
    refetch,
  };
}


