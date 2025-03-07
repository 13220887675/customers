export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          name: string
          phone: string
          birth_date: string
          remaining_classes: number
          role: 'admin' | 'member'
          password: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          phone: string
          birth_date: string
          remaining_classes: number
          role?: 'admin' | 'member'
          password: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          phone?: string
          birth_date?: string
          remaining_classes?: number
          role?: 'admin' | 'member'
          password?: string
        }
      }
      coaches: {
        Row: {
          id: string
          created_at: string
          name: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
        }
      }
      class_records: {
        Row: {
          id: string
          created_at: string
          user_id: string
          coach_id: string
          class_date: string
          coach_fee: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          coach_id: string
          class_date: string
          coach_fee: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          coach_id?: string
          class_date?: string
          coach_fee?: number
        }
      }
      course_purchases: {
        Row: {
          id: string
          created_at: string
          user_id: string
          amount: number
          quantity: number
          purchase_date: string
          valid_days: number
          expiry_date: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          amount: number
          quantity: number
          purchase_date: string
          valid_days: number
          expiry_date: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          amount?: number
          quantity?: number
          purchase_date?: string
          valid_days?: number
          expiry_date?: string
        }
      }
      transactions: {
        Row: {
          id: string
          created_at: string
          name: string
          amount: number
          date: string
          type: 'income' | 'expense'
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          amount: number
          date: string
          type: 'income' | 'expense'
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          amount?: number
          date?: string
          type?: 'income' | 'expense'
        }
      }
    }
  }
}