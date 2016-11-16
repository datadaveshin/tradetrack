
exports.up = function(knex, Promise) {
  return knex.schema.createTable('stocks', function (table) {
    table.increments();
    table.string('ticker').notNullable();
    table.string('company_name').defaultTo('');
    table.string('cusip').defaultTo('').notNullable();
    table.decimal('last_close_price').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('stocks');
};
