import { supabase } from '../lib/supabase';
import { normalizeError } from '../utils/errors';
import type { Product } from '../types/database';

export interface ProductsPage {
  products: Product[];
  total: number;
  hasMore: boolean;
}

export const productsService = {
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch (e) {
      console.error('[productsService.getAll]', e);
      throw normalizeError(e);
    }
  },

  async getPage(
    limit = 20,
    offset = 0,
    filters?: { category?: string; search?: string }
  ): Promise<ProductsPage> {
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters?.category && filters.category !== 'Все') {
        query = query.eq('category', filters.category);
      }

      if (filters?.search?.trim()) {
        const q = filters.search.trim();
        query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const total = count ?? 0;
      return {
        products: data ?? [],
        total,
        hasMore: offset + limit < total,
      };
    } catch (e) {
      console.error('[productsService.getPage]', e);
      throw normalizeError(e);
    }
  },

  async getById(id: number): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[productsService.getById]', e);
      throw normalizeError(e);
    }
  },

  async create(
    product: Omit<Product, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[productsService.create]', e);
      throw normalizeError(e);
    }
  },

  async update(id: number, updates: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[productsService.update]', e);
      throw normalizeError(e);
    }
  },

  async remove(id: number): Promise<void> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('[productsService.remove]', e);
      throw normalizeError(e);
    }
  },
};