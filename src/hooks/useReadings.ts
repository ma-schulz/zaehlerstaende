import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Reading, ReadingInput } from '../types';

const key = (meterId: string) => ['readings', meterId];

export function useReadings(meterId: string | undefined) {
  return useQuery({
    queryKey: key(meterId ?? ''),
    enabled: !!meterId,
    queryFn: async (): Promise<Reading[]> => {
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('meter_id', meterId)
        .order('reading_at', { ascending: true });
      if (error) throw error;
      return data as Reading[];
    },
  });
}

/** Alle Zählerstände des Nutzers in einer Abfrage (für die Dashboard-Summe). */
export function useAllReadings() {
  return useQuery({
    queryKey: ['readings', 'all'],
    queryFn: async (): Promise<Reading[]> => {
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .order('reading_at', { ascending: true });
      if (error) throw error;
      return data as Reading[];
    },
  });
}

export function useCreateReading(meterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReadingInput): Promise<Reading> => {
      const { data, error } = await supabase
        .from('readings')
        .insert({ ...input, meter_id: meterId })
        .select()
        .single();
      if (error) throw error;
      return data as Reading;
    },
    // ['readings'] als Prefix invalidiert sowohl die Einzel- als auch die Gesamtabfrage.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['readings'] }),
  });
}

export function useUpdateReading(_meterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ReadingInput }): Promise<Reading> => {
      const { data, error } = await supabase
        .from('readings')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Reading;
    },
    // ['readings'] als Prefix invalidiert sowohl die Einzel- als auch die Gesamtabfrage.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['readings'] }),
  });
}

export function useDeleteReading(_meterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('readings').delete().eq('id', id);
      if (error) throw error;
    },
    // ['readings'] als Prefix invalidiert sowohl die Einzel- als auch die Gesamtabfrage.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['readings'] }),
  });
}
