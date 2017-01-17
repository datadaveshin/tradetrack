
exports.up = function(knex, Promise) {
  return knex.schema.createTable('tags', function (table) {
    table.increments();
    table.integer('tag_type_id').notNullable().references('id').inTable('tag_types').onDelete('CASCADE');
    table.string('tag_name').defaultTo('').notNullable();
    table.string('tag_description').defaultTo('').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('tags');
};
