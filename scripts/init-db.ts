import { supabase } from '../lib/supabase/client';

async function initDatabase() {
  try {
    // 检查核心表是否存在
    const { data: existingTables, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .ilike('tablename', 'config');

    if (error) throw error;

    // 如果不存在配置表则创建
    if (!existingTables?.length) {
      await supabase.rpc(`
        CREATE TABLE config (
          id SERIAL PRIMARY KEY,
          initialized BOOLEAN NOT NULL DEFAULT false,
          initialized_at TIMESTAMP WITH TIME ZONE
        );
      `);
      
      // 插入初始化记录
      await supabase
        .from('config')
        .insert({ initialized: true, initialized_at: new Date().toISOString() });
    }
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

initDatabase();