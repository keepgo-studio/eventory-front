import { useState, useEffect } from "react";

export function useFetch<F extends (...args: any) => Promise<any>>(
  fetchFn: F,
  ...args: Parameters<F>
) {
  const [data, setData] = useState<Awaited<ReturnType<F>> | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setIsLoading(true);

      try {
        const result = await fetchFn(...args);
        if (isMounted) setData(result);
      } catch (err) {
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [fetchFn, JSON.stringify(args)]);

  return { data, isLoading, error };
}
