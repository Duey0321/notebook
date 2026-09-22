// lib/supabase-storage.ts
import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabaseのURLとAnon Keyを取得（Next.jsの標準的な命名）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadFileToSupabase(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const filePath = `proposals/${fileName}`;

  // 💡 バケット名が「attachment」で正しいか再確認してください
  const { data, error } = await supabase.storage
    .from('attachment') 
    .upload(filePath, file);

  if (error) {
    console.error('Supabaseアップロードエラー詳細:', error); // 詳細なエラーをログに出す
    throw new Error('ファイルのアップロードに失敗しました');
  }

  const { data: urlData } = supabase.storage
    .from('attachment')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}