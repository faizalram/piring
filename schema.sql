-- Piring schema. Paste into the Neon SQL Editor and run once.

create table if not exists users (
  id          uuid primary key,
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists credentials (
  id          text primary key,
  user_id     uuid not null references users(id) on delete cascade,
  public_key  text not null,
  counter     bigint not null default 0,
  transports  text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists meals (
  id          uuid primary key,
  user_id     uuid not null references users(id) on delete cascade,
  eaten_at    timestamptz not null,
  name        text not null,
  thumb       text,
  model       text,
  created_at  timestamptz not null default now()
);

-- Nutrition is stored at the model's estimated portion (factor 1).
-- The portion chips only change factor, so you can always go back to 1x.
create table if not exists meal_items (
  id          uuid primary key default gen_random_uuid(),
  meal_id     uuid not null references meals(id) on delete cascade,
  position    integer not null,
  food_id     text not null,
  label       text not null,
  source      text not null check (source in ('catalog', 'estimate', 'label')),
  confidence  text not null default 'medium',
  grams       real not null,
  servings    real,
  kcal        real not null,
  protein     real not null,
  carbs       real not null,
  fat         real not null,
  factor      real not null default 1
);

create index if not exists meals_user_eaten on meals (user_id, eaten_at);
create index if not exists meal_items_meal on meal_items (meal_id);
create index if not exists credentials_user on credentials (user_id);
