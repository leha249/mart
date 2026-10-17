import { supabase } from '../lib/supabase';
import { normalizeError, ValidationError } from '../utils/errors';
import type { Seller, SellerStatus, UISeller } from '../types/database';
import { mapSellerToUI } from '../types/database';

export interface UpdateSellerInput {
  name?: string;
  description?: string | null;
  logo?: string | null;
  cover?: string | null;
  phone?: string | null;
  email?: string | null;

  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_image?: string | null;
  hero_badge?: string | null;
  about_title?: string | null;
  about_text?: string | null;
  about_image?: string | null;
  about_badge?: string | null;
  footer_text?: string | null;
  accent_color?: string | null;
}

export const sellersService = {
  /**
   * Все продавцы (для админа)
   */
  async getAll(): Promise<UISeller[]> {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map(mapSellerToUI);
    } catch (e) {
      console.error('[sellersService.getAll]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Только активные продавцы (для покупателей)
   */
  async getActive(): Promise<UISeller[]> {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapSellerToUI);
    } catch (e) {
      console.error('[sellersService.getActive]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Продавец по slug (публичная страница)
   */
  async getBySlug(slug: string): Promise<UISeller | null> {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('slug', slug.trim())
        .maybeSingle();

      if (error) throw error;
      return data ? mapSellerToUI(data) : null;
    } catch (e) {
      console.error('[sellersService.getBySlug]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Продавец по id
   */
  async getById(id: number): Promise<UISeller | null> {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapSellerToUI(data) : null;
    } catch (e) {
      console.error('[sellersService.getById]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Продавец текущего авторизованного пользователя
   */
  async getMy(): Promise<UISeller | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return null;

      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (error) throw error;
      return data ? mapSellerToUI(data) : null;
    } catch (e) {
      console.error('[sellersService.getMy]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Обновить профиль продавца (продавец — свой, админ — любой)
   */
  async update(id: number, input: UpdateSellerInput): Promise<UISeller> {
    if (input.name !== undefined && !input.name.trim()) {
      throw new ValidationError('Название магазина не может быть пустым');
    }

    try {
      const payload: Record<string, unknown> = { ...input };
      if (input.name !== undefined) payload.name = input.name.trim();
      if (input.email !== undefined) payload.email = input.email?.trim() || null;
      if (input.phone !== undefined) payload.phone = input.phone?.trim() || null;

      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('sellers')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapSellerToUI(data);
    } catch (e) {
      console.error('[sellersService.update]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Сменить статус продавца (только админ)
   */
  async updateStatus(id: number, status: SellerStatus): Promise<void> {
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.error('[sellersService.updateStatus]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Сменить slug продавца (только админ, через прямой вызов)
   */
  async updateSlug(id: number, slug: string): Promise<void> {
    const clean = slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(clean)) {
      throw new ValidationError(
        'Slug может содержать только латиницу, цифры и дефис'
      );
    }

    try {
      const { error } = await supabase
        .from('sellers')
        .update({ slug: clean, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        if (error.code === '23505') {
          throw new ValidationError('Такой slug уже занят');
        }
        throw error;
      }
    } catch (e) {
      console.error('[sellersService.updateSlug]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Сырые данные (для контекста с realtime)
   */
  async getRawAll(): Promise<Seller[]> {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch (e) {
      throw normalizeError(e);
    }
  },
};