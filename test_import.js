const {Client} = require('pg')
const fs = require('fs')

const filePath = './mpd.slice.0-999.json'

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'app',
    password: 'password',
    port: 5432
})


async function insert() {
    fs.readFile(filePath, 'utf-8', async (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier : ', err)
            return
        }
    
        const jsonData = JSON.parse(data)
        console.log('Connection database')
        await client.connect()

        let valuesAlbum = new Set()
        let valuesArtist = new Set()
        let valuesMusic = new Set()
        let valuesMusicPlaylist = new Set()
        let valuesPlaylist = new Set()

        for (const playlist of jsonData['playlists']) {

            valuesPlaylist.add(`(
                '${playlist['pid'] +1 }',
                '${playlist['name'].replace(/'/g, "''")}',
                '${playlist['collaborative']}',
                '${playlist['modified_at']}',
                '${playlist['num_followers']}',
                '${playlist['num_edits']}',
                '${playlist['num_albums']}',
                '${playlist['num_tracks']}',
                '${playlist['num_artists']}',
                '${playlist['duration_ms']}'
            )`)

            for (const track of playlist['tracks']) {
                valuesArtist.add(`('${track['artist_uri']}', '${track['artist_name'].replace(/'/g, "''")}')`)
                valuesAlbum.add(`('${track['album_uri']}', '${track['album_name'].replace(/'/g, "''")}', '${track['artist_uri']}')`)
                valuesMusic.add(`('${track['track_uri']}', '${track['track_name'].replace(/'/g, "''")}', '${track['duration_ms']}', '${track['album_uri']}')`)
                valuesMusicPlaylist.add(`('${playlist['pid'] + 1}', '${track['track_uri']}', '${track['pos']}')`)
            }
        }

        client.query(`
            INSERT INTO "Playlist" ("playlist_id", "name", "collaborative", "modified_at", "num_followers", "num_edits", "num_albums", "num_tracks", "num_artists", "duration_ms")
            VALUES ${Array.from(valuesPlaylist).join(',')}
            ON CONFLICT ("playlist_id") DO NOTHING;
        `);

        await client.query(`
            INSERT INTO "Artist" ("artist_uri", "name")
            VALUES ${Array.from(valuesArtist).join(',')}
            ON CONFLICT ("artist_uri") DO NOTHING;
        `)

        await client.query(`
            INSERT INTO "Album" ("album_uri", "name", "artist_uri")
            VALUES ${Array.from(valuesAlbum).join(',')}
            ON CONFLICT ("album_uri") DO NOTHING;
        `)

        await client.query(`
            INSERT INTO "Music" ("track_uri", "title", "duration_ms", "album_uri")
            VALUES ${Array.from(valuesMusic).join(',')}
            ON CONFLICT ("track_uri") DO NOTHING;
        `)

        await client.query(`
            INSERT INTO "Music_Playlist" ("playlist_id", "track_uri", "pos")
            VALUES ${Array.from(valuesMusicPlaylist).join(',')}
        `)
    
        await client.end();
    })
}

insert()