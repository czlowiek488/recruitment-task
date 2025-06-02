import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('baseTable')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('counter', 'integer', (col) => col.notNull())
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('baseTable').execute()
}
