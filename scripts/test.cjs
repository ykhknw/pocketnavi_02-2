// scripts/simple-t-residence-check.cjs
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function quickCheck() {
  const { data, error } = await supabase
    .from('buildings_table_2')
    .select('building_id, title, location')
    .eq('slug', 'cornes-house')
    .order('building_id');

  if (error) {
    console.error('❌ エラー:', error);
    return;
  }

  console.log(`✅ "cornes-house" 件数: ${data?.length || 0}件\n`);
  
  data?.forEach((item, i) => {
    console.log(`${i + 1}. ID: ${item.building_id} | ${item.title} | ${item.location}`);
  });
}

quickCheck();