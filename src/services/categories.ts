import { supabase } from '../lib/supabase';
import { normalizeError, ValidationError } from '../utils/errors';
import type { Category } from '../types/database';
import { generateSlug } from '../utils/slug';

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  sort_order?: number;
  seller_id?: number | null;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  sort_order?: number;
  seller_id?: number | null;
}

export const categoriesService = {
  /**
   * Все категории (без фильтра). Используется редко — например, админом
   * для полного аудита.
   */
  async getAll(sellerId: number | null = null): Promise<Category[]> {
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (sellerId !== null) {
        query = query.eq('seller_id', sellerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    } catch (e) {
      console.error('[categoriesService.getAll]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Только общие категории (seller_id IS NULL). Создаёт их админ.
   */
  async getCommon(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('seller_id', null)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data ?? [];
    } catch (e) {
      console.error('[categoriesService.getCommon]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Личные категории продавца (seller_id = X). Видит только он.
   */
  async getMine(sellerId: number): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('seller_id', sellerId)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data ?? [];
    } catch (e) {
      console.error('[categoriesService.getMine]', e);
      throw normalizeError(e);
    }
  },

  /**
   * «Видимые» категории для продавца: общие + свои.
   */
  async getVisible(sellerId: number): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`seller_id.is.null,seller_id.eq.${sellerId}`)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data ?? [];
    } catch (e) {
      console.error('[categoriesService.getVisible]', e);
      throw normalizeError(e);
    }
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    if (!input.name?.trim()) {
      throw new ValidationError('Название категории обязательно');
    }

    const slug = input.slug?.trim() || generateSlug(input.name);

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: input.name.trim(),
          slug,
          description: input.description?.trim() || null,
          sort_order: input.sort_order ?? 0,
          seller_id: input.seller_id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[categoriesService.create]', e);
      throw normalizeError(e);
    }
  },

  async update(
    id: number,
    updates: UpdateCategoryInput
  ): Promise<Category> {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.slug !== undefined) payload.slug = updates.slug.trim();
      if (updates.description !== undefined)
        payload.description = updates.description?.trim() || null;
      if (updates.sort_order !== undefined)
        payload.sort_order = updates.sort_order;
      if (updates.seller_id !== undefined)
        payload.seller_id = updates.seller_id;

      const { data, error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[categoriesService.update]', e);
      throw normalizeError(e);
    }
  },

  async remove(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.error('[categoriesService.remove]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Переименовать категорию во всех товарах, где она использовалась.
   * sellerId — если передан, ограничиваемся товарами этого продавца.
   */
  async renameInProducts(
    oldName: string,
    newName: string,
    sellerId?: number | null
  ): Promise<void> {
    try {
      let query = supabase
        .from('products')
        .update({ category: newName })
        .eq('category', oldName);

      if (sellerId !== undefined && sellerId !== null) {
        query = query.eq('seller_id', sellerId);
      }

      const { error } = await query;
      if (error) throw error;
    } catch (e) {
      console.error('[categoriesService.renameInProducts]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Проверка: занято ли имя категории в заданном скоупе.
   */
  async isNameTaken(
    name: string,
    excludeId?: number,
    sellerId: number | null = null
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .ilike('name', name.trim());

      if (sellerId === null) {
        query = query.is('seller_id', null);
      } else {
        query = query.eq('seller_id', sellerId);
      }

      if (excludeId !== undefined) {
        query = query.neq('id', excludeId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return (count ?? 0) > 0;
    } catch (e) {
      console.error('[categoriesService.isNameTaken]', e);
      return false;
    }
  },

  /**
   * Проверка: занят ли slug в заданном скоупе.
   */
  async isSlugTaken(
    slug: string,
    excludeId?: number,
    sellerId: number | null = null
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('slug', slug.trim());

      if (sellerId === null) {
        query = query.is('seller_id', null);
      } else {
        query = query.eq('seller_id', sellerId);
      }

      if (excludeId !== undefined) {
        query = query.neq('id', excludeId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return (count ?? 0) > 0;
    } catch (e) {
      console.error('[categoriesService.isSlugTaken]', e);
      return false;
    }
  },
};