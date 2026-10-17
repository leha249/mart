import { supabase } from '../lib/supabase';
import type { Category } from '../types/database';

export const categoriesService = {
  /**
   * Список категорий.
   * Если sellerId передан — только категории этого продавца.
   * Если не передан — все категории активных продавцов (для публичной страницы).
   */
  async getAll(sellerId: number | null = null): Promise<Category[]> {
    let query = supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (sellerId !== null) {
      query = query.eq('seller_id', sellerId);
    }

    const { data, error } = await query;

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
    updates: Partial<Omit<Category, 'id' | 'created_at' | 'seller_id'>>
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

  async isNameTaken(
    name: string,
    excludeId?: number,
    sellerId?: number | null
  ): Promise<boolean> {
    let query = supabase
      .from('categories')
      .select('id')
      .eq('name', name.trim());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    if (sellerId !== undefined) {
      if (sellerId === null) {
        query = query.is('seller_id', null);
      } else {
        query = query.eq('seller_id', sellerId);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },

  async isSlugTaken(
    slug: string,
    excludeId?: number,
    sellerId?: number | null
  ): Promise<boolean> {
    let query = supabase
      .from('categories')
      .select('id')
      .eq('slug', slug.trim());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    if (sellerId !== undefined) {
      if (sellerId === null) {
        query = query.is('seller_id', null);
      } else {
        query = query.eq('seller_id', sellerId);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },

  async getProductsCountByCategoryName(
    name: string,
    sellerId: number | null = null
  ): Promise<number> {
    let query = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category', name);

    if (sellerId !== null) {
      query = query.eq('seller_id', sellerId);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count ?? 0;
  },

  /**
   * Переименовать категорию во всех товарах.
   * Если sellerId передан — только в товарах этого продавца.
   */
  async renameInProducts(
    oldName: string,
    newName: string,
    sellerId: number | null = null
  ): Promise<void> {
    let query = supabase
      .from('products')
      .update({ category: newName })
      .eq('category', oldName);

    if (sellerId !== null) {
      query = query.eq('seller_id', sellerId);
    }

    const { error } = await query;

    if (error) throw error;
  },
};