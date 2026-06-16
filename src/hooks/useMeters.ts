import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Meter, MeterInput } from '../types';

const KEY = ['meters'];

export function useMeters() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Meter[]> => {
      const { data, error } = await supabase
        .from('meters')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Meter[];
    },
  });
}

export function useMeter(id: string | undefined) {
  const { data } = useMeters();
  return data?.find((m) => m.id === id);
}

export function useCreateMeter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MeterInput): Promise<Meter> => {
      const { data, error } = await supabase.from('meters').insert(input).select().single();
      if (error) throw error;
      return data as Meter;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateMeter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: MeterInput }): Promise<Meter> => {
      const { data, error } = await supabase
        .from('meters')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Meter;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteMeter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('meters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
