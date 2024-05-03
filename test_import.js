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

        if (jsonData['playlists']) {
            const playlists = jsonData['playlists']

            const artistIds = await getArtists()
            const albumIds = await getAlbums()
            const musicIds = await getMusics()
            const playlistIds = await getPlaylists()

            const valuesAlbum = []
            const valuesArtist = []
            const valuesMusic = []
            const valuesMusicPlaylist = []
            const valuesPlaylist = []

            for (const playlist of playlists) {
                
                if (playlistIds.includes((playlist['pid'] + 1))) {
                    continue
                }
                valuesPlaylist.push(`(
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
                    if (!albumIds.includes(track['album_uri'])) {

                        if (!artistIds.includes(track['artist_uri'])) {
                            valuesArtist.push(`('${track['artist_uri']}', '${track['artist_name'].replace(/'/g, "''")}')`)
                            artistIds.push(track['artist_uri'])
                        }

                        valuesAlbum.push(`('${track['album_uri']}', '${track['album_name'].replace(/'/g, "''")}', '${track['artist_uri']}')`)
                        albumIds.push(track['album_uri'])
                    }


                    if (!musicIds.includes(track['track_uri'])) {

                        valuesMusic.push(`('${track['track_uri']}', '${track['track_name'].replace(/'/g, "''")}', '${track['duration_ms']}', '${track['album_uri']}')`)
                        musicIds.push(track['track_uri'])
                    }

                    valuesMusicPlaylist.push(`('${playlist['pid'] + 1}', '${track['track_uri']}', '${track['pos']}')`)
                }
            }
        }

        await client.end();
    })
}


async function getArtists() {
    try {
        const result = await client.query(`
            SELECT artist_uri FROM "Artist"
        `)
        const artists = result.rows.map(row => row.artist_uri)
        return artists

    } catch (err) {
        console.error(err)
    }
}

async function getAlbums() {
    try {
        const result = await client.query(`
            SELECT album_uri FROM "Album"
        `)
        const albums = result.rows.map(row => row.album_uri)
        return albums

    } catch (err) {
        console.error(err)
    }
}

async function getMusics() {
    try {
        const result = await client.query(`
            SELECT track_uri FROM "Music"
        `)
        return result.rows.map(row => row.track_uri)

    } catch (err) {
        console.error(err)
    }
}

async function getPlaylists() {
    try {
        const result = await client.query(`
            SELECT playlist_id FROM "Playlist"
        `)
        return result.rows.map(row => row.playlist_id)

    } catch (err) {
        console.error(err)
    }
}

insert()