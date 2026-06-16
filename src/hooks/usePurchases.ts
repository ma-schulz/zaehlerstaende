import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Purchase, PurchaseInput } from '../types';

const key = (meterId: string) => ['purchases', meterId];

export function usePurchases(meterId: string | undefined) {
  return useQuery({
    queryKey: key(meterId ?? ''),
    enabled: !!meterId,
    queryFn: async (): Promise<Purchase[]> => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('meter_id', meterId)
        .order('purchased_at', { ascending: true });
      if (error) throw error;
      return data as Purchase[];
    },
  });
}

/** Alle Zukäufe des Nutzers in einer Abfrage (für die Dashboard-Summe). */
export function useAllPurchases() {
  return useQuery({
    queryKey: ['purchases', 'all'],
    queryFn: async (): Promise<Purchase[]> => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('purchased_at', { ascending: true });
      if (error) throw error;
      return data as Purchase[];
    },
  });
}

export function useCreatePurchase(meterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PurchaseInput): Promise<Purchase> => {
      const { data, error } = await supabase
        .from('purchases')
        .insert({ ...input, meter_id: meterId })
        .select()
        .single();
      if (error) throw error;
      return data as Purchase;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchases'] }),
  });
}

export function useUpdatePurchase(_meterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PurchaseInput }): Promise<Purchase> => {
      const { data, error } = await supabase
        .from('purchases')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Purchase;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchases'] }),
  });
}

export function useDeletePurchase(_meterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('purchases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchases'] }),
  });
}
