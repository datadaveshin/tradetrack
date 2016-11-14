
exports.up = function(knex, Promise) {
  return knex.schema.createTable('stocks', function (table) {
    table.increments();
    table.integer('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    table.string('ticker').notNullable();
    table.string('cusip').defaultTo('').notNullable();
    table.decimal('last_close_price');
    table.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('stocks');
};
