-- 创建收支记录表
create table if not exists finance_records (
    id uuid default gen_random_uuid() primary key,
    type varchar(10) not null check (type in ('income', 'expense')), -- 收支类型：收入/支出
    name varchar(100) not null, -- 收支名称
    amount decimal(10,2) not null, -- 金额
    record_date date not null, -- 记录日期
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    deleted_at timestamp with time zone -- 软删除
);

-- 添加RLS策略
alter table finance_records enable row level security;

-- 创建触发器函数来自动更新updated_at字段
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- 为finance_records表创建更新触发器
create trigger update_finance_records_updated_at
    before update on finance_records
    for each row
    execute function update_updated_at_column();