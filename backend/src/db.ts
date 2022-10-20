import { getCiphers } from 'crypto'
import { readFileSync } from 'fs'
import mysql, { Connection } from 'mysql2'

export class DatabaseStore {
    private readonly connection: Connection
    private readonly statements: StatementLoader

    constructor() {
        this.statements = new StatementLoader()

        this.connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            database: 'soundboard',
        })

        this.connection.execute(this.statements.get('create-users'))
    }
}

class StatementLoader {
    private readonly statements: { [key: string]: string } = { }

    get(name: string) {
        if (this.statements[name] === undefined) {
            this.statements[name] = readFileSync(`src/sql/${name}.sql`).toString()
        }
        return this.statements[name]
    }
}
