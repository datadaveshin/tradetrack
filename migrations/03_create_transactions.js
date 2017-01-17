
exports.up = function(knex, Promise) {
  return knex.schema.createTable('transactions', function (table) {
    table.increments();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('stock_id').notNullable().references('id').inTable('stocks').onDelete('CASCADE');
    table.boolean('closed_flag').defaultTo(false);
    table.dateTime('trade_date');
    table.decimal('share_price').notNullable();
    table.decimal('num_shares').notNullable();
    table.string('action').defaultTo('').notNullable();
    table.string('direction').defaultTo('').notNullable();
    table.decimal('commission').defaultTo(0).notNullable();
    table.decimal('fees').defaultTo(0).notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('transactions');
};
