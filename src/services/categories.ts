import { supabase } from '../lib/supabase';
import type { Category } from '../types/database';

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to load categories:', error);
      throw error;
    }
    return data ?? [];
  },

  async getById(id: number): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(
    category: Omit<Category, 'id' | 'created_at'>
  ): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(
    id: number,
    updates: Partial<Omit<Category, 'id' | 'created_at'>>
  ): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async remove(id: number): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },

  async isNameTaken(name: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('categories')
      .select('id')
      .eq('name', name.trim());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },

  async isSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('categories')
      .select('id')
      .eq('slug', slug.trim());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },

  async getProductsCountByCategoryName(name: string): Promise<number> {
    const { count, error } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category', name);

    if (error) throw error;
    return count ?? 0;
  },

  async renameInProducts(oldName: string, newName: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ category: newName })
      .eq('category', oldName);

    if (error) throw error;
  },
};