import { supabase } from '../lib/supabase';
import { normalizeError, ValidationError } from '../utils/errors';
import type { Promocode } from '../types/database';

export interface CreatePromoInput {
  code: string;
  discount_percent: number;
  min_total: number;
  max_uses: number | null;
  expires_at: string | null;
  active: boolean;
  seller_id: number | null;
}

const validate = (input: CreatePromoInput) => {
  const code = input.code.trim().toUpperCase();
  if (!code) throw new ValidationError('Введите код');
  if (code.length < 3) throw new ValidationError('Код слишком короткий');
  if (code.length > 20) throw new ValidationError('Код слишком длинный');
  if (!/^[A-Z0-9_-]+$/.test(code))
    throw new ValidationError('Только латиница, цифры, _ и -');
  if (input.discount_percent <= 0 || input.discount_percent > 100)
    throw new ValidationError('Скидка должна быть 1-100%');
  if (input.min_total < 0) throw new ValidationError('Мин. сумма ≥ 0');
  if (input.max_uses !== null && input.max_uses < 1)
    throw new ValidationError('Лимит использований ≥ 1');
};

export const promocodesService = {
  /**
   * Список промокодов.
   * Если sellerId передан — только промокоды этого продавца.
   * Если не передан — все промокоды (для админа).
   */
  async getAll(sellerId: number | null = null): Promise<Promocode[]> {
    try {
      let query = supabase
        .from('promocodes')
        .select('*')
        .order('created_at', { ascending: false });

      if (sellerId !== null) {
        query = query.eq('seller_id', sellerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    } catch (e) {
      console.error('[promocodesService.getAll]', e);
      throw normalizeError(e);
    }
  },

  async getById(id: number): Promise<Promocode | null> {
    try {
      const { data, error } = await supabase
        .from('promocodes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  /**
   * Найти активный промокод по коду в рамках продавца (или глобальный)
   */
  async findByCode(
    code: string,
    sellerId: number | null = null
  ): Promise<Promocode | null> {
    try {
      let query = supabase
        .from('promocodes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('active', true);

      if (sellerId !== null) {
        query = query.eq('seller_id', sellerId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async create(input: CreatePromoInput): Promise<Promocode> {
    validate(input);

    try {
      const { data, error } = await supabase
        .from('promocodes')
        .insert({
          ...input,
          code: input.code.trim().toUpperCase(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new ValidationError('Промокод с таким кодом уже существует');
        }
        throw error;
      }
      return data;
    } catch (e) {
      console.error('[promocodesService.create]', e);
      throw normalizeError(e);
    }
  },

  async update(
    id: number,
    input: Partial<Omit<CreatePromoInput, 'seller_id'>>
  ): Promise<Promocode> {
    try {
      const payload: Record<string, unknown> = { ...input };
      if (input.code) payload.code = input.code.trim().toUpperCase();

      const { data, error } = await supabase
        .from('promocodes')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new ValidationError('Промокод с таким кодом уже существует');
        }
        throw error;
      }
      return data;
    } catch (e) {
      console.error('[promocodesService.update]', e);
      throw normalizeError(e);
    }
  },

  async toggleActive(id: number, active: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('promocodes')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async remove(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('promocodes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      throw normalizeError(e);
    }
  },
};