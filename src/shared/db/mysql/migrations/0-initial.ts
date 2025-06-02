import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('baseTable')
    .addColumn('id', 'varchar(255)', (col) => col.primaryKey().notNull())
    .addColumn('counter', 'numeric', (col) => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('baseTable').execute()
}
