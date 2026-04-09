import { useState, useEffect, useCallback } from 'react'

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetcher()
      setState({ data, loading: false, error: null })
    } catch (e) {
      setState({
        data: null,
        loading: false,
        error: e instanceof Error ? e.message : 'Error desconocido',
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { run() }, [run])

  return { ...state, refetch: run }
}
