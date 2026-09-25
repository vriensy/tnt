import { useCallback, useEffect, useState } from 'react';
import { addCustomer, deleteCustomer, getAllCustomers, updateCustomerName } from '../db';
import type { Customer } from '../types';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await getAllCustomers();
    setCustomers(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addOrGetCustomer = useCallback(
    async (name: string): Promise<Customer> => {
      const customer = await addCustomer(name);
      await refresh();
      return customer;
    },
    [refresh],
  );

  const renameCustomer = useCallback(
    async (id: number, name: string): Promise<void> => {
      await updateCustomerName(id, name);
      await refresh();
    },
    [refresh],
  );

  const removeCustomer = useCallback(
    async (id: number): Promise<void> => {
      await deleteCustomer(id);
      await refresh();
    },
    [refresh],
  );

  return { customers, loading, addOrGetCustomer, renameCustomer, removeCustomer, refresh };
}
