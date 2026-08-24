"use client";

import { useState, useEffect, useCallback } from "react";
import { message } from "antd";

export function useTableData<T>(fetchFn: () => Promise<T[]>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchFn());
    } catch {
      message.error("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh, setData };
}
