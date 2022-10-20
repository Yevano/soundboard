import express from 'express'
import cors from 'cors'
import { Dir, Dirent, existsSync, fstat } from 'node:fs'
import { FileHandle, mkdir, open, opendir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import multer from 'multer'

import { FileMeta, StoreMeta } from './webapi-types'
import { DatabaseStore } from './db'

const app = express()
app.use(cors({
    origin: '*'
}))
const audioDirPath = 'store/audio'
const storage = multer.diskStorage({ destination: audioDirPath })
const storeAudio = multer({ storage })

const db = new DatabaseStore()

async function getStoreMeta() {
    return JSON.parse((await readFile('store/metadata.json')).toString()) as StoreMeta
}

async function setStoreMeta(meta: StoreMeta) {
    await writeFile('store/metadata.json', JSON.stringify(meta))
}

async function initStore() {
    let storeDir: Dir | undefined
    let audioDir: Dir | undefined
    let metaFile: FileHandle | undefined

    try {
        storeDir = await opendir('store')
    } catch (err) {
        await mkdir('store')
    } finally {
        if (storeDir) {
            await storeDir.close()
        }
    }

    try {
        audioDir = await opendir('store/audio')
    } catch (err) {
        await mkdir('store/audio')
    } finally {
        if (audioDir) {
            await audioDir.close()
        }
    }

    try {
        metaFile = await open('store/metadata.json')
    } catch (err) {
        await writeFile('store/metadata.json', JSON.stringify({
            fileMetas: [ ]
        }))
    } finally {
        if (metaFile) {
            metaFile.close()
        }
    }

    app.listen(8081)
}

app.get('/list-audio', async (req, res) => {
    const meta = await getStoreMeta()
    res.send(JSON.stringify(meta.fileMetas))
})

app.get('/get-audio/:name', async (req, res) => {
    const audioFileName = req.params.name
    const absolutePath = path.resolve(`${audioDirPath}/${audioFileName}`)
    console.log(`Send file: ${absolutePath}`)
    res.sendFile(absolutePath)
})

app.post('/put-audio/:name', storeAudio.single('recording'), async (req, res) => {
    const { name } = req.body as { name: string }
    
    console.log(req.file)
    const storageFile = req.file

    if (storageFile === undefined) {
        res.json({ error: 'error' })
    } else {
        const meta = await getStoreMeta()
        meta.fileMetas.push({ name, fileName: storageFile?.filename })
        await setStoreMeta(meta)
        res.json({ fileName: storageFile.filename })
    }
})

initStore()
