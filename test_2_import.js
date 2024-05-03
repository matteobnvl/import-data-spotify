const { Client } = require('pg');
const fs = require('fs').promises;

const filePath = './mpd.slice.0-999.json';

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'app',
    password: 'password',
    port: 5432
});

async function insert() {
    try {
        await client.connect();
        console.log('Connected to database');

        const data = await fs.readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(data);

        if (!jsonData.playlists) return;

        const playlists = jsonData.playlists;
        const artistIds = new Set(await getArtists());
        const albumIds = new Set(await getAlbums());
        const musicIds = new Set(await getMusics());
        const playlistIds = new Set(await getPlaylists());

        const valuesAlbum = [];
        const valuesArtist = [];
        const valuesMusic = [];
        const valuesMusicPlaylist = [];
        const valuesPlaylist = [];

        for (const playlist of playlists) {
            const pid = playlist.pid + 1;

            if (playlistIds.has(pid)) continue;

            valuesPlaylist.push([
                playlist.name.replace(/'/g, "''"),
                playlist.collaborative,
                playlist.modified_at,
                playlist.num_followers,
                playlist.num_edits,
                playlist.num_albums,
                playlist.num_tracks,
                playlist.num_artists,
                playlist.duration_ms
            ]);

            for (const track of playlist.tracks) {
                if (!albumIds.has(track.album_uri)) {
                    if (!artistIds.has(track.artist_uri)) {
                        valuesArtist.push([track.artist_uri, track.artist_name.replace(/'/g, "''")]);
                        artistIds.add(track.artist_uri);
                    }
                    valuesAlbum.push([track.album_uri, track.album_name.replace(/'/g, "''"), track.artist_uri]);
                    albumIds.add(track.album_uri);
                }

                if (!musicIds.has(track.track_uri)) {
                    valuesMusic.push([track.track_uri, track.track_name.replace(/'/g, "''"), track.duration_ms, track.album_uri]);
                    musicIds.add(track.track_uri);
                }

                valuesMusicPlaylist.push([pid, track.track_uri, track.pos]);
            }
        }

        await client.query('BEGIN');

        if (valuesPlaylist.length > 0) {
            await client.query(`
                INSERT INTO "Playlist" ("name", "collaborative", "modified_at", "num_followers", "num_edits", "num_albums", "num_tracks", "num_artists", "duration_ms")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, valuesPlaylist.flat());
        }

        if (valuesArtist.length > 0) {
            await client.query(`
                INSERT INTO "Artist" ("artist_uri", "name")
                VALUES ${valuesArtist.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(',')}
            `, valuesArtist.flat());
        }

        if (valuesAlbum.length > 0) {
            await client.query(`
                INSERT INTO "Album" ("album_uri", "name", "artist_uri")
                VALUES ${valuesAlbum.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`).join(',')}
            `, valuesAlbum.flat());
        }

        if (valuesMusic.length > 0) {
            await client.query(`
                INSERT INTO "Music" ("track_uri", "title", "duration_ms", "album_uri")
                VALUES ${valuesMusic.map((_, index) => `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`).join(',')}
            `, valuesMusic.flat());
        }

        if (valuesMusicPlaylist.length > 0) {
            await client.query(`
                INSERT INTO "Music_Playlist" ("playlist_id", "track_uri", "pos")
                VALUES ${valuesMusicPlaylist.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`).join(',')}
            `, valuesMusicPlaylist.flat());
        }

        await client.query('COMMIT');
        console.log('Data inserted successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error:', error);
    } finally {
        await client.end();
        console.log('Connection closed');
    }
}

async function getArtists() {
    try {
        const result = await client.query('SELECT artist_uri FROM "Artist"');
        return result.rows.map(row => row.artist_uri);
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function getAlbums() {
    try {
        const result = await client.query('SELECT album_uri FROM "Album"');
        return result.rows.map(row => row.album_uri);
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function getMusics() {
    try {
        const result = await client.query('SELECT track_uri FROM "Music"');
        return result.rows.map(row => row.track_uri);
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function getPlaylists() {
    try {
        const result = await client.query('SELECT playlist_id FROM "Playlist"');
        return result.rows.map(row => row.playlist_id);
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

insert();
